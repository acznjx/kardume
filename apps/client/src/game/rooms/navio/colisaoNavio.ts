import { NAVIO } from '@cardume/shared';
import type { Caixa, DefColisao } from '../colisao';
import { DUNAS, RECIFES, ROCHEDOS } from './ambiente';
import { DESTROCOS } from './exteriores';
const C = NAVIO.casco, M = NAVIO.mirante;
const [ax, az] = NAVIO.adega.fachada;
const [tx, tz] = NAVIO.anfiteatro.centro;
const [rx, rz, ry] = NAVIO.arcos[2];
const E = NAVIO.escotilha;
const PISOS_CONVES: { min: [number, number]; max: [number, number] }[] = [
  { min: [C.x0, C.z0], max: [E.x0, C.z1] },
  { min: [E.x1, C.z0], max: [C.x1, C.z1] },
  { min: [E.x0, C.z0], max: [E.x1, E.z0] },
  { min: [E.x0, E.z1], max: [E.x1, C.z1] },
];
const caixas: Caixa[] = [
  { min: [-32.5, -12.6], max: [32, -11.6], topo: 8.8 },
  { min: [-36, -12], max: [-32, 12], topo: 8.8 },
  { min: [32, -10], max: [38, 10], topo: 8.8 },
  { min: [38, -5], max: [42, 5], topo: 10 },
  { min: [-31.5, -8.5], max: [-22.5, 8.5], base: 8, topo: 13.6 },
  { min: [M.x0, M.z0], max: [M.x1, M.z1], base: 8, topo: M.altura },
  // Rocha da adega: duas ombreiras e a verga preservam o corredor da porta.
  { min: [ax - 9, az - 4], max: [ax - 2.4, az + 4], topo: 10 },
  { min: [ax + 2.4, az - 4], max: [ax + 9, az + 4], topo: 10 },
  { min: [ax - 6, az - 4], max: [ax + 6, az + 3], base: 5.2, topo: 12 },
  { min: [52.7, 79.1], max: [61.3, 84.9], topo: 1.9 },
];
let inicio = C.x0 as number;
for (const b of [...NAVIO.buracos].sort((a, b) => a.x0 - b.x0)) {
  caixas.push({ min: [inicio, 11.6], max: [b.x0, 12.9], topo: 8.8 });
  caixas.push({ min: [b.x0, 11.6], max: [b.x1, 12.9], base: b.altura, topo: 8.8 });
  inicio = b.x1;
}
caixas.push({ min: [inicio, 11.6], max: [32, 12.9], topo: 8.8 });
export const COLISAO_NAVIO: DefColisao = {
  caixas,
  circulos: [
    { x: (M.x0 + M.x1) / 2, z: 0, r: 4.7, topo: 12.9 },
    { x: (M.x0 + M.x1) / 2 + 4, z: -3, r: 3.8, topo: 6.5 },
    ...NAVIO.mastros.map(m => ({ x: m.x, z: m.z, r: 0.8, topo: m.altura })),
    { x: NAVIO.praca.centro[0], z: NAVIO.praca.centro[1], r: 2.8, topo: 3.1 },
    ...RECIFES.map(r => ({ x: r.x, z: r.z, r: r.r * 0.7, topo: r.h * 0.85 })),
    ...ROCHEDOS.map(r => ({ x: r.x, z: r.z, r: r.r * 0.85, topo: r.h * 1.25 })),
    ...DESTROCOS.map(d => ({ x: d.x, z: d.z, r: d.r, topo: d.h })),
    { x: NAVIO.perola.centro[0], z: NAVIO.perola.centro[1], r: 5.6, topo: 5 },
    ...DUNAS.map(([x, z]) => ({ x, z, r: 2.8, topo: 1.7 })),
    ...NAVIO.arcos.flatMap(([x, z, y]) => [-1, 1].map(l => ({ x: x + l * 4.8, z, r: 1.6, topo: y + 1 }))),
  ],
  superficies: [
    ...PISOS_CONVES.map(p => ({ ...p, y: C.conves + 0.14 })),
    { min: [-31.5, -8.5], max: [-22.5, 8.5], y: 13.6 },
    { min: [M.x0, M.z0], max: [M.x1, M.z1], y: M.altura + 0.1 },
    ...NAVIO.mastros.map(m => ({ min: [m.x - 2.2, m.z - 2.2] as [number, number], max: [m.x + 2.2, m.z + 2.2] as [number, number], y: m.cesto + 0.2 })),
    { min: [rx - 3.5, rz - 3.5], max: [rx + 3.5, rz + 3.5], y: ry - 4.2 },
    { min: [tx - 4, tz - 4], max: [tx + 4, tz + 4], y: 0.45 },
    ...NAVIO.anfiteatro.degraus.flatMap((r, d) => {
      const [ax, az] = NAVIO.anfiteatro.centro;
      return Array.from({ length: Math.ceil(Math.PI * r / 1.5) }, (_, i) => {
        const a = Math.PI * 0.5 + i / Math.ceil(Math.PI * r / 1.5) * Math.PI;
        const x = ax + Math.cos(a) * r, z = az + Math.sin(a) * r;
        return { min: [x - 1.55, z - 1.55] as [number, number], max: [x + 1.55, z + 1.55] as [number, number], y: (d + 1) * NAVIO.anfiteatro.alturaDegrau };
      });
    }),
  ],
  lajes: PISOS_CONVES.map(p => ({ ...p, baixo: C.conves - 0.4, cima: C.conves + 0.14 })),
};
