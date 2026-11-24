import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Server, Socket } from 'socket.io';
import {
  ASSENTO_POR_ID,
  DANCAS,
  EMOTES,
  INTERACAO_POR_ID,
  LIMITES,
  PORTAS,
  RAIO_SPAWN,
  alcanca,
  ROOMS,
  ROOM_IDS,
  criarFiltro,
  distancia,
  embaralharTexto,
  type Acao,
  type Aparencia,
  type Danca,
  type Emote,
  type ClientToServer,
  type EstadoJogador,
  type JogadorPublico,
  type MensagemChat,
  type RoomId,
  type ServerToClient,
} from '@cardume/shared';
import { COOKIE, aparenciaDe, criarLimitador, type Auth } from './auth';
import { criarJavas } from './javas';

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
  acao: Acao | null;
  ultimoBrinde: number;
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
const arred = (v: number, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;
/** posição aproximada dos pés (o estado guarda o centro do peixe) */
const pes = (p: readonly number[]) => [p[0], p[1] - 1.0, p[2]];

export function criarSalas(io: Io, auth: Auth) {
  const jogadores = new Map<string, Jogador>();
  const historico: Record<RoomId, MensagemChat[]> = { navio: [], adega: [] };
  const filtrar = criarFiltro(carregarBloqueadas());
  const limiteChat = criarLimitador(5, 5000);
  const limiteSino = criarLimitador(1, 2500);
  const limiteEmote = criarLimitador(4, 4000);
  const limiteAcao = criarLimitador(8, 4000);
  /** assentoId -> id do jogador sentado */
  const assentos = new Map<string, string>();
  /** regras do bar: dardos e radiola */
  const javas = criarJavas(io);
  let numeroVisitante = 1;

  const publico = (j: Jogador): JogadorPublico => ({
    id: j.id,
    nome: j.nome,
    visitante: j.visitante,
    aparencia: j.aparencia,
    estado: j.estado,
    bebida: j.bebida,
    acao: j.acao,
  });

  const online = () => [...jogadores.values()].filter((j) => !j.visitante).length;
  const avisarOnline = () => io.emit('online', online());

  function estadoInicial(sala: RoomId, pos?: readonly number[]): EstadoJogador {
    const s = pos ?? ROOMS[sala].spawn;
    // espalha a chegada num círculo para ninguém nascer empilhado
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (pos ? 2 : RAIO_SPAWN);
    return { p: [arred(s[0] + Math.cos(a) * r), s[1], arred(s[2] + Math.sin(a) * r)], r: Math.PI, m: 'nadando', v: false };
  }

  /** Encerra a ação contínua (levanta do assento, para de dançar). */
  function encerrarAcao(j: Jogador, avisar = true) {
    if (!j.acao) return;
    if (j.acao.tipo === 'sentado' && assentos.get(j.acao.assento) === j.id) assentos.delete(j.acao.assento);
    j.acao = null;
    if (avisar) io.to(j.sala).emit('acao', { id: j.id, acao: null });
  }

  function definirAcao(j: Jogador, acao: Acao) {
    encerrarAcao(j, false);
    j.acao = acao;
    io.to(j.sala).emit('acao', { id: j.id, acao });
  }

  function entrarNaSala(j: Jogador, sala: RoomId, pos?: readonly number[]) {
    const anterior = j.sala;
    encerrarAcao(j, false);
    if (anterior === 'adega' && sala !== 'adega') javas.saiu(j);
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
    if (sala === 'adega') javas.enviarEstado(j.socket);
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
    return { p: [arred(alvo[0]), arred(alvo[1]), arred(alvo[2])], r: arred(e.r % (Math.PI * 2), 3), m: e.m, v: !!e.v };
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
      acao: null,
      ultimoBrinde: 0,
      socket,
    };
    jogadores.set(j.id, j);
    entrarNaSala(j, 'navio');
    avisarOnline();

    socket.on('estado', (e) => {
      if (j.visitante) return;
      // sentado: o peixe fica preso ao assento até levantar
      if (j.acao?.tipo === 'sentado') return;
      const ok = validarEstado(j, e);
      if (!ok) return;
      j.estado = ok;
      if (ok.v && j.acao?.tipo === 'danca') encerrarAcao(j);
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

    socket.on('pedir_dose', (pontoId, ack) => {
      if (typeof ack !== 'function') return;
      const ponto = typeof pontoId === 'string' ? INTERACAO_POR_ID.get(pontoId) : undefined;
      if (j.visitante || !ponto || ponto.tipo !== 'dose' || ponto.sala !== j.sala) return ack(j.bebida);
      if (!alcanca(pes(j.estado.p), ponto, 1.2)) return ack(j.bebida), socket.emit('aviso', 'Chegue no balcão para pedir.');
      if (j.bebida >= LIMITES.bebidaMax) {
        socket.emit('aviso', 'O barman diz: "Chega por hoje, campeão. Vai uma água?"');
        return ack(j.bebida);
      }
      j.bebida += 1;
      j.bebidaDesde = Date.now();
      io.to(j.sala).emit('servido', { id: j.id, pontoId: ponto.id, tipo: 'dose' });
      io.to(j.sala).emit('bebida', { id: j.id, nivel: j.bebida });
      ack(j.bebida);
    });

    socket.on('pedir_agua', (pontoId, ack) => {
      if (typeof ack !== 'function') return;
      const ponto = typeof pontoId === 'string' ? INTERACAO_POR_ID.get(pontoId) : undefined;
      if (j.visitante || !ponto || ponto.tipo !== 'dose' || ponto.sala !== j.sala) return ack(j.bebida);
      if (!alcanca(pes(j.estado.p), ponto, 1.2)) return ack(j.bebida);
      io.to(j.sala).emit('servido', { id: j.id, pontoId: ponto.id, tipo: 'agua' });
      if (j.bebida > 0) {
        j.bebida -= 1;
        j.bebidaDesde = Date.now();
        io.to(j.sala).emit('bebida', { id: j.id, nivel: j.bebida });
      }
      ack(j.bebida);
    });

    javas.registrar(socket, j);

    socket.on('tocar_sino', () => {
      const sino = INTERACAO_POR_ID.get('sino')!;
      if (j.visitante || j.sala !== sino.sala) return;
      if (!alcanca(pes(j.estado.p), sino, 1.2)) return;
      if (!limiteSino(j.sala)) return;
      io.to(j.sala).emit('sino', { id: j.id });
    });

    socket.on('emote', (tipo) => {
      if (j.visitante || !(EMOTES as readonly string[]).includes(tipo)) return;
      if (!limiteEmote(j.id)) return;
      io.to(j.sala).emit('emote', { id: j.id, tipo: tipo as Emote });
      if (tipo !== 'brinde') return;
      // brinde coletivo: junta quem brindou perto e há pouco tempo
      const agora = Date.now();
      j.ultimoBrinde = agora;
      const grupo = [...jogadores.values()].filter(
        (o) =>
          o.sala === j.sala &&
          !o.visitante &&
          agora - o.ultimoBrinde < LIMITES.brindeJanelaMs &&
          distancia(o.estado.p, j.estado.p) < LIMITES.brindeRaio,
      );
      if (grupo.length >= 2) {
        for (const o of grupo) o.ultimoBrinde = 0;
        io.to(j.sala).emit('brinde', { ids: grupo.map((o) => o.id) });
      }
    });

    socket.on('dancar', (estilo) => {
      if (j.visitante || !limiteAcao(j.id)) return;
      if (estilo === null) return encerrarAcao(j);
      if (!(DANCAS as readonly string[]).includes(estilo)) return;
      definirAcao(j, { tipo: 'danca', estilo: estilo as Danca, desde: Date.now() });
    });

    socket.on('sentar', (assentoId, ack) => {
      if (typeof ack !== 'function') return;
      if (j.visitante || !limiteAcao(j.id)) return ack(false);
      const a = typeof assentoId === 'string' ? ASSENTO_POR_ID.get(assentoId) : undefined;
      if (!a || a.sala !== j.sala) return ack(false, 'Esse lugar não existe.');
      const dono = assentos.get(a.id);
      if (dono && dono !== j.id) return ack(false, 'Esse lugar já está ocupado.');
      const p = j.estado.p;
      if (Math.hypot(p[0] - a.pos[0], p[2] - a.pos[2]) > LIMITES.alcanceAssento + 1 || Math.abs(p[1] - a.pos[1]) > 3)
        return ack(false, 'Chegue mais perto para sentar.');
      encerrarAcao(j, false);
      assentos.set(a.id, j.id);
      j.estado = { p: [a.pos[0], arred(a.pos[1] + 0.6), a.pos[2]], r: a.yaw, m: 'empe', v: false };
      definirAcao(j, { tipo: 'sentado', assento: a.id });
      ack(true);
    });

    socket.on('levantar', () => {
      if (j.acao?.tipo !== 'sentado') return;
      j.ultimoEstadoEm = Date.now();
      encerrarAcao(j);
    });

    socket.on('disconnect', () => {
      encerrarAcao(j, false);
      if (j.sala === 'adega') javas.saiu(j);
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
    nomeMudou(userId: number) {
      const u = auth.porId(userId);
      if (!u) return;
      for (const j of jogadores.values()) {
        if (j.userId !== userId) continue;
        j.nome = u.username;
        io.to(j.sala).emit('perfil', { id: j.id, nome: j.nome });
      }
    },
    /** Conta excluída: tira o peixe do aquário em todas as conexões dele. */
    desconectarConta(userId: number) {
      for (const j of jogadores.values()) {
        if (j.userId === userId) {
          j.socket.emit('aviso', 'Sua conta foi excluída.');
          j.socket.disconnect(true);
        }
      }
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
