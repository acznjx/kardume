import type * as THREE from 'three';

/** Obstáculo em caixa (planta x/z) que bloqueia entre as alturas `base` e `topo`. */
export interface Caixa {
  min: [number, number];
  max: [number, number];
  base?: number;
  topo: number;
}
export interface Circulo {
  x: number;
  z: number;
  r: number;
  base?: number;
  topo: number;
}
/** Laje: um "piso/teto" horizontal que não pode ser atravessado na vertical (ex.: convés do navio). */
export interface Laje {
  min: [number, number];
  max: [number, number];
  baixo: number;
  cima: number;
}

export interface DefColisao {
  caixas: Caixa[];
  circulos: Circulo[];
  /** superfícies onde dá para ficar em pé (topo de caixas, convés etc.) */
  superficies: { min: [number, number]; max: [number, number]; y: number }[];
  lajes: Laje[];
}

const dentro = (x: number, z: number, min: [number, number], max: [number, number], folga = 0) =>
  x >= min[0] - folga && x <= max[0] + folga && z >= min[1] - folga && z <= max[1] + folga;

/**
 * Altura do chão sob (x, z), considerando superfícies alcançáveis a partir dos pés em y.
 * `degrau` é quanto o peixe consegue subir andando (escadas e palcos baixos); nadando use 0.
 */
export function alturaChao(def: DefColisao, x: number, z: number, y: number, degrau = 0) {
  let chao = 0;
  const limite = y + Math.max(0.05, degrau);
  for (const s of def.superficies) {
    if (dentro(x, z, s.min, s.max) && s.y <= limite && s.y > chao) chao = s.y;
  }
  return chao;
}

/** Degrau máximo que dá para subir andando em pé. */
export const DEGRAU = 0.9;

/**
 * Empurra o peixe para fora dos obstáculos (no plano x/z) e respeita as lajes (no eixo y).
 * `yAnterior` decide de que lado da laje o peixe está.
 */
export function resolverColisao(def: DefColisao, p: THREE.Vector3, yAnterior: number, raio = 0.55, meiaAltura = 0.6) {
  const pes = p.y - meiaAltura;
  const cabeca = p.y + meiaAltura;

  for (const c of def.caixas) {
    if (cabeca < (c.base ?? -99) || pes > c.topo) continue;
    if (!dentro(p.x, p.z, c.min, c.max, raio)) continue;
    // menor deslocamento para sair
    const opcoes = [
      { d: p.x - (c.min[0] - raio), eixo: 'x', alvo: c.min[0] - raio },
      { d: c.max[0] + raio - p.x, eixo: 'x', alvo: c.max[0] + raio },
      { d: p.z - (c.min[1] - raio), eixo: 'z', alvo: c.min[1] - raio },
      { d: c.max[1] + raio - p.z, eixo: 'z', alvo: c.max[1] + raio },
    ];
    const m = opcoes.reduce((a, b) => (b.d < a.d ? b : a));
    if (m.eixo === 'x') p.x = m.alvo;
    else p.z = m.alvo;
  }

  for (const c of def.circulos) {
    if (cabeca < (c.base ?? -99) || pes > c.topo) continue;
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + raio;
    if (d < min) {
      const f = d > 1e-4 ? min / d : 1;
      p.x = c.x + (d > 1e-4 ? dx * f : min);
      p.z = c.z + (d > 1e-4 ? dz * f : 0);
    }
  }

  for (const l of def.lajes) {
    if (!dentro(p.x, p.z, l.min, l.max)) continue;
    const meio = (l.baixo + l.cima) / 2;
    if (yAnterior < meio) p.y = Math.min(p.y, l.baixo - meiaAltura);
    else p.y = Math.max(p.y, l.cima + meiaAltura * 0.2);
  }
}
