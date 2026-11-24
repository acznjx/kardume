/**
 * Algoritmos puros (sem DOM) para transformar o desenho do jogador num contorno low-poly.
 * 1. máscara binária a partir do alfa
 * 2. maior mancha conectada (flood fill)
 * 3. borda externa ordenada (Moore neighbor tracing)
 * 4. simplificação Douglas-Peucker até caber no limite de pontos
 */

export type Ponto = [number, number];

/** Máscara binária (1 = tinta) a partir de dados RGBA, reduzida por um fator inteiro. */
export function mascaraDoAlfa(rgba: Uint8ClampedArray, w: number, h: number, fator: number, limiar = 24) {
  const mw = Math.ceil(w / fator);
  const mh = Math.ceil(h / fator);
  const m = new Uint8Array(mw * mh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > limiar) m[Math.floor(y / fator) * mw + Math.floor(x / fator)] = 1;
    }
  }
  return { m, w: mw, h: mh };
}

/** Dilata a máscara (junta traços quase encostados). */
export function dilatar(m: Uint8Array, w: number, h: number, raio = 1) {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      for (let dy = -raio; dy <= raio; dy++) {
        for (let dx = -raio; dx <= raio; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) out[ny * w + nx] = 1;
        }
      }
    }
  }
  return out;
}

/** Mantém só a maior região conectada (vizinhança 8). */
export function maiorMancha(m: Uint8Array, w: number, h: number) {
  const rotulo = new Int32Array(m.length).fill(-1);
  let melhor = -1;
  let melhorTam = 0;
  let atual = 0;
  const pilha: number[] = [];
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || rotulo[i] !== -1) continue;
    let tam = 0;
    pilha.push(i);
    rotulo[i] = atual;
    while (pilha.length) {
      const p = pilha.pop()!;
      tam++;
      const px = p % w;
      const py = (p - px) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (m[n] && rotulo[n] === -1) {
            rotulo[n] = atual;
            pilha.push(n);
          }
        }
      }
    }
    if (tam > melhorTam) {
      melhorTam = tam;
      melhor = atual;
    }
    atual++;
  }
  const out = new Uint8Array(m.length);
  if (melhor >= 0) for (let i = 0; i < m.length; i++) if (rotulo[i] === melhor) out[i] = 1;
  return { m: out, tamanho: melhorTam };
}

// vizinhos em sentido horário a partir do oeste
const DIR: Ponto[] = [
  [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1],
];

/** Borda externa da região (Moore neighbor tracing), em coordenadas de pixel. */
export function tracarBorda(m: Uint8Array, w: number, h: number): Ponto[] {
  const em = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
  let inicio: Ponto | null = null;
  for (let y = 0; y < h && !inicio; y++) for (let x = 0; x < w && !inicio; x++) if (em(x, y)) inicio = [x, y];
  if (!inicio) return [];

  const borda: Ponto[] = [inicio];
  let atual: Ponto = inicio;
  let dirEntrada = 0; // viemos do oeste (pixel à esquerda do início está vazio)
  const max = w * h * 4;
  for (let passos = 0; passos < max; passos++) {
    let achou = false;
    for (let k = 0; k < 8; k++) {
      const d = (dirEntrada + k) % 8;
      const nx = atual[0] + DIR[d][0];
      const ny = atual[1] + DIR[d][1];
      if (em(nx, ny)) {
        atual = [nx, ny];
        // próxima busca começa no vizinho anterior ao encontrado (backtrack)
        dirEntrada = (d + 6) % 8;
        achou = true;
        break;
      }
    }
    if (!achou) break; // pixel isolado
    if (atual[0] === inicio[0] && atual[1] === inicio[1]) break;
    borda.push(atual);
  }
  return borda;
}

function distSeg(p: Ponto, a: Ponto, b: Ponto) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function dp(pts: Ponto[], eps: number): Ponto[] {
  if (pts.length < 3) return pts;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distSeg(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  const a = dp(pts.slice(0, idx + 1), eps);
  const b = dp(pts.slice(idx), eps);
  return [...a.slice(0, -1), ...b];
}

/** Douglas-Peucker para polígono fechado. */
export function simplificarFechado(pts: Ponto[], eps: number): Ponto[] {
  if (pts.length < 4) return pts;
  // divide no ponto mais distante do primeiro para o polígono fechado funcionar bem
  let longe = 0;
  let maxD = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > maxD) {
      maxD = d;
      longe = i;
    }
  }
  const a = dp(pts.slice(0, longe + 1), eps);
  const b = dp([...pts.slice(longe), pts[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

/** Ajusta o epsilon até o contorno ter no máximo `alvo` pontos. */
export function simplificarAte(pts: Ponto[], alvo: number, epsInicial = 0.8): Ponto[] {
  let eps = epsInicial;
  let r = simplificarFechado(pts, eps);
  while (r.length > alvo && eps < 50) {
    eps *= 1.25;
    r = simplificarFechado(pts, eps);
  }
  return r;
}

export function areaPoligono(pts: Ponto[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Pipeline completo: dados RGBA do canvas -> contorno normalizado (0..1) com no máximo `alvo` pontos.
 * Retorna null se o desenho for pequeno demais.
 */
export function contornoDoDesenho(rgba: Uint8ClampedArray, w: number, h: number, alvo = 56): Ponto[] | null {
  const fator = 4;
  const { m, w: mw, h: mh } = mascaraDoAlfa(rgba, w, h, fator);
  // moldura vazia de 1 pixel para a borda nunca encostar no limite
  const comMoldura = new Uint8Array((mw + 2) * (mh + 2));
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) comMoldura[(y + 1) * (mw + 2) + x + 1] = m[y * mw + x];
  const W = mw + 2;
  const H = mh + 2;
  const dil = dilatar(comMoldura, W, H, 1);
  const { m: mancha, tamanho } = maiorMancha(dil, W, H);
  if (tamanho < 30) return null;
  const borda = tracarBorda(mancha, W, H);
  if (borda.length < 8) return null;
  const simples = simplificarAte(borda, alvo);
  if (simples.length < 3) return null;
  return simples.map(([x, y]) => [
    Math.min(1, Math.max(0, ((x - 1 + 0.5) * fator) / w)),
    Math.min(1, Math.max(0, ((y - 1 + 0.5) * fator) / h)),
  ]);
}
