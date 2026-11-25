import * as THREE from 'three';
import { CORES_ROUPA, ROUPA_PADRAO, type Roupa } from '@cardume/shared';
import { mat } from '../style/materials';
import { mesclarEmUmaMalha } from './mesclar';

/**
 * Pontos de encaixe da roupa, medidos no próprio corpo do peixe (modelo pronto ou desenho).
 * Sistema do modelo: X = frente, Y = cima, Z = lado.
 */
export interface Medidas {
  /** ponta do nariz */
  frente: number;
  /** onde o chapéu senta: x e altura da cabeça nesse ponto */
  chapeuX: number;
  chapeuY: number;
  /** olhos (óculos): x, y e meia-largura do corpo na altura do olho */
  olhoX: number;
  olhoY: number;
  olhoZ: number;
  /** "pescoço" (cachecol, gravata, colar): x, topo, base e meia-largura */
  pescocoX: number;
  pescocoTopo: number;
  pescocoBase: number;
  pescocoZ: number;
}

const raio = new THREE.Raycaster();
const origem = new THREE.Vector3();
const direcao = new THREE.Vector3();

/** Primeiro ponto do corpo atingido por um raio (ou null). */
function tocar(obj: THREE.Object3D, o: [number, number, number], d: [number, number, number]) {
  raio.set(origem.set(...o), direcao.set(...d).normalize());
  return raio.intersectObject(obj, true)[0]?.point ?? null;
}

/**
 * Mede o corpo recém-montado (ainda sem pai, então as coordenadas são locais).
 * `olho`: posição conhecida do olho (modelos prontos); nos desenhos ela é estimada.
 */
export function medirCorpo(obj: THREE.Object3D, olho?: { x: number; y: number }): Medidas {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const frente = box.max.x;
  const comp = box.max.x - box.min.x;
  const meioY = (box.max.y + box.min.y) / 2;
  const longe = 10;

  const chapeuX = frente - Math.min(0.5, comp * 0.27);
  const chapeuY = tocar(obj, [chapeuX, longe, 0], [0, -1, 0])?.y ?? box.max.y;

  const olhoX = olho?.x ?? frente - Math.min(0.28, comp * 0.15);
  const olhoY = olho?.y ?? meioY + (box.max.y - meioY) * 0.32;
  const olhoZ = tocar(obj, [olhoX, olhoY, longe], [0, 0, -1])?.z ?? box.max.z;

  const pescocoX = frente - Math.min(0.62, comp * 0.33);
  const pescocoTopo = tocar(obj, [pescocoX, longe, 0], [0, -1, 0])?.y ?? box.max.y;
  const pescocoBase = tocar(obj, [pescocoX, -longe, 0], [0, 1, 0])?.y ?? box.min.y;
  const pescocoZ =
    tocar(obj, [pescocoX, (pescocoTopo + pescocoBase) / 2, longe], [0, 0, -1])?.z ?? box.max.z;

  return { frente, chapeuX, chapeuY, olhoX, olhoY, olhoZ: Math.max(0.05, olhoZ), pescocoX, pescocoTopo, pescocoBase, pescocoZ: Math.max(0.05, pescocoZ) };
}

const cor = (c: keyof typeof CORES_ROUPA) => CORES_ROUPA[c];
const OURO = '#e0b84a';
const PRETO = '#262626';

function malha(geo: THREE.BufferGeometry, c: string, pos?: [number, number, number], rot?: [number, number, number], esc?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat(c));
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (esc) m.scale.set(...esc);
  return m;
}

/* ---------------- chapéus (montados em volta da origem, depois posicionados) ---------------- */

