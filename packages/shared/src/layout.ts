/**
 * Layout das salas compartilhado entre client e servidor: onde ficam assentos, pontos de dose,
 * mesas e zonas. O servidor usa isso para validar ações (sentar, pedir dose); o client, para
 * desenhar os móveis exatamente nos mesmos lugares.
 *
 * Cada sala tem o próprio arquivo em ./salas/ — aqui só se juntam as listas.
 * Convenções: (x, z) no plano do chão, y para cima. Yaw 0 = olhando para +Z; PI/2 = olhando para +X.
 */
import { SALA_ADEGA } from './salas/adega';
import { SALA_NAVIO } from './salas/navio';
import type { Assento, PontoInteracao, V3 } from './salas/tipos';

export * from './salas/tipos';
export { ADEGA, SALA_ADEGA } from './salas/adega';
export { NAVIO, SALA_NAVIO } from './salas/navio';

export const SALAS = { navio: SALA_NAVIO, adega: SALA_ADEGA } as const;

export const ASSENTOS: Assento[] = [...SALA_ADEGA.assentos, ...SALA_NAVIO.assentos];
export const ASSENTO_POR_ID = new Map(ASSENTOS.map((a) => [a.id, a]));

export const INTERACOES: PontoInteracao[] = [...SALA_ADEGA.interacoes, ...SALA_NAVIO.interacoes];
export const INTERACAO_POR_ID = new Map(INTERACOES.map((p) => [p.id, p]));

/** Distância "de interação": no plano, mas exige estar mais ou menos na mesma altura (pés). */
export function alcanca(pePos: readonly number[], ponto: { pos: V3; raio: number }, folga = 0) {
  const dx = pePos[0] - ponto.pos[0];
  const dz = pePos[2] - ponto.pos[2];
  return Math.hypot(dx, dz) <= ponto.raio + folga && Math.abs(pePos[1] - ponto.pos[1]) < 2.6 + folga;
}
