import * as THREE from 'three';
import type { ModeloPeixe } from '@cardume/shared';
import { PALETA, mat, pintarFaces } from '../style/materials';

/**
 * Peixes prontos, no estilo da imagem de referência (Bar do Cardume).
 * Sistema local: frente = +X, cima = +Y, lados = ±Z. Base do corpo em y = -BASE_MODELO.
 */
export const BASE_MODELO = 0.68;

type Padrao = (c: THREE.Vector3) => string;

interface Receita {
  corpo: string;
  barbatana: string;
  padrao?: (base: string) => Padrao;
  acessorio?: (g: THREE.Group) => void;
}

const listras =
  (cor: string, faixas: [number, number][]) =>
  (base: string): Padrao =>
  (c) =>
    faixas.some(([a, b]) => c.x >= a && c.x <= b) ? cor : base;

const manchas =
  (cor: string, chance: number, semente: number) =>
  (base: string): Padrao =>
  (c) => {
    const h = Math.sin(c.x * 91.7 + c.y * 37.3 + c.z * 13.1 + semente) * 43758.5453;
    return h - Math.floor(h) < chance ? cor : base;
  };

const barriga =
  (cor: string, padraoBase?: (b: string) => Padrao) =>
  (base: string): Padrao => {
    const p = padraoBase?.(base);
    return (c) => (c.y < -0.38 ? cor : p ? p(c) : base);
  };

// ---------- acessórios ----------
function oculos(g: THREE.Group, cor: string = PALETA.preto) {
  const m = mat(cor);
  for (const lado of [1, -1]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 4, 10), m);
    aro.position.set(0.5, 0.17, 0.4 * lado);
    g.add(aro);
  }
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.62), m);
  ponte.position.set(0.68, 0.2, 0);
  g.add(ponte);
}

function flor(g: THREE.Group) {
  const petala = mat('#f7b6c2');
  const miolo = mat(PALETA.amarelo);
  const base = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), petala);
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
    p.scale.set(1, 1, 0.45);
    base.add(p);
  }
  base.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), miolo));
  base.position.set(0.15, 0.7, 0.12);
  base.rotation.set(-0.5, 0, 0.2);
  g.add(base);
}

function bone(g: THREE.Group, cor: string) {
  const m = mat(cor);
  const copa = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), m);
  copa.scale.set(1, 0.7, 0.95);
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 7, 1, false, 0, Math.PI), m);
  aba.position.set(-0.32, 0.02, 0);
  aba.rotation.y = Math.PI / 2;
  aba.scale.set(1, 1, 1.4);
  const chapeu = new THREE.Group();
  chapeu.add(copa, aba);
  chapeu.position.set(0.2, 0.5, 0);
  chapeu.rotation.z = 0.25;
  g.add(chapeu);
}

function chapeuPalha(g: THREE.Group) {
  const palha = mat('#e2c27a');
  const fita = mat('#2a2a2a');
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 9), palha);
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.3, 8), palha);
  copa.position.y = 0.17;
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.08, 8), fita);
  faixa.position.y = 0.06;
  const chapeu = new THREE.Group();
  chapeu.add(aba, copa, faixa);
  chapeu.position.set(0.15, 0.62, 0);
  chapeu.rotation.z = -0.18;
  g.add(chapeu);
}

function boina(g: THREE.Group, cor: string) {
  const m = mat(cor);
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.16, 8), m);
  const aba = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.5), m);
  aba.position.set(0.38, -0.05, 0);
  const chapeu = new THREE.Group();
  chapeu.add(copa, aba);
  chapeu.position.set(0.15, 0.62, 0);
  chapeu.rotation.z = -0.15;
  g.add(chapeu);
}

export function chapeuCozinheiro(g: THREE.Group) {
  const branco = mat(PALETA.branco);
  const faixa = mat('#d9473b');
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 8), branco);
  const topo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), branco);
  topo.position.y = 0.32;
  topo.scale.set(1, 0.7, 1);
  const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.06, 8), faixa);
  const chapeu = new THREE.Group();
  chapeu.add(base, topo, fita);
  chapeu.position.set(0.15, 0.68, 0);
  chapeu.rotation.z = -0.12;
  g.add(chapeu);
}