function chapeu(r: Roupa): THREE.Object3D | null {
  const c = cor(r.corChapeu);
  const g = new THREE.Group();
  switch (r.chapeu) {
    case 'bone': {
      g.add(malha(new THREE.SphereGeometry(0.36, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), c, [0, -0.02, 0], undefined, [1, 0.72, 1]));
      g.add(malha(new THREE.BoxGeometry(0.42, 0.035, 0.5), c, [0.4, 0.0, 0], [0, 0, -0.08]));
      g.add(malha(new THREE.IcosahedronGeometry(0.045, 0), c, [0, 0.25, 0]));
      break;
    }
    case 'gorro': {
      g.add(malha(new THREE.SphereGeometry(0.36, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), c, [0, 0, 0], undefined, [1, 1.05, 1]));
      g.add(malha(new THREE.CylinderGeometry(0.38, 0.38, 0.13, 8), c, [0, 0.0, 0]));
      g.add(malha(new THREE.IcosahedronGeometry(0.11, 1), cor('creme'), [0, 0.41, 0]));
      break;
    }
    case 'pescador': {
      g.add(malha(new THREE.CylinderGeometry(0.27, 0.33, 0.24, 8), c, [0, 0.1, 0]));
      g.add(malha(new THREE.CylinderGeometry(0.54, 0.54, 0.035, 10), c, [0, -0.01, 0]));
      break;
    }
    case 'cartola': {
      const fita = r.corChapeu === 'coral' ? cor('preto') : cor('coral');
      g.add(malha(new THREE.CylinderGeometry(0.28, 0.27, 0.56, 8), c, [0, 0.28, 0]));
      g.add(malha(new THREE.CylinderGeometry(0.285, 0.285, 0.09, 8), fita, [0, 0.1, 0]));
      g.add(malha(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 10), c, [0, 0.0, 0]));
      break;
    }
    case 'coroa': {
      g.add(malha(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 8, 1, true), OURO, [0, 0.08, 0]));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.add(malha(new THREE.ConeGeometry(0.075, 0.2, 4), OURO, [Math.cos(a) * 0.28, 0.25, Math.sin(a) * 0.28]));
        g.add(malha(new THREE.IcosahedronGeometry(0.045, 0), c, [Math.cos(a) * 0.3, 0.09, Math.sin(a) * 0.3]));
      }
      break;
    }
    default:
      return null;
  }
  return g;
}

/* ---------------- óculos ---------------- */

function lente(tipo: Roupa['oculos']): THREE.Object3D {
  if (tipo === 'redondo') {
    const g = new THREE.Group();
    g.add(malha(new THREE.TorusGeometry(0.19, 0.03, 4, 14), PRETO));
    const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.18, 14), new THREE.MeshBasicMaterial({ color: '#cfe8e3', transparent: true, opacity: 0.35 }));
    vidro.name = 'vidro';
    g.add(vidro);
    return g;
  }
  if (tipo === 'coracao') {
    const s = new THREE.Shape();
    s.moveTo(0, -0.12);
    s.bezierCurveTo(-0.02, -0.08, -0.17, -0.03, -0.15, 0.06);
    s.bezierCurveTo(-0.13, 0.14, -0.03, 0.14, 0, 0.06);
    s.bezierCurveTo(0.03, 0.14, 0.13, 0.14, 0.15, 0.06);
    s.bezierCurveTo(0.17, -0.03, 0.02, -0.08, 0, -0.12);
    return malha(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 4 }), '#e45a7a', undefined, undefined, [1.45, 1.45, 1]);
  }
  return malha(new THREE.BoxGeometry(0.4, 0.27, 0.035), PRETO);
}

function oculos(r: Roupa, m: Medidas): THREE.Object3D | null {
  if (r.oculos === 'nenhum') return null;
  const g = new THREE.Group();
  for (const lado of [1, -1]) {
    const l = lente(r.oculos);
    l.position.set(m.olhoX + 0.02, m.olhoY, (m.olhoZ + 0.05) * lado);
    if (lado < 0) l.rotation.y = Math.PI; // a lente olha para fora dos dois lados
    g.add(l);
    // haste até "a orelha"
    g.add(malha(new THREE.BoxGeometry(0.4, 0.03, 0.03), PRETO, [m.olhoX - 0.36, m.olhoY + 0.04, (m.olhoZ + 0.02) * lado]));
  }
  // ponte por cima do nariz
  g.add(malha(new THREE.BoxGeometry(0.035, 0.035, m.olhoZ * 2 + 0.1), PRETO, [m.olhoX + 0.12, m.olhoY + 0.08, 0]));
  return g;
}

