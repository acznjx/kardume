import * as THREE from 'three';
import type { Ponto } from '../../editor/contorno';

/** Tamanho do canvas do editor (proporção 2:1). */
export const CANVAS_W = 512;
export const CANVAS_H = 256;
const COR_PAPEL = '#f3eee2';

/**
 * Gera a malha "inflada" do peixe desenhado: o contorno low-poly vira um THREE.Shape,
 * que é extrudado com bevel. A UV é planar (o próprio desenho é a textura dos dois lados).
 * Sistema local igual ao dos modelos prontos: frente = +X (o jogador desenha o peixe olhando para a direita).
 */
export function geometriaDoContorno(contorno: Ponto[]) {
  const pts = contorno.map(([x, y]) => new THREE.Vector2(x * 2, 1 - y));
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.09,
    bevelOffset: -0.09,
    bevelSegments: 3,
    curveSegments: 1,
    steps: 1,
  });

  // UV planar a partir de x,y (antes de centralizar/escalar)
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / 2;
    uv[i * 2 + 1] = pos.getY(i);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const cx = (bb.min.x + bb.max.x) / 2;
  const cy = (bb.min.y + bb.max.y) / 2;
  const cz = (bb.min.z + bb.max.z) / 2;
  geo.translate(-cx, -cy, -cz);
  const larg = bb.max.x - bb.min.x;
  const alt = bb.max.y - bb.min.y;
  const k = Math.min(1.9 / larg, 1.35 / alt);
  geo.scale(k, k, k);
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  return { geo, base: -geo.boundingBox!.min.y, altura: geo.boundingBox!.max.y - geo.boundingBox!.min.y };
}

/**
 * Textura do peixe: pinta o interior do contorno com cor de papel (assim um peixe só de contorno
 * fica "branco com traço"), desenha o PNG por cima e espalha as cores das bordas para fora
 * (evita franjas escuras nas laterais da extrusão).
 */
export function texturaDoDesenho(img: CanvasImageSource, contorno: Ponto[]) {
  const c = document.createElement('canvas');
  c.width = CANVAS_W;
  c.height = CANVAS_H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  preencherInterior(ctx);
  // as bordas do desenho escorrem para fora: as laterais da extrusão ficam com a cor do traço
  sangrar(ctx, 14);
  // o que ainda sobrou transparente dentro do contorno vira papel
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = COR_PAPEL;
  ctx.beginPath();
  contorno.forEach(([x, y], i) => (i ? ctx.lineTo(x * CANVAS_W, y * CANVAS_H) : ctx.moveTo(x * CANVAS_W, y * CANVAS_H)));
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  sangrar(ctx, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Pinta de "papel" os buracos transparentes cercados pelo desenho (o interior de um peixe
 * feito só de contorno), sem tocar no lado de fora: flood fill a partir das bordas do canvas.
 */
function preencherInterior(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = ctx.canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const fora = new Uint8Array(w * h);
  const pilha: number[] = [];
  const tentar = (p: number) => {
    if (!fora[p] && d[p * 4 + 3] < 128) {
      fora[p] = 1;
      pilha.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    tentar(x);
    tentar((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    tentar(y * w);
    tentar(y * w + w - 1);
  }
  while (pilha.length) {
    const p = pilha.pop()!;
    const x = p % w;
    if (x > 0) tentar(p - 1);
    if (x < w - 1) tentar(p + 1);
    if (p >= w) tentar(p - w);
    if (p < w * (h - 1)) tentar(p + w);
  }
  const papel = new THREE.Color(COR_PAPEL);
  for (let p = 0; p < w * h; p++) {
    if (fora[p] || d[p * 4 + 3] >= 128) continue;
    const a = d[p * 4 + 3] / 255;
    d[p * 4] = d[p * 4] * a + papel.r * 255 * (1 - a);
    d[p * 4 + 1] = d[p * 4 + 1] * a + papel.g * 255 * (1 - a);
    d[p * 4 + 2] = d[p * 4 + 2] * a + papel.b * 255 * (1 - a);
    d[p * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Espalha pixels opacos para os vizinhos transparentes, `passadas` vezes (sem alocar por pixel). */
function sangrar(ctx: CanvasRenderingContext2D, passadas: number) {
  const { width: w, height: h } = ctx.canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const copia = new Uint8ClampedArray(d.length);
  for (let p = 0; p < passadas; p++) {
    copia.set(d);
    let mudou = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (copia[i + 3] > 200) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        if (x > 0 && copia[i - 1] > 200) { r += copia[i - 4]; g += copia[i - 3]; b += copia[i - 2]; n++; }
        if (x < w - 1 && copia[i + 7] > 200) { r += copia[i + 4]; g += copia[i + 5]; b += copia[i + 6]; n++; }
        const cima = i - w * 4;
        if (y > 0 && copia[cima + 3] > 200) { r += copia[cima]; g += copia[cima + 1]; b += copia[cima + 2]; n++; }
        const baixo = i + w * 4;
        if (y < h - 1 && copia[baixo + 3] > 200) { r += copia[baixo]; g += copia[baixo + 1]; b += copia[baixo + 2]; n++; }
        if (n) {
          d[i] = r / n;
          d[i + 1] = g / n;
          d[i + 2] = b / n;
          d[i + 3] = 255;
          mudou = true;
        }
      }
    }
    if (!mudou) break;
  }
  ctx.putImageData(img, 0, 0);
}

/** Material com ondulação de nado no vertex shader (a cauda, em -X, balança mais). */
export function materialOndulante(map: THREE.Texture) {
  const m = new THREE.MeshLambertMaterial({ map, flatShading: true });
  const uniforms = { uTempo: { value: 0 }, uForca: { value: 1 } };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = uniforms.uTempo;
    shader.uniforms.uForca = uniforms.uForca;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTempo;\nuniform float uForca;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float cauda = smoothstep(0.35, -1.0, position.x);
        transformed.z += sin(uTempo * 9.0 - position.x * 2.6) * 0.16 * cauda * uForca;`,
      );
  };
  m.customProgramCacheKey = () => 'peixe-ondulante';
  return { material: m, uniforms };
}

export function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}
