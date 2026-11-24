import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Server, Socket } from 'socket.io';
import {
  LIMITES,
  PONTOS,
  PORTAS,
  ROOMS,
  ROOM_IDS,
  criarFiltro,
  distancia,
  embaralharTexto,
  type Aparencia,
  type ClientToServer,
  type EstadoJogador,
  type JogadorPublico,
  type MensagemChat,
  type RoomId,
  type ServerToClient,
} from '@cardume/shared';
import { COOKIE, aparenciaDe, criarLimitador, type Auth } from './auth';

type Io = Server<ClientToServer, ServerToClient>;
type Sock = Socket<ClientToServer, ServerToClient>;

interface Jogador {
  id: string;
  userId: number | null;
  token: string | null;
  nome: string;
  visitante: boolean;
  aparencia: Aparencia;
  sala: RoomId;
  estado: EstadoJogador;
  ultimoEstadoEm: number;
  bebida: number;
  bebidaDesde: number;
  socket: Sock;
}

const APARENCIA_PADRAO: Aparencia = { tipo: 'modelo', modelo: 'palhaco' };

function lerCookie(header: string | undefined, nome: string) {
  if (!header) return undefined;
  for (const parte of header.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k !== nome) continue;
    try {
      const valor = decodeURIComponent(v.join('='));
      return /^[a-f0-9]{64}$/.test(valor) ? valor : undefined;
    } catch {
      return undefined; // cookie malformado: trata como sem sessão
    }
  }
  return undefined;
}

