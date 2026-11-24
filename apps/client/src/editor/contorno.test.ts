import { describe, expect, it } from 'vitest';
import { areaPoligono, contornoDoDesenho, simplificarAte, tracarBorda } from './contorno';

function desenharElipse(w: number, h: number, cx: number, cy: number, rx: number, ry: number) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) rgba[(y * w + x) * 4 + 3] = 255;
  return rgba;
}

describe('contorno do desenho', () => {
  it('traça a borda de um quadrado', () => {
    const w = 10;
    const m = new Uint8Array(w * w);
    for (let y = 2; y < 7; y++) for (let x = 2; x < 7; x++) m[y * w + x] = 1;
    const borda = tracarBorda(m, w, w);
    expect(borda.length).toBe(16);
    const s = simplificarAte(borda, 8, 0.5);
    expect(s.length).toBe(4);
  });

  it('gera um contorno low-poly para uma elipse', () => {
    const rgba = desenharElipse(512, 256, 256, 128, 200, 90);
    const c = contornoDoDesenho(rgba, 512, 256, 40)!;
    expect(c).not.toBeNull();
    expect(c.length).toBeGreaterThanOrEqual(8);
    expect(c.length).toBeLessThanOrEqual(40);
    // área normalizada próxima de pi*rx*ry/(w*h)
    const area = Math.abs(areaPoligono(c));
    const esperado = (Math.PI * 200 * 90) / (512 * 256);
    expect(area).toBeGreaterThan(esperado * 0.85);
    expect(area).toBeLessThan(esperado * 1.15);
    for (const [x, y] of c) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });

  it('ignora desenho vazio', () => {
    expect(contornoDoDesenho(new Uint8ClampedArray(64 * 32 * 4), 64, 32)).toBeNull();
  });
});
