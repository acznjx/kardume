/** Tipos comuns às definições de sala. */

export type RoomId = 'navio' | 'adega';
export type V3 = readonly [number, number, number];

export interface Assento {
  id: string;
  sala: RoomId;
  /** posição do assento (y = altura do topo do assento) */
  pos: V3;
  /** para onde o peixe sentado olha (0 = +Z, PI/2 = +X) */
  yaw: number;
}

export type TipoPonto = 'dose' | 'sino' | 'garrafa' | 'quadro';

export interface PontoInteracao {
  id: string;
  sala: RoomId;
  tipo: TipoPonto;
  /** posição no chão (y = altura do piso onde o peixe precisa estar) */
  pos: V3;
  raio: number;
}

/**
 * Tudo que o servidor precisa saber de uma sala. O client usa as mesmas medidas para desenhar.
 * Cada sala vive no seu próprio arquivo (salas/navio.ts, salas/adega.ts).
 */
export interface DefinicaoSala {
  id: RoomId;
  nome: string;
  /** volume onde dá para nadar */
  limites: { min: V3; max: V3 };
  /** onde se nasce ao entrar no jogo (só o navio usa) */
  spawn: V3;
  /** porta para a outra sala: posição no chão e raio de ativação */
  porta: { pos: V3; raio: number; exigeEmPe: boolean };
  /** onde se aparece ao chegar nesta sala vindo da outra */
  chegada: V3;
  assentos: Assento[];
  interacoes: PontoInteracao[];
  /** correntes marinhas: quem nada dentro do raio é levado ao longo do caminho (do 1º ao último ponto) */
  correntes?: Corrente[];
}

export interface Corrente {
  id: string;
  pontos: V3[];
  raio: number;
  /** unidades por segundo */
  velocidade: number;
}

export const yawPara = (de: readonly number[], para: readonly number[]) => Math.atan2(para[0] - de[0], para[2] - de[2]);

/** 4 assentos em volta de uma mesa redonda, todos virados para o centro. */
export const assentosMesa = (sala: RoomId, prefixo: string, cx: number, cz: number, y: number, raio = 1.95): Assento[] =>
  [
    [raio, 0],
    [-raio, 0],
    [0, raio],
    [0, -raio],
  ].map(([dx, dz], i) => {
    const pos: V3 = [cx + dx, y, cz + dz];
    return { id: `${prefixo}-${i}`, sala, pos, yaw: yawPara(pos, [cx, y, cz]) };
  });
