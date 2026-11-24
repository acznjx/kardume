import type { RoomId } from './constants';

export type Modo = 'nadando' | 'empe';

export const MODELOS_PEIXE = ['palhaco', 'tito', 'luna', 'bia', 'nico', 'roxo', 'oculos'] as const;
export type ModeloPeixe = (typeof MODELOS_PEIXE)[number];

/** Aparência do peixe: desenho do jogador (PNG + contorno simplificado) ou modelo pronto. */
export type Aparencia =
  | { tipo: 'desenho'; png: string; contorno: [number, number][] }
  | { tipo: 'modelo'; modelo: ModeloPeixe };

export interface EstadoJogador {
  /** posição x, y, z */
  p: [number, number, number];
  /** rotação em y (radianos) */
  r: number;
  m: Modo;
  /** está se movendo? */
  v: boolean;
}

export interface JogadorPublico {
  id: string;
  nome: string;
  visitante: boolean;
  aparencia: Aparencia;
  estado: EstadoJogador;
  bebida: number;
}

export interface MensagemChat {
  id: string;
  de: string;
  nome: string;
  texto: string;
  em: number;
}

export interface UsuarioMe {
  id: number;
  username: string;
  aparencia: Aparencia | null;
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
  sino: (d: { id: string }) => void;
  online: (n: number) => void;
  aviso: (texto: string) => void;
}

export interface ClientToServer {
  estado: (e: EstadoJogador) => void;
  chat: (texto: string) => void;
  trocar_sala: (sala: RoomId, ack: (ok: boolean, erro?: string) => void) => void;
  pedir_dose: (ack: (nivel: number) => void) => void;
  tocar_sino: () => void;
}
