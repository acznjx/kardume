import { ADEGA, SALA_ADEGA } from '@cardume/shared';
import type { Caixa, DefColisao } from '../colisao';

export const ASSENTOS_ADEGA = SALA_ADEGA.assentos;
export const RAIO_BANCO = 0.6;
export const RAIO_MESA = ADEGA.raioMesa;
export const BANCOS_CABINES: Caixa[] = ADEGA.cabines.flatMap(([x, z]) => [
  { min: [x - 2.25, z - 3.05] as [number, number], max: [x - 0.95, z + 3.05] as [number, number], topo: ADEGA.alturaAssento },
  ...[-1, 1].map((lado) => ({ min: [x - 0.95, z + lado * 2.4 - 0.65] as [number, number], max: [x + 2.25, z + lado * 2.4 + 0.65] as [number, number], topo: ADEGA.alturaAssento })),
]);
export const ENCOSTOS_CABINES: Caixa[] = ADEGA.cabines.flatMap(([x, z]) => [
  { min: [x - 2.4, z - 3.2] as [number, number], max: [x - 2.1, z + 3.2] as [number, number], topo: 2.65 },
  ...[-1, 1].map((lado) => ({ min: [x - 2.4, z + lado * 3.12 - 0.15] as [number, number], max: [x + 2.25, z + lado * 3.12 + 0.15] as [number, number], topo: 2.65 })),
]);
/** Vãos largos entre as muretas das cabines. */
export const MURETAS: Caixa[] = [-16, -4, 6, 16].map((z, i) => ({ min: [-14.5, z - (i === 0 || i === 3 ? 1.6 : 1.4)], max: [-13.9, z + (i === 0 || i === 3 ? 1.6 : 1.4)], topo: 2.3 }));
export const PILARES = [-12.8, -5.6, -2.4, 4.4, 7.6, 14.4].map((z) => [-14.2, z] as const);
export const BARRIS = [[-22.1, -16.5], [-20.5, -16.6], [22.3, -16.3], [20.8, -16.5], [-10.8, 16.4], [10.8, 16.4]] as const;
export const VASOS = [[-15.5, -16.4], [-15.5, 16.3], [11.6, -16.5], [22.5, 5.1]] as const;
export const CAIXOTES = [[-18.5, -16.6], [8.7, 16.7], [-12.4, 16.5]] as const;
export const DEGRAUS_PALCO: DefColisao['superficies'] = [
  { min: [14, 12.8], max: [23, 13.4], y: 0.27 },
  { min: [14, 13.4], max: [23, 14], y: 0.54 },
];
export const CAIXAS_PALCO: Caixa[] = [
  { min: [14.1, 15.5], max: [15.7, 17.1], base: 0.8, topo: 3.1 },
  { min: [21.4, 15.5], max: [23, 17.1], base: 0.8, topo: 3.1 },
  { min: [17, 15.9], max: [20, 17.5], base: 0.8, topo: 4.6 },
];