const RECEITAS: Record<ModeloPeixe | 'barman', Receita> = {
  palhaco: {
    corpo: PALETA.laranja,
    barbatana: PALETA.laranja,
    padrao: listras(PALETA.branco, [[0.28, 0.46], [-0.32, -0.14]]),
  },
  tito: {
    corpo: PALETA.amarelo,
    barbatana: '#e6b52e',
    padrao: listras('#c9a12a', [[0.05, 0.16], [-0.32, -0.2]]),
    acessorio: (g) => oculos(g),
  },
  luna: {
    corpo: PALETA.rosa,
    barbatana: '#e07a7a',
    padrao: barriga('#f2b0a8'),
    acessorio: flor,
  },
  bia: {
    corpo: PALETA.azulPeixe,
    barbatana: '#58789f',
    padrao: barriga('#a9bfd8', listras('#4f6a91', [[-0.05, 0.05], [-0.36, -0.26]])),
    acessorio: (g) => bone(g, '#d8443a'),
  },
  nico: {
    corpo: PALETA.marromPeixe,
    barbatana: '#b5552f',
    padrao: manchas('#e3a276', 0.22, 3),
    acessorio: chapeuPalha,
  },
  roxo: {
    corpo: PALETA.roxo,
    barbatana: '#7458ad',
    padrao: barriga('#b9a2e2'),
    acessorio: (g) => boina(g, '#7a5a3a'),
  },
  oculos: {
    corpo: PALETA.verde,
    barbatana: '#869f3b',
    padrao: manchas('#7f9a35', 0.25, 9),
    acessorio: (g) => oculos(g, '#3a2a1a'),
  },
  barman: {
    corpo: PALETA.azulBarman,
    barbatana: '#4c5aa8',
    padrao: barriga('#aab4e8'),
    acessorio: chapeuCozinheiro,
  },
};

function barbatana(cor: string, raio: number, altura: number, achatar = 0.22) {
  const geo = new THREE.ConeGeometry(raio, altura, 5, 1);
  const m = new THREE.Mesh(geo, mat(cor));
  m.scale.z = achatar;
  return m;
}

export interface PartesPeixe {
  grupo: THREE.Group;
  cauda: THREE.Object3D;
  base: number;
  altura: number;
}

/** Monta um peixe pronto. A cauda fica num pivô separado para abanar. */
export function criarModelo(modelo: ModeloPeixe | 'barman'): PartesPeixe {
  const r = RECEITAS[modelo] ?? RECEITAS.palhaco;
  const g = new THREE.Group();

  // corpo facetado
  let corpoGeo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 1);
  corpoGeo.scale(0.82, BASE_MODELO, 0.5);
  if (r.padrao) {
    corpoGeo = pintarFaces(corpoGeo, r.padrao(r.corpo));
    g.add(new THREE.Mesh(corpoGeo, mat('#ffffff', { vertexColors: true })));
  } else {
    g.add(new THREE.Mesh(corpoGeo, mat(r.corpo)));
  }

  // cauda
  const pivo = new THREE.Group();
  pivo.position.set(-0.7, 0, 0);
  const cauda = barbatana(r.barbatana, 0.5, 0.62);
  cauda.rotation.z = -Math.PI / 2;
  cauda.position.x = -0.3;
  pivo.add(cauda);
  g.add(pivo);

  // dorsal
  const dorsal = barbatana(r.barbatana, 0.32, 0.42);
  dorsal.position.set(-0.05, 0.66, 0);
  dorsal.rotation.z = 0.5;
  g.add(dorsal);

  // laterais
  for (const lado of [1, -1]) {
    const lat = barbatana(r.barbatana, 0.18, 0.36, 0.3);
    lat.position.set(0.0, -0.22, 0.46 * lado);
    lat.rotation.set(0.6 * lado, 0, 1.9);
    g.add(lat);
  }

  // olhos e boca
  const branco = mat('#fbfaf5');
  const preto = mat(PALETA.preto);
  for (const lado of [1, -1]) {
    const olho = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), branco);
    olho.position.set(0.5, 0.17, 0.33 * lado);
    olho.scale.set(1, 1.1, 0.6);
    const pupila = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 0), preto);
    pupila.position.set(0.56, 0.17, 0.41 * lado);
    const brilho = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), branco);
    brilho.position.set(0.6, 0.21, 0.46 * lado);
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 3, 6, Math.PI), preto);
    boca.position.set(0.7, -0.12, 0.24 * lado);
    boca.rotation.set(0, lado > 0 ? -0.6 : Math.PI + 0.6, Math.PI);
    g.add(olho, pupila, brilho, boca);
  }

  r.acessorio?.(g);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  return { grupo: g, cauda: pivo, base: BASE_MODELO, altura: 1.4 };
}
