import { notasDoCompasso, obterPartitura, type Nota, type Partitura } from './partitura';
import { criarSintetizador, type Sintetizador } from './timbres';

export interface MotorRadiola {
  /** Começa a tocar a faixa a partir de posicaoSeg segundos, inclusive no meio da música. */
  tocar(faixaId: string, posicaoSeg: number): void;
  parar(): void;
  /** 0..1, com rampa curta para não estalar. */
  definirVolume(v: number): void;
  /** Abafa com filtro passa-baixas e ganho menor. */
  abafar(sim: boolean): void;
  /** RMS suavizado, entre 0 e 1, para as luzes do bar. */
  nivel(): number;
  /** Pulso de cada batida, entre 0 e 1, com decaimento exponencial. */
  batida(): number;
  estado(): { faixaId: string | null; posicao: number };
  /** Libera vozes, temporizadores e o AudioContext. */
  destruir(): void;
}

const contextos = new Set<AudioContext>();
function retomar(ctx: AudioContext): void {
  if (ctx.state !== 'closed') void ctx.resume().catch(() => { /* O próximo gesto pode tentar novamente. */ });
}

/** Chamar diretamente em click/keydown. Não cria contexto antes do primeiro tocar(). */
export function destravarAudio(): void {
  contextos.forEach(retomar);
}

interface Saida {
  entrada: GainNode;
  abafamento: GainNode;
  filtro: BiquadFilterNode;
  limite: GainNode;
  analisador: AnalyserNode;
  liberar(): void;
}
function criarSaida(ctx: BaseAudioContext, volume: number, abafado: boolean, lofi: boolean): Saida {
  const entrada = ctx.createGain(), filtro = ctx.createBiquadFilter(), abafamento = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor(), analisador = ctx.createAnalyser();
  const limite = ctx.createGain();
  entrada.gain.value = volume * .78;
  filtro.type = 'lowpass'; filtro.frequency.value = abafado ? 680 : lofi ? 2900 : 6200; filtro.Q.value = .55;
  abafamento.gain.value = abafado ? .32 : 1;
  compressor.threshold.value = -17; compressor.knee.value = 16; compressor.ratio.value = 3.5;
  compressor.attack.value = .004; compressor.release.value = .18;
  analisador.fftSize = 1024; analisador.smoothingTimeConstant = .75;
  entrada.connect(filtro); filtro.connect(abafamento); abafamento.connect(compressor);
  compressor.connect(limite); limite.connect(analisador); analisador.connect(ctx.destination);
  return { entrada, filtro, abafamento, analisador, limite, liberar() {
    entrada.disconnect(); filtro.disconnect(); abafamento.disconnect(); compressor.disconnect(); limite.disconnect(); analisador.disconnect();
  } };
}

interface Execucao {
  partitura: Partitura;
  origem: number;
  porta: GainNode;
  sintetizador: Sintetizador;
  agendarAte(tempoContexto: number): void;
  liberar(): void;
}

// A porta também corta todas as caudas exatamente na duração publicada pelo servidor.
// Ao entrar no meio, reconstituímos as vozes ainda soando usando offsets nos buffers.
function criarExecucao(ctx: BaseAudioContext, destino: AudioNode, p: Partitura, posicao: number, inicio: number): Execucao {
  const origem = inicio - posicao, porta = ctx.createGain();
  porta.connect(destino);
  const fim = origem + p.faixa.duracao;
  const ataque = Math.min(.018, (fim - inicio) / 3);
  porta.gain.setValueAtTime(0, inicio);
  porta.gain.linearRampToValueAtTime(1, inicio + ataque);
  porta.gain.setValueAtTime(1, Math.max(inicio + ataque, fim - .3));
  porta.gain.linearRampToValueAtTime(0, fim);
  const sintetizador = criarSintetizador(ctx, porta, p.faixa.id);
  let barra = Math.max(0, Math.floor((posicao - 10) / p.segundosCompasso));
  let pendentes: Nota[] = [], indice = 0, liberado = false;
  return {
    partitura: p, origem, porta, sintetizador,
    agendarAte(limite) {
      if (liberado) return;
      const agora = Math.max(inicio, ctx.currentTime);
      while (barra * p.segundosCompasso < p.faixa.duracao) {
        if (!pendentes.length) {
          if (origem + barra * p.segundosCompasso > limite) break;
          pendentes = notasDoCompasso(p, barra).sort((a, b) => a.tempo - b.tempo);
          indice = 0;
          if (!pendentes.length) { barra++; continue; }
        }
        while (indice < pendentes.length && origem + pendentes[indice].tempo <= limite) {
          const nota = pendentes[indice++];
          if (origem + nota.tempo + nota.duracao + 1.3 > agora) sintetizador.agendar(nota, origem, agora);
        }
        if (indice < pendentes.length) break;
        pendentes = []; barra++;
      }
    },
    liberar() {
      if (liberado) return;
      liberado = true; sintetizador.liberar(); porta.disconnect(); pendentes = [];
    },
  };
}

