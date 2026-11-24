import { acaso, sementeTexto, type Instrumento, type Nota } from './partitura';

const TAU = 2 * Math.PI;
const RUIDOS = new Set<Instrumento>(['caixa', 'palma', 'chocalho', 'poeira']);
const CONFIG: Record<Instrumento, { ganho: number; corte: number; pan: number }> = {
  baixo: { ganho: .66, corte: 1000, pan: 0 },
  sanfona: { ganho: .48, corte: 2700, pan: -.13 },
  violao: { ganho: .7, corte: 3100, pan: -.24 },
  orgao: { ganho: .47, corte: 2200, pan: .22 },
  canto: { ganho: .58, corte: 2300, pan: -.08 },
  piano: { ganho: .8, corte: 2400, pan: -.16 },
  cavaquinho: { ganho: .54, corte: 3400, pan: -.22 },
  celesta: { ganho: .62, corte: 4100, pan: .16 },
  concertina: { ganho: .46, corte: 2500, pan: -.1 },
  bumbo: { ganho: .92, corte: 900, pan: 0 },
  aro: { ganho: .56, corte: 3200, pan: .27 },
  caixa: { ganho: .47, corte: 2800, pan: .12 },
  palma: { ganho: .55, corte: 3000, pan: .18 },
  triangulo: { ganho: .4, corte: 4400, pan: .35 },
  chocalho: { ganho: .42, corte: 4100, pan: -.32 },
  tamborim: { ganho: .5, corte: 3300, pan: .25 },
  poeira: { ganho: .18, corte: 2200, pan: -.4 },
};

interface Banco { ruido: AudioBuffer; amostras: Map<string, AudioBuffer> }
const bancos = new WeakMap<BaseAudioContext, Banco>();
function banco(ctx: BaseAudioContext): Banco {
  let b = bancos.get(ctx);
  if (!b) {
    const ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), dados = ruido.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = acaso(i + 137) * 2 - 1;
    b = { ruido, amostras: new Map() };
    bancos.set(ctx, b);
  }
  return b;
}

function cauda(inst: Instrumento): number {
  if (inst === 'celesta') return 1.25;
  if (inst === 'piano' || inst === 'violao') return .65;
  if (inst === 'orgao') return .35;
  if (inst === 'baixo' || inst === 'cavaquinho') return .16;
  return .09;
}
function duracaoRuido(inst: Instrumento): number {
  return inst === 'caixa' ? .19 : inst === 'palma' ? .19 : inst === 'chocalho' ? .065 : .013;
}

