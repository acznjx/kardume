import type { Server, Socket } from 'socket.io';
import {
  DARDOS_POR_RODADA,
  FAIXAS,
  FAIXA_POR_ID,
  INTERACAO_POR_ID,
  RODADA_TIMEOUT_MS,
  alcanca,
  miraEm,
  pontuarDardo,
  type ClientToServer,
  type EstadoAlvo,
  type EstadoJogador,
  type EstadoRadiola,
  type Recorde,
  type RoomId,
  type ServerToClient,
} from '@cardume/shared';

type Io = Server<ClientToServer, ServerToClient>;
type Sock = Socket<ClientToServer, ServerToClient>;

/** O mínimo do jogador que o Javas precisa (o tipo completo vive em rooms.ts). */
export interface JogadorJavas {
  id: string;
  nome: string;
  visitante: boolean;
  sala: RoomId;
  estado: EstadoJogador;
  bebida: number;
  socket: Sock;
}

const SALA: RoomId = 'adega';
const pes = (p: readonly number[]) => [p[0], p[1] - 1.0, p[2]];
/** contagem regressiva antes da mira começar a valer */
const PREPARO_MS = 900;
const INTERVALO_ARREMESSO_MS = 450;
const FIM_RODADA_MS = 2500;
const PAUSA_ENTRE_FAIXAS_MS = 2500;

/**
 * Regras do bar Javas: dardos (um jogador por alvo, 3 dardos por rodada, recordes do dia)
 * e a Radiola das Marés (votação da próxima faixa, troca automática no fim de cada faixa).
 */
