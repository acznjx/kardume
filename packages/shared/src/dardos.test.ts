import { describe, expect, it } from 'vitest';
import { ALVO, miraEm, pontuarDardo } from './dardos';

describe('pontuarDardo', () => {
  it('mosca, 25 e fora', () => {
    expect(pontuarDardo(0, 0)).toEqual({ pontos: 50, rotulo: 'MOSCA' });
    expect(pontuarDardo(0, (ALVO.mosca + ALVO.bull) / 2)).toEqual({ pontos: 25, rotulo: '25' });
    expect(pontuarDardo(0, 1.05)).toEqual({ pontos: 0, rotulo: 'FORA' });
  });

  it('setores e anéis', () => {
    const meioTrio = (ALVO.trioInterno + ALVO.trioExterno) / 2;
    const meioDuplo = (ALVO.duploInterno + ALVO.duploExterno) / 2;
    expect(pontuarDardo(0, 0.4)).toEqual({ pontos: 20, rotulo: 'S20' }); // topo
    expect(pontuarDardo(0, meioTrio)).toEqual({ pontos: 60, rotulo: 'T20' });
    expect(pontuarDardo(0, meioDuplo)).toEqual({ pontos: 40, rotulo: 'D20' });
    expect(pontuarDardo(0.4, 0)).toEqual({ pontos: 6, rotulo: 'S6' }); // direita
    expect(pontuarDardo(0, -0.4)).toEqual({ pontos: 3, rotulo: 'S3' }); // baixo
    expect(pontuarDardo(-0.4, 0)).toEqual({ pontos: 11, rotulo: 'S11' }); // esquerda
  });
});

describe('miraEm', () => {
  it('é determinística e fica perto do alvo', () => {
    const a = miraEm(3.2, 1234, 0);
    expect(miraEm(3.2, 1234, 0)).toEqual(a);
    for (let t = 0; t < 30; t += 0.37) {
      const { x, y } = miraEm(t, 99, 0);
      expect(Math.abs(x)).toBeLessThan(0.9);
      expect(Math.abs(y)).toBeLessThan(0.9);
    }
  });

  it('a bebida treme mais a mira', () => {
    const variacao = (b: number) => {
      let soma = 0;
      for (let t = 0; t < 10; t += 0.01) {
        const p = miraEm(t, 7, b);
        const q = miraEm(t + 0.01, 7, b);
        soma += Math.hypot(p.x - q.x, p.y - q.y);
      }
      return soma;
    };
    expect(variacao(4)).toBeGreaterThan(variacao(0) * 1.3);
  });
});
