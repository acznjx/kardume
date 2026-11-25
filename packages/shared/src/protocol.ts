import type { RoomId } from './constants';
import type { Roupa } from './roupa';

export type Modo = 'nadando' | 'empe';

export const MODELOS_PEIXE = ['palhaco', 'tito', 'luna', 'bia', 'nico', 'roxo', 'oculos'] as const;
export type ModeloPeixe = (typeof MODELOS_PEIXE)[number];

/** Aparência do peixe: desenho do jogador (PNG + contorno simplificado) ou modelo pronto. */
export type Aparencia =
  | { tipo: 'desenho'; png: string; contorno: [number, number][]; roupa?: Roupa }
  | { tipo: 'modelo'; modelo: ModeloPeixe; roupa?: Roupa };

export interface EstadoJogador {
  /** posição x, y, z */
  p: [number, number, number];
  /** rotação em y (radianos) */
  r: number;
  m: Modo;
  /** está se movendo? */
  v: boolean;
}

export const EMOTES = ['acenar', 'aplaudir', 'coracao', 'rir', 'brinde'] as const;
export type Emote = (typeof EMOTES)[number];

export const DANCAS = ['balanco', 'giro', 'pulinho'] as const;
export type Danca = (typeof DANCAS)[number];

/** Ação contínua do peixe (visível para todos e enviada a quem entra na sala). */
export type Acao = { tipo: 'sentado'; assento: string } | { tipo: 'danca'; estilo: Danca; desde: number };

export interface JogadorPublico {
  id: string;
  nome: string;
  visitante: boolean;
  aparencia: Aparencia;
  estado: EstadoJogador;
  bebida: number;
  acao: Acao | null;
}

export interface MensagemChat {
  id: string;
  de: string;
  nome: string;
  texto: string;
  em: number;
}

/** Um dardo cravado: posição no alvo (raio 1 = borda do anel duplo) e o que valeu. */
export interface AcertoDardo {
  x: number;
  y: number;
  pontos: number;
  rotulo: string;
}

/** Estado de um alvo de dardos (0 ou 1). `jogador` null = livre; os dardos da última rodada ficam cravados. */
export interface EstadoAlvo {
  alvo: number;
  jogador: string | null;
  nome: string | null;
  dardos: AcertoDardo[];
  /** semente e início (relógio do servidor, ms) da mira oscilante: ver miraEm() em dardos.ts */
  semente: number;
  inicio: number;
  /** bebida do jogador no começo da rodada (deixa a mira mais tremida) */
  bebida: number;
}

export interface Recorde {
  nome: string;
  pontos: number;
}

/** Radiola das Marés: faixa tocando, início (relógio do servidor, ms) e votos para a próxima. */
export interface EstadoRadiola {
  faixa: string;
  inicio: number;
  votos: Record<string, number>;
  /** relógio do servidor no envio (para o client calcular a diferença de relógio) */
  agora: number;
}

export interface UsuarioMe {
  id: number;
  username: string;
  aparencia: Aparencia | null;
  /** e-mail opcional (para recuperar a conta no futuro) */
  email: string | null;
  roupa: Roupa;
  /** quando a conta foi criada (ms) */
  criadoEm: number;
}

// ---- eventos Socket.IO ----
export interface ServerToClient {
  boas_vindas: (d: {
    voce: string;
    sala: RoomId;
    /** estado e bebida do próprio jogador, definidos pelo servidor */
    estado: EstadoJogador;
    bebida: number;
    jogadores: JogadorPublico[];
    historico: MensagemChat[];
  }) => void;
  snapshot: (d: { t: number; s: Record<string, EstadoJogador> }) => void;
  entrou: (j: JogadorPublico) => void;
  saiu: (id: string) => void;
  chat: (m: MensagemChat) => void;
  bebida: (d: { id: string; nivel: number }) => void;
  aparencia: (d: { id: string; aparencia: Aparencia }) => void;
  /** o jogador trocou o nome no perfil */
  perfil: (d: { id: string; nome: string }) => void;
  sino: (d: { id: string }) => void;
  acao: (d: { id: string; acao: Acao | null }) => void;
  emote: (d: { id: string; tipo: Emote }) => void;
  /** brinde coletivo: todos esses peixes brindaram juntos */
  brinde: (d: { ids: string[] }) => void;
  /** o barman serviu algo no ponto `pontoId` (dose ou água) */
  servido: (d: { id: string; pontoId: string; tipo: 'dose' | 'agua' }) => void;
  dardos_estado: (e: EstadoAlvo) => void;
  /** um dardo foi arremessado (para o 3D cravar e mostrar a pontuação) */
  dardo: (d: { alvo: number; id: string; acerto: AcertoDardo; total: number; restam: number }) => void;
  dardos_placar: (d: { alvo: number; recordes: Recorde[] }) => void;
  radiola: (e: EstadoRadiola) => void;
  online: (n: number) => void;
  aviso: (texto: string) => void;
}

export interface ClientToServer {
  estado: (e: EstadoJogador) => void;
  chat: (texto: string) => void;
  trocar_sala: (sala: RoomId, ack: (ok: boolean, erro?: string) => void) => void;
  pedir_dose: (pontoId: string, ack: (nivel: number) => void) => void;
  tocar_sino: () => void;
  emote: (tipo: Emote) => void;
  dancar: (estilo: Danca | null) => void;
  sentar: (assentoId: string, ack: (ok: boolean, erro?: string) => void) => void;
  levantar: () => void;
  dardos_entrar: (alvo: number, ack: (ok: boolean, erro?: string) => void) => void;
  /** t = segundos desde o início da rodada, no relógio do client (o servidor confere) */
  dardos_arremessar: (t: number) => void;
  dardos_sair: () => void;
  radiola_votar: (faixa: string) => void;
  pedir_agua: (pontoId: string, ack: (nivel: number) => void) => void;
}
