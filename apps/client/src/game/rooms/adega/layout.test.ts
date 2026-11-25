import { describe, expect, it } from 'vitest';
import { ADEGA, SALA_ADEGA } from '@cardume/shared';
import { alturaChao } from '../colisao';
import { COLISAO_ADEGA } from './colisao';
import { BANCOS_CABINES } from './medidas';

describe('contrato da Adega', () => {
  it('oferece 48 lugares únicos, com apoio exatamente na altura do contrato', () => {
    expect(SALA_ADEGA.assentos).toHaveLength(48);
    expect(new Set(SALA_ADEGA.assentos.map((s) => s.id)).size).toBe(48);
    for (const a of SALA_ADEGA.assentos) {
      const [x, y, z] = a.pos;
      expect(x).toBeGreaterThan(SALA_ADEGA.limites.min[0]);
      expect(x).toBeLessThan(SALA_ADEGA.limites.max[0]);
      expect(Math.abs(z)).toBeLessThan(17.3);
      if (a.id.startsWith('cabine')) {
        expect(BANCOS_CABINES.some((b) => x >= b.min[0] && x <= b.max[0] && z >= b.min[1] && z <= b.max[1] && b.topo === y)).toBe(true);
      } else {
        expect(COLISAO_ADEGA.circulos.some((c) => c.x === x && c.z === z && c.topo === y)).toBe(true);
      }
    }
  });
  it('mantém quatro doses alcançáveis sem tomar a interação das banquetas', () => {
    const doses = SALA_ADEGA.interacoes.filter((p) => p.tipo === 'dose');
    expect(doses.map((p) => p.id)).toEqual(['dose-0', 'dose-1', 'dose-2', 'dose-3']);
    for (const p of doses) {
      expect(p.pos[2]).toBeGreaterThan(ADEGA.balcao.z1);
      for (const a of SALA_ADEGA.assentos.filter((s) => s.id.startsWith('balcao'))) {
        expect(Math.hypot(p.pos[0] - a.pos[0], p.pos[2] - a.pos[2])).toBeGreaterThan(p.raio);
      }
    }
  });
  it('mantém as duas raias sem móveis entre a linha e os alvos', () => {
    const pontos = SALA_ADEGA.interacoes.filter((p) => p.tipo === 'dardo');
    expect(pontos.map((p) => p.id)).toEqual(['dardo-0', 'dardo-1']);
    for (const [i, [x, z]] of ADEGA.dardos.entries()) {
      expect(pontos[i].pos).toEqual([ADEGA.linhaDardos, 0, z]);
      for (const c of COLISAO_ADEGA.circulos) {
        const px = Math.max(ADEGA.linhaDardos, Math.min(x, c.x));
        const pz = Math.max(z - 1.4, Math.min(z + 1.4, c.z));
        expect(Math.hypot(c.x - px, c.z - pz)).toBeGreaterThan(c.r);
      }
      for (const b of COLISAO_ADEGA.caixas) {
        expect(b.max[0] < ADEGA.linhaDardos || b.min[0] > x || b.max[1] < z - 1.4 || b.min[1] > z + 1.4).toBe(true);
      }
    }
  });
  it('deixa um corredor central de mais de 3,5 unidades até o balcão', () => {
    const meiaPassagem = 1.75;
    for (const c of COLISAO_ADEGA.circulos.filter((c) => c.z > -10 && c.z < 15)) expect(Math.abs(c.x) - c.r).toBeGreaterThan(meiaPassagem);
    for (const b of COLISAO_ADEGA.caixas.filter((b) => b.max[1] > -9 && b.min[1] < 15)) expect(b.max[0] < -meiaPassagem || b.min[0] > meiaPassagem).toBe(true);
    expect(Math.hypot(SALA_ADEGA.chegada[0] - SALA_ADEGA.porta.pos[0], SALA_ADEGA.chegada[2] - SALA_ADEGA.porta.pos[2])).toBeGreaterThan(SALA_ADEGA.porta.raio);
  });
  it('sobe ao palco em três passos de até 0,27, usando o mesmo piso da colisão', () => {
    expect(alturaChao(COLISAO_ADEGA, 18, 13.1, 0, 0.9)).toBe(0.27);
    expect(alturaChao(COLISAO_ADEGA, 18, 13.7, 0.27, 0.9)).toBe(0.54);
    expect(alturaChao(COLISAO_ADEGA, 18, 14.3, 0.54, 0.9)).toBe(0.8);
  });
});