export function criarJavas(io: Io) {
  // ---------------- dardos ----------------
  const alvos: EstadoAlvo[] = [0, 1].map((alvo) => ({
    alvo,
    jogador: null,
    nome: null,
    dardos: [],
    semente: 0,
    inicio: 0,
    bebida: 0,
  }));
  const recordes: Recorde[][] = [[], []];
  const controle = alvos.map(() => ({ ultimo: 0, timeout: null as ReturnType<typeof setTimeout> | null, fim: null as ReturnType<typeof setTimeout> | null }));
  let diaRecordes = new Date().toDateString();

  const emitirAlvo = (i: number) => io.to(SALA).emit('dardos_estado', alvos[i]);

  function encerrarRodada(i: number) {
    const c = controle[i];
    if (c.timeout) clearTimeout(c.timeout);
    if (c.fim) clearTimeout(c.fim);
    c.timeout = c.fim = null;
    if (!alvos[i].jogador) return;
    // os dardos continuam cravados até a próxima rodada
    alvos[i] = { ...alvos[i], jogador: null, nome: null };
    emitirAlvo(i);
  }

  function armarTimeout(i: number) {
    const c = controle[i];
    if (c.timeout) clearTimeout(c.timeout);
    c.timeout = setTimeout(() => encerrarRodada(i), RODADA_TIMEOUT_MS);
  }

  function registrarRecorde(i: number, nome: string, pontos: number) {
    const hoje = new Date().toDateString();
    if (hoje !== diaRecordes) {
      diaRecordes = hoje;
      recordes[0] = [];
      recordes[1] = [];
    }
    const lista = recordes[i];
    lista.push({ nome, pontos });
    lista.sort((a, b) => b.pontos - a.pontos);
    lista.splice(5);
    io.to(SALA).emit('dardos_placar', { alvo: i, recordes: lista });
  }

  function alvoDoJogador(id: string) {
    return alvos.findIndex((a) => a.jogador === id);
  }

  // ---------------- radiola ----------------
  let indiceFaixa = Math.floor(Math.random() * FAIXAS.length);
  let radiola = { faixa: FAIXAS[indiceFaixa].id, inicio: Date.now() };
  const votos = new Map<string, string>(); // id do jogador -> faixa
  let proxima: ReturnType<typeof setTimeout> | null = null;

  const estadoRadiola = (): EstadoRadiola => {
    const contagem: Record<string, number> = {};
    for (const f of votos.values()) contagem[f] = (contagem[f] ?? 0) + 1;
    return { faixa: radiola.faixa, inicio: radiola.inicio, votos: contagem, agora: Date.now() };
  };
  const emitirRadiola = () => io.to(SALA).emit('radiola', estadoRadiola());

  function agendarProxima() {
    if (proxima) clearTimeout(proxima);
    const duracao = (FAIXA_POR_ID.get(radiola.faixa)?.duracao ?? 60) * 1000;
    const falta = radiola.inicio + duracao + PAUSA_ENTRE_FAIXAS_MS - Date.now();
    proxima = setTimeout(trocarFaixa, Math.max(500, falta));
    proxima.unref?.();
  }

  function trocarFaixa() {
    const contagem = estadoRadiola().votos;
    const maximo = Math.max(0, ...Object.values(contagem));
    let escolhida: string;
    if (maximo > 0) {
      const empatadas = Object.keys(contagem).filter((f) => contagem[f] === maximo);
      escolhida = empatadas[Math.floor(Math.random() * empatadas.length)];
    } else {
      // sem votos: segue a ordem do disco
      indiceFaixa = (indiceFaixa + 1) % FAIXAS.length;
      escolhida = FAIXAS[indiceFaixa].id;
    }
    indiceFaixa = FAIXAS.findIndex((f) => f.id === escolhida);
    radiola = { faixa: escolhida, inicio: Date.now() };
    votos.clear();
    emitirRadiola();
    agendarProxima();
  }
  agendarProxima();

  // ---------------- conexão ----------------
  return {
    /** manda o estado do bar para quem acabou de entrar */
    enviarEstado(socket: Sock) {
      for (const a of alvos) socket.emit('dardos_estado', a);
      recordes.forEach((lista, alvo) => socket.emit('dardos_placar', { alvo, recordes: lista }));
      socket.emit('radiola', estadoRadiola());
    },

    /** o jogador saiu do bar (trocou de sala ou desconectou) */
    saiu(j: JogadorJavas) {
      const i = alvoDoJogador(j.id);
      if (i >= 0) encerrarRodada(i);
      if (votos.delete(j.id)) emitirRadiola();
    },

    registrar(socket: Sock, j: JogadorJavas) {
      socket.on('dardos_entrar', (alvo, ack) => {
        if (typeof ack !== 'function') return;
        if (j.visitante || j.sala !== SALA || (alvo !== 0 && alvo !== 1)) return ack(false, 'Não dá para jogar daqui.');
        const ponto = INTERACAO_POR_ID.get(`dardo-${alvo}`);
        if (!ponto || !alcanca(pes(j.estado.p), ponto, 1)) return ack(false, 'Chegue na linha de arremesso.');
        const atual = alvos[alvo];
        if (atual.jogador && atual.jogador !== j.id) return ack(false, `${atual.nome} está jogando nesse alvo.`);
        const outro = alvoDoJogador(j.id);
        if (outro >= 0 && outro !== alvo) encerrarRodada(outro);
        alvos[alvo] = {
          alvo,
          jogador: j.id,
          nome: j.nome,
          dardos: [],
          semente: Math.floor(Math.random() * 2 ** 31),
          inicio: Date.now() + PREPARO_MS,
          bebida: j.bebida,
        };
        controle[alvo].ultimo = 0;
        armarTimeout(alvo);
        emitirAlvo(alvo);
        ack(true);
      });

      socket.on('dardos_arremessar', (tCliente) => {
        const i = alvoDoJogador(j.id);
        if (i < 0) return;
        const a = alvos[i];
        const c = controle[i];
        const agora = Date.now();
        if (agora < a.inicio || a.dardos.length >= DARDOS_POR_RODADA) return;
        if (agora - c.ultimo < INTERVALO_ARREMESSO_MS) return;
        c.ultimo = agora;
        // usa o instante do client (compensa a latência), mas só se for plausível
        const tServidor = (agora - a.inicio) / 1000;
        const t =
          typeof tCliente === 'number' && Number.isFinite(tCliente) && Math.abs(tCliente - tServidor) <= 0.6 ? tCliente : tServidor;
        const { x, y } = miraEm(Math.max(0, t), a.semente, a.bebida);
        const acerto = { ...pontuarDardo(x, y), x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
        a.dardos = [...a.dardos, acerto];
        const total = a.dardos.reduce((s, d) => s + d.pontos, 0);
        io.to(SALA).emit('dardo', { alvo: i, id: j.id, acerto, total, restam: DARDOS_POR_RODADA - a.dardos.length });
        if (a.dardos.length >= DARDOS_POR_RODADA) {
          registrarRecorde(i, j.nome, total);
          if (c.timeout) clearTimeout(c.timeout);
          c.fim = setTimeout(() => encerrarRodada(i), FIM_RODADA_MS);
        } else {
          armarTimeout(i);
        }
      });

      socket.on('dardos_sair', () => {
        const i = alvoDoJogador(j.id);
        if (i >= 0) encerrarRodada(i);
      });

      socket.on('radiola_votar', (faixa) => {
        if (j.visitante || j.sala !== SALA || typeof faixa !== 'string' || !FAIXA_POR_ID.has(faixa)) return;
        votos.set(j.id, faixa);
        emitirRadiola();
      });
    },

    /** para os testes: força a troca de faixa agora */
    _trocarFaixa: trocarFaixa,
    /** para encerrar timers (testes) */
    parar() {
      if (proxima) clearTimeout(proxima);
      controle.forEach((c) => {
        if (c.timeout) clearTimeout(c.timeout);
        if (c.fim) clearTimeout(c.fim);
      });
    },
  };
}

export type Javas = ReturnType<typeof criarJavas>;