function rampa(param: AudioParam, valor: number, agora: number, duracao = .035): void {
  // cancelAndHoldAtTime preserva o valor instantâneo mesmo em mudanças rápidas do HUD.
  param.cancelAndHoldAtTime(agora);
  param.linearRampToValueAtTime(valor, agora + duracao);
}
function limitar(v: number, padrao = 0): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : padrao;
}

// O compressor tem uma pequena latência interna. A última porta fica depois dele,
// garantindo silêncio no instante final inclusive durante sua cauda de processamento.
function marcarFim(saida: Saida, inicio: number, fim: number): void {
  const ataque = Math.min(.018, (fim - inicio) / 3), ganho = saida.limite.gain;
  ganho.cancelAndHoldAtTime(inicio);
  ganho.linearRampToValueAtTime(1, inicio + ataque);
  ganho.setValueAtTime(1, Math.max(inicio + ataque, fim - .04));
  ganho.linearRampToValueAtTime(0, fim);
}

/** Motor sem efeitos colaterais na importação; cada instância possui seu próprio contexto. */
export function criarMotorRadiola(): MotorRadiola {
  let ctx: AudioContext | null = null, saida: Saida | null = null, atual: Execucao | null = null;
  let intervalo: ReturnType<typeof setInterval> | null = null;
  let volume = .5, abafado = false, destruido = false, rms = 0, ultimaLeitura = 0, ultimaPosicao = 0;
  const retiradas = new Map<Execucao, ReturnType<typeof setTimeout>>();
  const dados = new Float32Array(1024);
  function retirar(execucao: Execucao): void {
    if (!ctx) return;
    rampa(execucao.porta.gain, 0, ctx.currentTime, .018);
    const timer = setTimeout(() => { execucao.liberar(); retiradas.delete(execucao); }, 45);
    retiradas.set(execucao, timer);
  }
  function parar(): void {
    if (intervalo !== null) { clearInterval(intervalo); intervalo = null; }
    ultimaPosicao = 0;
    if (atual) { retirar(atual); atual = null; }
    rms = 0;
  }
  function atualizar(): void {
    if (!ctx || !atual) return;
    if (ctx.currentTime >= atual.origem + atual.partitura.faixa.duracao) {
      ultimaPosicao = atual.partitura.faixa.duracao;
      atual.liberar(); atual = null;
      if (intervalo !== null) clearInterval(intervalo);
      intervalo = null;
      return;
    }
    // Se a aba foi suspensa, ignoramos notas já vencidas em vez de disparar uma rajada atrasada.
    atual.agendarAte(ctx.currentTime + .15);
  }
  function estado(): { faixaId: string | null; posicao: number } {
    if (!atual || !ctx) return { faixaId: null, posicao: ultimaPosicao };
    const posicao = Math.min(atual.partitura.faixa.duracao, Math.max(0, ctx.currentTime - atual.origem));
    return { faixaId: posicao >= atual.partitura.faixa.duracao ? null : atual.partitura.faixa.id, posicao };
  }
  return {
    tocar(id, posicaoSeg) {
      if (destruido) return;
      parar();
      const p = obterPartitura(id);
      const posicao = Math.max(0, Number.isFinite(posicaoSeg) ? posicaoSeg : 0);
      ultimaPosicao = p ? Math.min(p.faixa.duracao, posicao) : 0;
      if (!p || posicao >= p.faixa.duracao) return;
      if (!ctx) {
        ctx = new AudioContext({ latencyHint: 'interactive' }); contextos.add(ctx);
        saida = criarSaida(ctx, volume, abafado, id === 'lofi-do-lodo');
      }
      retomar(ctx);
      rampa(saida!.filtro.frequency, abafado ? 680 : id === 'lofi-do-lodo' ? 2900 : 6200, ctx.currentTime, .08);
      atual = criarExecucao(ctx, saida!.entrada, p, posicao, ctx.currentTime + .035);
      marcarFim(saida!, ctx.currentTime, atual.origem + p.faixa.duracao);
      ultimaLeitura = ctx.currentTime;
      atualizar(); intervalo = setInterval(atualizar, 25);
    },
    parar,
    definirVolume(v) {
      volume = limitar(v);
      if (ctx && saida && !destruido) rampa(saida.entrada.gain, volume * .78, ctx.currentTime);
    },
    abafar(sim) {
      abafado = sim;
      if (ctx && saida && !destruido) {
        rampa(saida.abafamento.gain, sim ? .32 : 1, ctx.currentTime, .08);
        rampa(saida.filtro.frequency, sim ? 680 : atual?.partitura.faixa.id === 'lofi-do-lodo' ? 2900 : 6200, ctx.currentTime, .1);
      }
    },
    nivel() {
      if (!ctx || !saida || !atual || ctx.state !== 'running') return 0;
      saida.analisador.getFloatTimeDomainData(dados);
      let soma = 0;
      for (const v of dados) soma += v * v;
      const alvo = limitar(Math.sqrt(soma / dados.length) * 5);
      const dt = Math.max(0, ctx.currentTime - ultimaLeitura);
      rms += (alvo - rms) * (1 - Math.exp(-dt / (alvo > rms ? .045 : .22)));
      ultimaLeitura = ctx.currentTime;
      return limitar(rms);
    },
    batida() {
      if (!atual || !ctx || ctx.state !== 'running' || ctx.currentTime < atual.origem) return 0;
      const e = estado();
      if (!e.faixaId) return 0;
      const beat = 60 / atual.partitura.faixa.bpm;
      return Math.exp(-((e.posicao % beat) / beat) * 7);
    },
    estado,
    destruir() {
      if (destruido) return;
      destruido = true; parar();
      for (const [execucao, timer] of retiradas) { clearTimeout(timer); execucao.liberar(); }
      retiradas.clear(); saida?.liberar(); saida = null;
      if (ctx) { contextos.delete(ctx); void ctx.close().catch(() => {}); ctx = null; }
    },
  };
}

