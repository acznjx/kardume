/** Bar do Cardume: o desenho, a colisão e o servidor partem destas medidas. */
import { assentosMesa, yawPara, type Assento, type DefinicaoSala, type V3 } from './tipos';

export const ADEGA = {
  largura: 48,
  profundidade: 36,
  teto: 8,
  balcao: { x0: -13, x1: 1, z0: -14.2, z1: -12.2, altura: 1.85 },
  pontosDose: [-11, -7.5, -4, -0.5].map((x) => [x, 0, -9.6] as V3),
  banquetasBalcao: [-12, -9.6, -7.2, -4.8, -2.4, 0].map((x) => [x, 1.25, -10.9] as V3),
  /** Quatro mesas no salão, duas no recanto dos dardos. */
  mesas: [[-6, -4], [6, -4], [-6, 7], [6, 7], [18, -10], [18, 1]] as const,
  raioMesa: 1.6,
  raioAssentosMesa: 2.35,
  alturaMesa: 1.78,
  alturaAssento: 1.05,
  pista: { x0: 13.7, x1: 22.7, z0: 6.8, z1: 12.7 },
  palco: { x0: 13.7, x1: 23.2, z0: 14, z1: 17.5, altura: 0.8 },
  dardos: [[23.6, -10], [23.6, 1]] as const,
  /** Bancos em U, abertos para o corredor lateral (+X). */
  cabines: [-9, 1, 11].map((z) => [-20.6, z] as const),
  entrada: [0, 0, 17.7] as V3,
} as const;

function assentosAdega(): Assento[] {
  const lista: Assento[] = ADEGA.banquetasBalcao.map((pos, i) => ({ id: `balcao-${i}`, sala: 'adega', pos, yaw: Math.PI }));
  ADEGA.mesas.forEach(([x, z], i) => lista.push(...assentosMesa('adega', `mesa${i}`, x, z, ADEGA.alturaAssento, ADEGA.raioAssentosMesa)));
  ADEGA.cabines.forEach(([x, z], i) => {
    const y = ADEGA.alturaAssento;
    const centro: V3 = [x + 0.6, y, z];
    const pontos: V3[] = [[x - 1.6, y, z - 1], [x - 1.6, y, z + 1], [x, y, z - 2.4], [x + 1.6, y, z - 2.4], [x, y, z + 2.4], [x + 1.6, y, z + 2.4]];
    pontos.forEach((pos, k) => lista.push({ id: `cabine${i}-${k}`, sala: 'adega', pos, yaw: yawPara(pos, centro) }));
  });
  return lista;
}

export const SALA_ADEGA: DefinicaoSala = {
  id: 'adega',
  nome: 'Bar do Cardume',
  limites: { min: [-23.3, 0.4, -17.3], max: [23.3, 7.3, 17.3] },
  spawn: [0, 0.9, 13.5],
  porta: { pos: [0, 0, 17.1], raio: 2.5, exigeEmPe: false },
  chegada: [0, 0.9, 13.5],
  assentos: assentosAdega(),
  interacoes: ADEGA.pontosDose.map((pos, i) => ({ id: `dose-${i}`, sala: 'adega', tipo: 'dose', pos, raio: 1.15 })),
};