function carregarBloqueadas() {
  const arq = resolve(import.meta.dirname, '../../../data/bloqueadas.txt');
  if (!existsSync(arq)) return [];
  return readFileSync(arq, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function criarSalas(io: Io, auth: Auth) {
  const jogadores = new Map<string, Jogador>();
  const historico: Record<RoomId, MensagemChat[]> = { navio: [], adega: [] };
  const filtrar = criarFiltro(carregarBloqueadas());
  const limiteChat = criarLimitador(5, 5000);
  const limiteSino = criarLimitador(1, 2500);
  let numeroVisitante = 1;

  const publico = (j: Jogador): JogadorPublico => ({
    id: j.id,
    nome: j.nome,
    visitante: j.visitante,
    aparencia: j.aparencia,
    estado: j.estado,
    bebida: j.bebida,
  });

  const online = () => [...jogadores.values()].filter((j) => !j.visitante).length;
  const avisarOnline = () => io.emit('online', online());

  function estadoInicial(sala: RoomId, pos?: readonly number[]): EstadoJogador {
    const s = pos ?? ROOMS[sala].spawn;
    return { p: [s[0], s[1], s[2]], r: Math.PI, m: 'nadando', v: false };
  }

  function entrarNaSala(j: Jogador, sala: RoomId, pos?: readonly number[]) {
    const anterior = j.sala;
    j.socket.leave(anterior);
    if (!j.visitante) io.to(anterior).emit('saiu', j.id);
    j.sala = sala;
    j.estado = { ...estadoInicial(sala, pos), m: j.estado.m };
    j.ultimoEstadoEm = Date.now();
    j.socket.join(sala);
    const presentes = [...jogadores.values()].filter((o) => o.sala === sala && !o.visitante && o.id !== j.id);
    j.socket.emit('boas_vindas', {
      voce: j.id,
      sala,
      estado: j.estado,
      bebida: j.bebida,
      jogadores: presentes.map(publico),
      historico: historico[sala],
    });
    if (!j.visitante) j.socket.to(sala).emit('entrou', publico(j));
  }

  function validarEstado(j: Jogador, e: EstadoJogador): EstadoJogador | null {
    if (
      !e ||
      !Array.isArray(e.p) ||
      e.p.length !== 3 ||
      !e.p.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
      typeof e.r !== 'number' ||
      !Number.isFinite(e.r) ||
      (e.m !== 'nadando' && e.m !== 'empe')
    )
      return null;
    const sala = ROOMS[j.sala];
    const alvo: [number, number, number] = [
      limitar(e.p[0], sala.min[0], sala.max[0]),
      limitar(e.p[1], sala.min[1] - 0.4, sala.max[1]),
      limitar(e.p[2], sala.min[2], sala.max[2]),
    ];
    // anti-teletransporte: o deslocamento permitido depende do tempo real desde o último estado aceito,
    // e estados mandados rápido demais são ignorados (o client manda a ~15 Hz)
    const agora = Date.now();
    const decorrido = agora - j.ultimoEstadoEm;
    if (decorrido < 30) return null;
    const dt = Math.min(1, decorrido / 1000);
    j.ultimoEstadoEm = agora;
    const d = distancia(alvo, j.estado.p);
    const max = LIMITES.velocidadeMax * dt + 0.15;
    if (d > max) {
      const f = max / d;
      for (let i = 0; i < 3; i++) alvo[i] = j.estado.p[i] + (alvo[i] - j.estado.p[i]) * f;
    }
    return { p: alvo, r: e.r % (Math.PI * 2), m: e.m, v: !!e.v };
  }

  io.on('connection', (socket: Sock) => {
    const token = lerCookie(socket.handshake.headers.cookie, COOKIE);
    const user = auth.usuarioDoToken(token);
    const querVisitante = socket.handshake.auth?.visitante === true;
    if (!user && !querVisitante) {
      socket.emit('aviso', 'Sessão expirada. Entre de novo.');
      socket.disconnect(true);
      return;
    }

    // um peixe por conta: derruba a conexão antiga
    if (user) {
      for (const outro of jogadores.values()) {
        if (outro.userId === user.id) {
          outro.socket.emit('aviso', 'Você entrou em outra janela.');
          outro.socket.disconnect(true);
        }
      }
    }

    const j: Jogador = {
      id: randomUUID().slice(0, 8),
      userId: user?.id ?? null,
      token: user ? (token ?? null) : null,
      nome: user?.username ?? `visitante-${numeroVisitante++}`,
      visitante: !user,
      aparencia: (user && aparenciaDe(user)) || APARENCIA_PADRAO,
      sala: 'navio',
      estado: estadoInicial('navio'),
      ultimoEstadoEm: Date.now(),
      bebida: 0,
      bebidaDesde: 0,
      socket,
    };
    jogadores.set(j.id, j);
    entrarNaSala(j, 'navio');
    avisarOnline();

    socket.on('estado', (e) => {
      if (j.visitante) return;
      const ok = validarEstado(j, e);
      if (ok) j.estado = ok;
    });

    socket.on('chat', (texto) => {
      if (j.visitante) return socket.emit('aviso', 'Visitantes só podem espiar. Crie seu peixe para conversar!');
      if (typeof texto !== 'string') return;
      const limpo = texto.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, LIMITES.chatMax);
      if (!limpo) return;
      if (!limiteChat(j.id)) return socket.emit('aviso', 'Devagar com as bolhas!');
      const msg: MensagemChat = {
        id: randomUUID().slice(0, 8),
        de: j.id,
        nome: j.nome,
        texto: embaralharTexto(filtrar(limpo), j.bebida),
        em: Date.now(),
      };
      const h = historico[j.sala];
      h.push(msg);
      if (h.length > 30) h.shift();
      io.to(j.sala).emit('chat', msg);
    });

    socket.on('trocar_sala', (sala, ack) => {
      if (typeof ack !== 'function') return;
      if (!ROOM_IDS.includes(sala) || sala === j.sala) return ack(false, 'Sala inválida.');
      const porta = PORTAS[j.sala];
      if (porta.para !== sala) return ack(false, 'Não há passagem daqui para lá.');
      if (!j.visitante) {
        if (distancia(j.estado.p, porta.pos, true) > porta.raio + 1.5) return ack(false, 'Chegue mais perto da porta.');
        if (porta.exigeEmPe && j.estado.m !== 'empe')
          return ack(false, 'Na adega só se entra em pé! Aperte F para botar as perninhas.');
      }
      entrarNaSala(j, sala, porta.chegada);
      ack(true);
    });

    socket.on('pedir_dose', (ack) => {
      if (typeof ack !== 'function') return;
      if (j.visitante || j.sala !== PONTOS.balcao.sala) return ack(j.bebida);
      if (distancia(j.estado.p, PONTOS.balcao.pos, true) > PONTOS.balcao.raio + 1)
        return ack(j.bebida), socket.emit('aviso', 'Chegue no balcão para pedir.');
      if (j.bebida >= LIMITES.bebidaMax) {
        socket.emit('aviso', 'O barman diz: "Chega por hoje, campeão. Vai uma água?"');
        return ack(j.bebida);
      }
      j.bebida += 1;
      j.bebidaDesde = Date.now();
      io.to(j.sala).emit('bebida', { id: j.id, nivel: j.bebida });
      ack(j.bebida);
    });

    socket.on('tocar_sino', () => {
      if (j.visitante || j.sala !== PONTOS.sino.sala) return;
      if (distancia(j.estado.p, PONTOS.sino.pos) > PONTOS.sino.raio + 1) return;
      if (!limiteSino(j.sala)) return;
      io.to(j.sala).emit('sino', { id: j.id });
    });

    socket.on('disconnect', () => {
      jogadores.delete(j.id);
      if (!j.visitante) io.to(j.sala).emit('saiu', j.id);
      avisarOnline();
    });
  });

  function atualizarAparencia(j: Jogador) {
    if (!j.userId) return;
    const u = auth.porId(j.userId);
    if (!u) return;
    j.aparencia = aparenciaDe(u) ?? APARENCIA_PADRAO;
    io.to(j.sala).emit('aparencia', { id: j.id, aparencia: j.aparencia });
  }

  // snapshots a 15 Hz
  setInterval(() => {
    const t = Date.now();
    for (const sala of ROOM_IDS) {
      const s: Record<string, EstadoJogador> = {};
      let algum = false;
      for (const j of jogadores.values()) {
        if (j.sala === sala && !j.visitante) {
          s[j.id] = j.estado;
          algum = true;
        }
      }
      if (algum) io.to(sala).volatile.emit('snapshot', { t, s });
    }
  }, 1000 / LIMITES.tickHz).unref();

  // a bebida passa com o tempo
  setInterval(() => {
    const agora = Date.now();
    for (const j of jogadores.values()) {
      if (j.bebida > 0 && agora - j.bebidaDesde >= LIMITES.bebidaDecaimentoMs) {
        j.bebida -= 1;
        j.bebidaDesde = agora;
        io.to(j.sala).emit('bebida', { id: j.id, nivel: j.bebida });
      }
    }
  }, 1000).unref();

  // sessões revogadas ou expiradas derrubam o socket
  setInterval(() => {
    for (const j of jogadores.values()) {
      if (j.token && !auth.usuarioDoToken(j.token)) {
        j.socket.emit('aviso', 'Sua sessão terminou. Entre de novo.');
        j.socket.disconnect(true);
      }
    }
  }, 60_000).unref();

  return {
    online,
    aparenciaMudou(userId: number) {
      for (const j of jogadores.values()) if (j.userId === userId) atualizarAparencia(j);
    },
    desconectarSessao(token: string) {
      for (const j of jogadores.values()) {
        if (j.token === token) {
          j.socket.emit('aviso', 'Você saiu da conta.');
          j.socket.disconnect(true);
        }
      }
    },
  };
}