/** Render determinístico para QA/exportação, usando o mesmo agendador e os mesmos timbres do motor.
 * `segundos` é o tamanho do recorte; `posicaoSeg` permite começar no meio. Depois do fim há silêncio.
 * A opção de volume segue o padrão 0,5 do motor; não há alteração de velocidade ou BPM.
 */
export async function renderizarOffline(
  faixaId: string, segundos: number, posicaoSeg = 0, volume = .5,
): Promise<AudioBuffer> {
  const p = obterPartitura(faixaId);
  if (!p) throw new RangeError(`Faixa desconhecida: ${faixaId}`);
  if (!Number.isFinite(segundos) || segundos <= 0 || segundos > 600)
    throw new RangeError('O recorte deve durar entre 0 e 600 segundos.');
  if (!Number.isFinite(posicaoSeg)) throw new RangeError('A posição precisa ser finita.');
  const ctx = new OfflineAudioContext(2, Math.ceil(segundos * 44100), 44100);
  const posicao = Math.max(0, posicaoSeg), saida = criarSaida(ctx, limitar(volume), false, faixaId === 'lofi-do-lodo');
  const execucao = posicao < p.faixa.duracao ? criarExecucao(ctx, saida.entrada, p, posicao, 0) : null;
  if (execucao) marcarFim(saida, 0, p.faixa.duracao - posicao);
  // OfflineAudioContext não avança antes de startRendering: alimentamos o mesmo núcleo em janelas de 150 ms.
  for (let t = 0; execucao && t < segundos + .15; t += .15) execucao.agendarAte(Math.min(segundos, t));
  try { return await ctx.startRendering(); }
  finally { execucao?.liberar(); saida.liberar(); }
}