/* ---------------- pescoço ---------------- */

function pescoco(r: Roupa, m: Medidas): THREE.Object3D | null {
  if (r.pescoco === 'nenhum') return null;
  const c = cor(r.corPescoco);
  const g = new THREE.Group();
  const meioY = (m.pescocoTopo + m.pescocoBase) / 2;
  const hy = (m.pescocoTopo - m.pescocoBase) / 2;

  const media = Math.max(0.3, (m.pescocoZ + hy) / 2);
  /** anel em volta do corpo (plano YZ); `tubo` é a espessura final, em unidades do mundo */
  const anel = (tubo: number, folga: number, corAnel: string) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1, tubo / media, 4, 16), mat(corAnel));
    t.rotation.y = Math.PI / 2;
    t.scale.set(m.pescocoZ + folga, hy + folga, media);
    t.position.set(m.pescocoX, meioY, 0);
    return t;
  };

  if (r.pescoco === 'cachecol') {
    g.add(anel(0.17, 0.05, c));
    g.add(malha(new THREE.BoxGeometry(0.16, 0.42, 0.06), c, [m.pescocoX + 0.08, m.pescocoBase - 0.05, m.pescocoZ * 0.6], [0, 0, 0.3]));
    g.add(malha(new THREE.BoxGeometry(0.17, 0.05, 0.065), cor('creme'), [m.pescocoX + 0.14, m.pescocoBase - 0.22, m.pescocoZ * 0.6], [0, 0, 0.3]));
  } else if (r.pescoco === 'gravata') {
    g.add(anel(0.05, 0.02, cor('creme')));
    const x = m.pescocoX + 0.12;
    const y = m.pescocoBase + 0.06;
    g.add(malha(new THREE.BoxGeometry(0.1, 0.1, 0.12), c, [x, y, 0]));
    g.add(malha(new THREE.ConeGeometry(0.1, 0.42, 4), c, [x + 0.02, y - 0.25, 0], [0, Math.PI / 4, 0.25]));
  } else {
    g.add(anel(0.025, 0.03, OURO));
    g.add(malha(new THREE.IcosahedronGeometry(0.08, 0), c, [m.pescocoX + 0.06, m.pescocoBase - 0.06, 0]));
  }
  return g;
}

/** Monta as peças da roupa num objeto só (1 draw call). Retorna null se o peixe está sem roupa. */
export function criarRoupa(roupa: Roupa | undefined, m: Medidas): THREE.Object3D | null {
  const r = roupa ?? ROUPA_PADRAO;
  const g = new THREE.Group();

  const ch = chapeu(r);
  if (ch) {
    ch.position.set(m.chapeuX, m.chapeuY - 0.06, 0);
    ch.rotation.z = -0.14; // levemente inclinado para trás, como nos modelos prontos
    g.add(ch);
  }
  const oc = oculos(r, m);
  if (oc) g.add(oc);
  const pe = pescoco(r, m);
  if (pe) g.add(pe);
  if (!g.children.length) return null;

  // o vidro transparente do óculos redondo fica de fora da fusão
  const vidros: THREE.Mesh[] = [];
  g.traverse((o) => o.name === 'vidro' && vidros.push(o as THREE.Mesh));
  g.updateMatrixWorld(true);
  const soltos = vidros.map((v) => {
    const copia = new THREE.Mesh(v.geometry.clone(), v.material);
    copia.applyMatrix4(v.matrixWorld);
    v.parent?.remove(v);
    return copia;
  });

  const unica = mesclarEmUmaMalha(g);
  if (!soltos.length) return unica;
  const final = new THREE.Group();
  final.add(unica, ...soltos);
  return final;
}

/** Libera geometrias (os materiais vêm do cache compartilhado), exceto os vidros que têm material próprio. */
export function descartarRoupa(o: THREE.Object3D | null) {
  o?.traverse((x) => {
    const mesh = x as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material instanceof THREE.MeshBasicMaterial) mesh.material.dispose();
  });
}
