import * as THREE from 'three';
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import {
  LIMITES,
  ROOMS,
  type Aparencia,
  type ClientToServer,
  type EstadoJogador,
  type MensagemChat,
  type Modo,
  type RoomId,
  type ServerToClient,
} from '@cardume/shared';

/** Estado de exibição de um peixe (local ou remoto), lido a cada frame pelo componente Fish. */
export interface AlvoPeixe {
  pos: THREE.Vector3;
  yaw: number;
  modo: Modo;
  movendo: boolean;
  bebida: number;
}

export interface InfoJogador {
  nome: string;
  aparencia: Aparencia;
  bebida: number;
}

interface Remoto {
  buffer: { t: number; e: EstadoJogador }[];
  alvo: AlvoPeixe;
}

interface MundoState {
  conectado: boolean;
  voce: string | null;
  sala: RoomId;
  /** versão da sala: muda a cada entrada, para remontar a cena */
  entrada: number;
  remotos: Record<string, InfoJogador>;
  chat: MensagemChat[];
  bolhas: Record<string, { texto: string; ate: number }>;
  bebida: number;
  online: number;
  aviso: { texto: string; id: number } | null;
  sinoEm: number;
  /** o servidor encerrou a conexão (outra janela, sessão expirada): não reconecta sozinho */
  encerrado: string | null;
}

export const useMundo = create<MundoState>(() => ({
  conectado: false,
  voce: null,
  sala: 'navio',
  entrada: 0,
  remotos: {},
  chat: [],
  bolhas: {},
  bebida: 0,
  online: 0,
  aviso: null,
  sinoEm: 0,
  encerrado: null,
}));

export function avisar(texto: string) {
  useMundo.setState({ aviso: { texto, id: Date.now() } });
}

/** Peixe do próprio jogador (mutável, atualizado pelo controlador a cada frame). */
export const local: AlvoPeixe = {
  pos: new THREE.Vector3(...ROOMS.navio.spawn),
  yaw: Math.PI,
  modo: 'nadando',
  movendo: false,
  bebida: 0,
};

const remotos = new Map<string, Remoto>();
export function alvoRemoto(id: string) {
  return remotos.get(id)?.alvo;
}

