import { ADEGA } from '@cardume/shared';
import type { DefColisao } from '../colisao';
import { ASSENTOS_ADEGA, BANCOS_CABINES, BARRIS, CAIXAS_PALCO, CAIXOTES, DEGRAUS_PALCO, ENCOSTOS_CABINES, MURETAS, PILARES, RAIO_BANCO, RAIO_MESA, VASOS } from './medidas';

const b = ADEGA.balcao;
const p = ADEGA.palco;
export const COLISAO_ADEGA: DefColisao = {
  caixas: [
    { min: [b.x0 - 0.2, b.z0 - 0.22], max: [b.x1 + 0.2, b.z1 + 0.22], topo: b.altura },
    { min: [b.x0 - 0.3, -17.9], max: [b.x1 + 0.3, -16.5], topo: 6.8 },
    { min: [-3.1, 17.5], max: [3.1, 18], base: 4.8, topo: 8 },
    ...BANCOS_CABINES, ...ENCOSTOS_CABINES, ...MURETAS,
    ...PILARES.map(([x, z]) => ({ min: [x - 0.25, z - 0.25] as [number, number], max: [x + 0.25, z + 0.25] as [number, number], topo: 7.5 })),
    ...ADEGA.cabines.map(([x, z]) => ({ min: [x - 0.6, z - 1.15] as [number, number], max: [x + 1.8, z + 1.15] as [number, number], topo: ADEGA.alturaMesa })),
    ...CAIXOTES.map(([x, z]) => ({ min: [x - 0.65, z - 0.65] as [number, number], max: [x + 0.65, z + 0.65] as [number, number], topo: 1.3 })),
    ...CAIXAS_PALCO,
    // O recuo permite alcançar os degraus antes da colisão lateral.
    { min: [p.x0 + 0.65, p.z0 + 0.65], max: [p.x1 - 0.65, p.z1 - 0.65], topo: p.altura },
    { min: [12.7, 8.2], max: [12.95, 17.5], topo: 1.45 },
  ],
  circulos: [
    ...ADEGA.mesas.map(([x, z]) => ({ x, z, r: RAIO_MESA, topo: ADEGA.alturaMesa })),
    ...ASSENTOS_ADEGA.filter((a) => !a.id.startsWith('cabine')).map((a) => ({ x: a.pos[0], z: a.pos[2], r: RAIO_BANCO, topo: a.pos[1] })),
    ...BARRIS.map(([x, z]) => ({ x, z, r: 0.85, topo: 1.6 })),
    ...VASOS.map(([x, z]) => ({ x, z, r: 0.6, topo: 1 })),
  ],
  superficies: [{ min: [p.x0, p.z0], max: [p.x1, p.z1], y: p.altura }, ...DEGRAUS_PALCO],
  lajes: [],
};
