import * as THREE from 'three';

/**
 * Estilo visual do Cardume: low-poly, flat shading, cores sólidas e saturadas,
 * materiais foscos (Lambert) — o 3D "clássico" do começo dos anos 2010.
 * Ver docs/estilo-visual.md.
 */
export const PALETA = {
  // água / ambiente
  aguaFundo: '#2f7f86',
  aguaNeblina: '#3a8a8f',
  // adega
  paredeTeal: '#2e8a87',
  paredeTealEscura: '#236f6d',
  madeira: '#8a5a34',
  madeiraClara: '#a8723f',
  madeiraEscura: '#5e3b22',
  chaoAreia: '#cdb68e',
  latao: '#b58a3c',
  vidroVerde: '#4f8a3c',
  vidroAzul: '#2e9bd6',
  caneca: '#efe6cf',
  lampada: '#ffd27a',
  // navio
  areia: '#d6b986',
  areiaEscura: '#c2a574',
  pedra: '#7d8a8a',
  pedraEscura: '#5f6b6c',
  alga: '#3f8a4c',
  algaEscura: '#2c6b3a',
  coral: '#e8746a',
  coralLaranja: '#f09a4a',
  coralRoxo: '#a36ab8',
  cascoNavio: '#6b4a2e',
  // peixes
  laranja: '#f07a22',
  branco: '#f6f1e6',
  preto: '#1e1e1e',
  amarelo: '#f2c53d',
  rosa: '#ec8a8a',
  azulPeixe: '#6f8fb8',
  marromPeixe: '#c9663e',
  roxo: '#8a6cc2',
  verde: '#9fb84a',
  azulBarman: '#5f6fc0',
} as const;

const cache = new Map<string, THREE.MeshLambertMaterial>();

/**
 * Cáusticas: a rede de luz dançante que o sol faz no fundo do mar. São desenhadas no próprio
 * shader dos materiais `mat()`, só em superfícies viradas para cima, e controladas por uniforms
 * globais (a sala liga/desliga com `definirCausticas`).
 */
const CAUSTICAS = { uCausTempo: { value: 0 }, uCausForca: { value: 0 } };

export function definirCausticas(tempo: number, forca: number) {
  CAUSTICAS.uCausTempo.value = tempo;
  CAUSTICAS.uCausForca.value = forca;
}

function comCausticas(m: THREE.MeshLambertMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCausTempo = CAUSTICAS.uCausTempo;
    shader.uniforms.uCausForca = CAUSTICAS.uCausForca;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCausMundo;\nvarying float vCausCima;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 causMundo = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          causMundo = instanceMatrix * causMundo;
        #endif
        causMundo = modelMatrix * causMundo;
        vCausMundo = causMundo.xyz;
        vec3 causN = objectNormal;
        #ifdef USE_INSTANCING
          causN = mat3(instanceMatrix) * causN;
        #endif
        vCausCima = normalize(mat3(modelMatrix) * causN).y;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uCausTempo;
        uniform float uCausForca;
        varying vec3 vCausMundo;
        varying float vCausCima;
        float causticas(vec2 p, float t) {
          p *= 0.42;
          vec2 q = p;
          float v = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            q = p + vec2(sin(t * 0.55 + q.y * 1.6 + fi * 1.3), cos(t * 0.47 + q.x * 1.4 + fi * 2.1));
            v += abs(sin(q.x * 2.0 + q.y * 1.7 + t * 0.8 + fi));
          }
          v /= 3.0;
          return pow(clamp(1.0 - v, 0.0, 1.0), 5.0) * 2.2;
        }`,
      )
      .replace(
        '#include <tonemapping_fragment>',
        `if (uCausForca > 0.001) {
          float causC = causticas(vCausMundo.xz, uCausTempo) * smoothstep(0.35, 0.95, vCausCima);
          // somem com a profundidade (y alto = mais perto da superfície = mais forte)
          // proporcional à cor da superfície: forte na areia clara, discreta na madeira escura
          float causAlbedo = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 causLuz = mix(vec3(0.30, 0.42, 0.40), diffuseColor.rgb * 0.9 + vec3(0.06, 0.1, 0.1), 0.6);
          gl_FragColor.rgb += causC * uCausForca * causLuz * smoothstep(0.12, 0.6, causAlbedo) * clamp(0.75 + vCausMundo.y * 0.02, 0.4, 1.1);
        }
        #include <tonemapping_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'cardume-causticas';
  return m;
}

/** Material fosco com flat shading, compartilhado por cor. */
export function mat(cor: string, opcoes: { emissivo?: string; intensidade?: number; vertexColors?: boolean } = {}) {
  const chave = `${cor}|${opcoes.emissivo ?? ''}|${opcoes.intensidade ?? 0}|${opcoes.vertexColors ? 1 : 0}`;
  let m = cache.get(chave);
  if (!m) {
    m = comCausticas(
      new THREE.MeshLambertMaterial({
        color: cor,
        flatShading: true,
        vertexColors: opcoes.vertexColors ?? false,
        emissive: opcoes.emissivo ?? '#000000',
        emissiveIntensity: opcoes.intensidade ?? 0,
      }),
    );
    cache.set(chave, m);
  }
  return m;
}

/** Desloca levemente os vértices para tirar a cara de "primitiva perfeita". */
export function amassar(geo: THREE.BufferGeometry, forca = 0.05, semente = 1) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const mapa = new Map<string, [number, number, number]>();
  let s = semente;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
  for (let i = 0; i < pos.count; i++) {
    // mesma posição -> mesmo deslocamento (mantém a malha fechada)
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let d = mapa.get(k);
    if (!d) {
      d = [rnd() * forca, rnd() * forca, rnd() * forca];
      mapa.set(k, d);
    }
    pos.setXYZ(i, pos.getX(i) + d[0], pos.getY(i) + d[1], pos.getZ(i) + d[2]);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Pinta cada face com uma cor escolhida por uma função da posição do centro (low-poly com listras, manchas etc.). */
export function pintarFaces(geo: THREE.BufferGeometry, cor: (c: THREE.Vector3) => string) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.getAttribute('position');
  const cores = new Float32Array(pos.count * 3);
  const c = new THREE.Vector3();
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    c.set(0, 0, 0);
    for (let k = 0; k < 3; k++) c.add(new THREE.Vector3(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)));
    c.divideScalar(3);
    tmp.set(cor(c));
    for (let k = 0; k < 3; k++) {
      cores[(i + k) * 3] = tmp.r;
      cores[(i + k) * 3 + 1] = tmp.g;
      cores[(i + k) * 3 + 2] = tmp.b;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  g.computeVertexNormals();
  return g;
}

/** Textura de texto em madeira/papel para placas. */
export function texturaTexto(
  texto: string,
  { largura = 1024, altura = 256, fonte = 'Alfa Slab One', cor = '#2a1a0e', fundo = '#d9b77c', tamanho = 140 } = {},
) {
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, largura, altura);
  // veios da madeira
  ctx.strokeStyle = 'rgba(90,55,25,0.18)';
  ctx.lineWidth = 3;
  for (let y = 18; y < altura; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= largura; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + y) * 4);
    ctx.stroke();
  }
  ctx.fillStyle = cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let t = tamanho;
  ctx.font = `${t}px "${fonte}", Georgia, serif`;
  while (ctx.measureText(texto).width > largura * 0.88 && t > 20) {
    t -= 6;
    ctx.font = `${t}px "${fonte}", Georgia, serif`;
  }
  ctx.fillText(texto, largura / 2, altura / 2 + t * 0.05);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