const ATRASO_MS = 110;
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function lerpAngulo(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/** Interpola os peixes remotos ~110 ms no passado (chamado a cada frame). */
export function interpolarRemotos() {
  const t = performance.now() - ATRASO_MS;
  for (const r of remotos.values()) {
    const b = r.buffer;
    if (!b.length) continue;
    while (b.length > 2 && b[1].t <= t) b.shift();
    const a = b[0];
    const c = b[1] ?? b[0];
    const f = c.t === a.t ? 1 : Math.min(1, Math.max(0, (t - a.t) / (c.t - a.t)));
    tmpA.fromArray(a.e.p);
    tmpB.fromArray(c.e.p);
    r.alvo.pos.lerpVectors(tmpA, tmpB, f);
    r.alvo.yaw = lerpAngulo(a.e.r, c.e.r, f);
    r.alvo.modo = c.e.m;
    r.alvo.movendo = c.e.v;
  }
}

// ---------------- socket ----------------

let socket: Socket<ServerToClient, ClientToServer> | null = null;
let intervaloEnvio: ReturnType<typeof setInterval> | null = null;

export function getSocket() {
  return socket;
}

function novoRemoto(id: string, e: EstadoJogador, bebida: number) {
  remotos.set(id, {
    buffer: [{ t: performance.now(), e }],
    alvo: { pos: new THREE.Vector3().fromArray(e.p), yaw: e.r, modo: e.m, movendo: e.v, bebida },
  });
}

export function conectar(visitante: boolean) {
  desconectar();
  const s: Socket<ServerToClient, ClientToServer> = io({ withCredentials: true, auth: { visitante } });
  socket = s;

  let ultimoAviso = '';
  s.on('connect', () => useMundo.setState({ conectado: true, encerrado: null }));
  s.on('disconnect', (motivo) => {
    useMundo.setState({ conectado: false });
    // desconexão feita pelo servidor não reconecta sozinha: mostra o motivo e oferece entrar de novo
    if (motivo === 'io server disconnect') useMundo.setState({ encerrado: ultimoAviso || 'A conexão foi encerrada.' });
  });

  s.on('boas_vindas', ({ voce, sala, estado, bebida, jogadores, historico }) => {
    // a posição, o modo e a bebida vêm do servidor (vale para troca de sala e para reconexão)
    local.pos.fromArray(estado.p);
    local.yaw = estado.r;
    local.modo = estado.m;
    local.bebida = bebida;
    remotos.clear();
    const info: Record<string, InfoJogador> = {};
    for (const j of jogadores) {
      novoRemoto(j.id, j.estado, j.bebida);
      info[j.id] = { nome: j.nome, aparencia: j.aparencia, bebida: j.bebida };
    }
    useMundo.setState((st) => ({ voce, sala, bebida, remotos: info, chat: historico, bolhas: {}, entrada: st.entrada + 1 }));
  });

  s.on('entrou', (j) => {
    novoRemoto(j.id, j.estado, j.bebida);
    useMundo.setState((st) => ({ remotos: { ...st.remotos, [j.id]: { nome: j.nome, aparencia: j.aparencia, bebida: j.bebida } } }));
  });

  s.on('saiu', (id) => {
    remotos.delete(id);
    useMundo.setState((st) => {
      const { [id]: _, ...resto } = st.remotos;
      return { remotos: resto };
    });
  });

  s.on('snapshot', ({ s: estados }) => {
    const agora = performance.now();
    const voce = useMundo.getState().voce;
    for (const [id, e] of Object.entries(estados)) {
      if (id === voce) continue;
      const r = remotos.get(id);
      if (!r) continue;
      r.buffer.push({ t: agora, e });
      if (r.buffer.length > 30) r.buffer.splice(0, r.buffer.length - 30);
    }
  });

  s.on('chat', (m) => {
    useMundo.setState((st) => ({
      chat: [...st.chat.slice(-49), m],
      bolhas: { ...st.bolhas, [m.de]: { texto: m.texto, ate: Date.now() + LIMITES.bolhaChatMs } },
    }));
  });

  s.on('bebida', ({ id, nivel }) => {
    const st = useMundo.getState();
    if (id === st.voce) {
      local.bebida = nivel;
      useMundo.setState({ bebida: nivel });
      return;
    }
    const r = remotos.get(id);
    if (r) r.alvo.bebida = nivel;
    if (st.remotos[id]) useMundo.setState({ remotos: { ...st.remotos, [id]: { ...st.remotos[id], bebida: nivel } } });
  });

  s.on('aparencia', ({ id, aparencia }) => {
    const st = useMundo.getState();
    if (st.remotos[id]) useMundo.setState({ remotos: { ...st.remotos, [id]: { ...st.remotos[id], aparencia } } });
  });

  s.on('sino', () => useMundo.setState({ sinoEm: performance.now() }));
  s.on('online', (n) => useMundo.setState({ online: n }));
  s.on('aviso', (texto) => {
    ultimoAviso = texto;
    avisar(texto);
  });

  if (!visitante) {
    intervaloEnvio = setInterval(() => {
      if (!s.connected) return;
      s.emit('estado', {
        p: [+local.pos.x.toFixed(3), +local.pos.y.toFixed(3), +local.pos.z.toFixed(3)],
        r: +local.yaw.toFixed(3),
        m: local.modo,
        v: local.movendo,
      });
    }, 1000 / LIMITES.tickHz);
  }
  return s;
}

export function desconectar() {
  if (intervaloEnvio) clearInterval(intervaloEnvio);
  intervaloEnvio = null;
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  remotos.clear();
  local.bebida = 0;
  useMundo.setState({ conectado: false, voce: null, remotos: {}, chat: [], bolhas: {}, bebida: 0, sala: 'navio', encerrado: null });
}

// gancho de depuração (só em desenvolvimento): usado pelos testes de ponta a ponta
if (import.meta.env.DEV) {
  (window as unknown as { __cardume: unknown }).__cardume = { local, useMundo, getSocket };
}