/** Osciladores aditivos amostrados uma vez e reutilizados. O offset preserva fase/envelope ao buscar. */
function amostra(ctx: BaseAudioContext, nota: Nota): AudioBuffer {
  const b = banco(ctx), inst = nota.instrumento;
  // A quantização da duração só compartilha amostras; os inícios continuam no tempo musical exato.
  const gate = Math.round(nota.duracao * 1000) / 1000;
  const chave = `${inst}:${nota.midi}:${nota.destino ?? ''}:${gate}`;
  const existente = b.amostras.get(chave);
  if (existente) return existente;
  const percussao = ['bumbo', 'aro', 'triangulo', 'tamborim'].includes(inst);
  const duracao = percussao ? inst === 'bumbo' ? .31 : inst === 'triangulo' ? .16 : .09 : gate + cauda(inst);
  const buffer = ctx.createBuffer(1, Math.ceil(duracao * ctx.sampleRate), ctx.sampleRate);
  const dados = buffer.getChannelData(0), f = 440 * 2 ** ((nota.midi - 69) / 12);
  const alvo = 440 * 2 ** (((nota.destino ?? nota.midi) - 69) / 12);
  let fase = 0;
  for (let i = 0; i < dados.length; i++) {
    const t = i / ctx.sampleRate;
    // Portamento curto do crooner do Javas, sem degraus na frequência.
    const freq = alvo + (f - alvo) * Math.exp(-t / .045);
    fase += TAU * freq / ctx.sampleRate;
    const vibrato = .004 * Math.sin(TAU * 5.1 * t) * Math.min(1, t / .16);
    const p = fase + freq / 5.1 * vibrato;
    const fim = t <= gate ? 1 : Math.exp(-6 * (t - gate) / cauda(inst));
    const entrada = Math.min(1, t / (inst === 'orgao' ? .055 : inst === 'canto' ? .025 : .005));
    let v = 0;
    switch (inst) {
      case 'baixo': v = .75 * Math.sin(p) + .17 * Math.sin(2 * p) + .05 * Math.sin(3 * p); v *= Math.exp(-t * 1.8); break;
      case 'violao':
        v = .65 * Math.sin(p) * Math.exp(-t * 3.5) + .22 * Math.sin(2 * p) * Math.exp(-t * 6)
          + .1 * Math.sin(3 * p) * Math.exp(-t * 9) + .04 * Math.sin(5 * p) * Math.exp(-t * 15);
        break;
      case 'cavaquinho':
        v = (.58 * Math.sin(p) + .25 * Math.sin(2 * p) + .12 * Math.sin(3 * p) + .05 * Math.sin(4 * p)) * Math.exp(-t * 8);
        break;
      case 'piano':
        v = (.65 * Math.sin(p) + .18 * Math.sin(p * 1.002) + .14 * Math.sin(3 * p) * Math.exp(-t * 5))
          * Math.exp(-t * 2) * (.9 + .1 * Math.cos(TAU * 4.2 * t));
        break;
      case 'celesta':
        v = .58 * Math.sin(p) * Math.exp(-t * 2.8) + .23 * Math.sin(p * 2.003) * Math.exp(-t * 4.5)
          + .11 * Math.sin(p * 3.97) * Math.exp(-t * 7) + .05 * Math.sin(p * 5.98) * Math.exp(-t * 12);
        break;
      case 'orgao':
        v = (.55 * Math.sin(p) + .2 * Math.sin(p * 2) + .14 * Math.sin(p * 3) + .06 * Math.sin(p * .998))
          * (.94 + .06 * Math.sin(TAU * 3 * t));
        break;
      case 'canto':
        v = .6 * Math.sin(p) + .2 * Math.sin(2 * p) + .1 * Math.sin(3 * p) + .04 * Math.sin(4 * p);
        v *= .92 + .08 * Math.sin(TAU * 4.8 * t);
        break;
      case 'sanfona':
        // Palhetas: serra + quadrada levemente desafinadas, com parciais limitadas (sem aliasing áspero).
        for (let h = 1; h <= 7 && h * freq < ctx.sampleRate * .42; h++) {
          const peso = h % 2 ? .6 : .22;
          v += peso / h * (Math.sin(h * p) + .35 * Math.sin(h * p * 1.003));
        }
        v *= .63 * (.95 + .05 * Math.cos(TAU * 2.1 * t));
        break;
      case 'concertina':
        for (let h = 1; h <= 7 && h * freq < ctx.sampleRate * .42; h += 2)
          v += .48 / h * (Math.sin(h * p * .998) + Math.sin(h * p * 1.002));
        v *= .78;
        break;
      case 'bumbo': {
        const base = f * .75;
        const ph = TAU * (base * t + 60 * .026 * (1 - Math.exp(-t / .026)));
        v = .95 * Math.sin(ph) * Math.exp(-t * 17) + .07 * Math.sin(TAU * 155 * t) * Math.exp(-t * 65);
        break;
      }
      case 'aro': v = (.6 * Math.sin(TAU * 880 * t) + .3 * Math.sin(TAU * 1570 * t)) * Math.exp(-t * 100); break;
      case 'tamborim': v = (.55 * Math.sin(TAU * 690 * t) + .32 * Math.sin(TAU * 1120 * t) + .1 * Math.sin(TAU * 1730 * t)) * Math.exp(-t * 65); break;
      case 'triangulo': v = (.5 * Math.sin(TAU * 1720 * t) + .28 * Math.sin(TAU * 2433 * t) + .12 * Math.sin(TAU * 3461 * t)) * Math.exp(-t * 33); break;
    }
    const borda = Math.min(1, (duracao - t) / .008);
    dados[i] = v * entrada * (percussao ? 1 : fim) * Math.max(0, borda);
  }
  // Limite de memória por contexto; vozes que já usam um buffer continuam válidas.
  if (b.amostras.size >= 256) b.amostras.delete(b.amostras.keys().next().value!);
  b.amostras.set(chave, buffer);
  return buffer;
}

interface Canal { entrada: GainNode; saida: StereoPannerNode; filtro: BiquadFilterNode; cor?: BiquadFilterNode }
export interface Sintetizador {
  agendar(nota: Nota, origem: number, agora: number): void;
  liberar(): void;
  vozes(): number;
}

/** Os mesmos canais e vozes atendem AudioContext e OfflineAudioContext. */
export function criarSintetizador(ctx: BaseAudioContext, destino: AudioNode, faixaId: string): Sintetizador {
  const canais = new Map<Instrumento, Canal>(), fontes = new Map<AudioBufferSourceNode, AudioNode[]>();
  // Reflexo curto e escuro: um pouco da madeira do Javas, sem uma reverberação pesada.
  const sala = ctx.createDelay(.2), parede = ctx.createBiquadFilter(), reflexo = ctx.createGain();
  sala.delayTime.value = .083; parede.type = 'lowpass'; parede.frequency.value = 1800;
  reflexo.gain.value = .11;
  sala.connect(parede); parede.connect(reflexo); reflexo.connect(destino);
  const seed = sementeTexto(faixaId);
  let liberado = false;
  function canal(inst: Instrumento): GainNode {
    let c = canais.get(inst);
    if (!c) {
      const config = CONFIG[inst], entrada = ctx.createGain(), filtro = ctx.createBiquadFilter(), saida = ctx.createStereoPanner();
      entrada.gain.value = config.ganho;
      filtro.type = 'lowpass'; filtro.frequency.value = config.corte; filtro.Q.value = .55;
      saida.pan.value = config.pan;
      entrada.connect(filtro);
      let cor: BiquadFilterNode | undefined;
      if (inst === 'sanfona' || RUIDOS.has(inst)) {
        cor = ctx.createBiquadFilter(); cor.type = 'highpass'; cor.Q.value = .5;
        cor.frequency.value = inst === 'sanfona' ? 210 : inst === 'caixa' ? 650 : inst === 'palma' ? 900 : 1600;
        filtro.connect(cor); cor.connect(saida);
      } else filtro.connect(saida);
      saida.connect(destino);
      if (!RUIDOS.has(inst) && inst !== 'baixo' && inst !== 'bumbo') saida.connect(sala);
      c = { entrada, filtro, saida, cor }; canais.set(inst, c);
    }
    return c.entrada;
  }
  return {
    agendar(nota, origem, agora) {
      if (liberado) return;
      const inst = nota.instrumento, ruido = RUIDOS.has(inst);
      const buffer = ruido ? banco(ctx).ruido : amostra(ctx, nota);
      agora = Math.max(agora, ctx.currentTime);
      const inicio = origem + nota.tempo, atraso = Math.max(0, agora - inicio);
      const duracao = ruido ? duracaoRuido(inst) : buffer.duration;
      if (atraso >= duracao) return;
      const quando = Math.max(agora, inicio), fonte = ctx.createBufferSource(), ganho = ctx.createGain();
      fonte.buffer = buffer;
      fonte.connect(ganho); ganho.connect(canal(inst));
      if (ruido) {
        // O mesmo buffer de ruído serve todas as percussões, com fatias fixas por evento.
        const offset = acaso(seed + Math.round(nota.tempo * 10000)) * (buffer.duration - .3);
        const curva = new Float32Array(64);
        for (let i = 0; i < curva.length; i++) {
          const t = atraso + (duracao - atraso) * i / (curva.length - 1);
          const ataque = Math.min(1, t / .002);
          const pulsos = inst === 'palma' ? (.5 + .5 * Math.cos(TAU * t / .012)) * Math.exp(-t * 75) + .25 * Math.exp(-t * 23) : Math.exp(-t / (duracao * .22));
          curva[i] = nota.volume * ataque * pulsos * Math.min(1, (duracao - t) / .004);
        }
        ganho.gain.setValueCurveAtTime(curva, quando, duracao - atraso);
        fonte.start(quando, offset + atraso, duracao - atraso);
      } else {
        ganho.gain.value = nota.volume;
        fonte.start(quando, atraso);
      }
      fontes.set(fonte, [ganho]);
      fonte.onended = () => { fonte.disconnect(); ganho.disconnect(); fontes.delete(fonte); };
    },
    vozes: () => fontes.size,
    liberar() {
      liberado = true;
      for (const [fonte, nodes] of fontes) {
        fonte.onended = null;
        fonte.stop(); fonte.disconnect(); nodes.forEach(n => n.disconnect());
      }
      fontes.clear();
      for (const c of canais.values()) { c.entrada.disconnect(); c.filtro.disconnect(); c.cor?.disconnect(); c.saida.disconnect(); }
      canais.clear();
      sala.disconnect(); parede.disconnect(); reflexo.disconnect();
    },
  };
}
