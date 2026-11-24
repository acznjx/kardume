import { useMemo } from 'react';
import * as THREE from 'three';
import { NAVIO, SALA_NAVIO } from '@cardume/shared';
import { mat, pintarFaces } from '../../style/materials';
import { Coral, Estrela } from '../../props/props';
import { AlgasInstanciadas } from './algas';
import { DESTROCOS } from './exteriores';
import { CORES, Concha, CoralMesa, Lanterna, Rocha } from './pecas';
export const acaso = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/** Caminhos com quatro unidades livres; plantas e rochedos ficam nas margens. */
export const ROTAS: [number, number, number, number][] = [
  [0, 53, 9, 17], [-13, 66, -59, 58], [13, 66, 68, 53],
  [-62, 40, -62, -25], [68, 34, 75, 18], [75, 18, 75, -20], [75, -20, 64, -35], [-51, -34, -14, -19],
  [25, -20, 64, -39], [-62, -52, -30, -68], [68, 57, 57, 77],
  [8, -21, -24, -69], [59, -9, 64, -35],
];
const distanciaSegmento = (x: number, z: number, a: number, b: number, c: number, d: number) => {
  const dx = c - a, dz = d - b;
  const t = THREE.MathUtils.clamp(((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - a - dx * t, z - b - dz * t);
};
export function livreParaRecife(x: number, z: number, margem = 0) {
  if (DESTROCOS.some(d => Math.hypot(x - d.x, z - d.z) < d.r + 3 + margem)) return false;
  if (Math.abs(x) < 47 + margem && Math.abs(z) < 19 + margem) return false;
  const clareiras = [
    [...NAVIO.praca.centro, 19], [...NAVIO.anfiteatro.centro, 21],
    [...NAVIO.jardim.centro, 19], [68, 48, 16], [59, 0, 12],
    [...NAVIO.perola.centro, 12], [...NAVIO.peixaria.centro, 12],
    ...NAVIO.arcos.map(([a, b]) => [a, b, 12]),
  ];
  if (clareiras.some(([a, b, r]) => Math.hypot(x - a, z - b) < r + margem)) return false;
  if (ROTAS.some(([a, b, c, d]) => distanciaSegmento(x, z, a, b, c, d) < 5 + margem)) return false;
  return !SALA_NAVIO.correntes!.some(c => c.pontos.slice(1).some((p, i) => distanciaSegmento(x, z, c.pontos[i][0], c.pontos[i][2], p[0], p[2]) < 5 + margem));
}
/** Escarpas fora da área jogável, em todo o contorno retangular. */
export const RECIFES = Array.from({ length: 66 }, (_, i) => {
  // Espaçamento uniforme também no meio das bordas: sem frestas no horizonte.
  const x = i < 36 ? -136 + (i % 18) * 16 : i < 51 ? -140 : 140;
  const z = i < 18 ? -121 : i < 36 ? 121 : -112 + ((i - 36) % 15) * 16;
  return { x, z, h: 21 + acaso(i + 90) * 25, r: 9 + acaso(i + 13) * 5 };
});
export const DUNAS = [[-29, 12.4, 6.5], [-23, 12.4, 4], [21, 12.5, 4], [30, 12, 6], [-17, -12, 5], [8, -12, 6]];
export const ILHAS = Array.from({ length: 130 }, (_, i) => {
  const x = (acaso(i + 1200) - 0.5) * 248, z = (acaso(i + 1400) - 0.5) * 208;
  return [x, z] as const;
}).filter(([x, z]) => livreParaRecife(x, z, 5)).slice(0, 42);
/** Colisão e desenho usam os mesmos volumes das ilhas rochosas. */
export const ROCHEDOS = ILHAS.flatMap(([x, z], b) => [0, 1, 2].map(i => ({
  x: x + i * 2 - 2, z: z + Math.sin(i * 4) * 2, r: 2 + i * 0.4,
  h: 1.1 + i * 0.7 + (b % 5 === 0 ? 3 : 0),
})));
export function FundoMarinho() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(330, 290, 165, 145); g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const borda = Math.max(0, Math.abs(x) - 130, Math.abs(z) - 110);
      // Só a borda sobe; o chão jogável coincide com o plano da colisão.
      p.setY(i, -0.24 + Math.sin(z * 1.8 + Math.sin(x * 0.13)) * 0.08 + borda * 0.23);
    }
    return pintarFaces(g, c => {
      const v = Math.sin(c.x * 0.095 + Math.sin(c.z * 0.08)) + Math.cos(c.z * 0.13 - c.x * 0.03);
      return v > 1 ? '#c4a575' : v > 0 ? '#b99c6e' : v > -1 ? '#af9164' : '#9e8b65';
    });
  }, []);
  return <group>
    <mesh geometry={geo} material={mat('#ffffff', { vertexColors: true })} />
    {DUNAS.map(([x, z, r], i) => <Rocha key={`duna-${i}`} position={[x, 0.5, z]} scale={[r, 1.9, 3.7]} cor={i % 2 ? '#b99c6e' : '#af9164'} />)}
    {RECIFES.map((r, i) => <group key={i} position={[r.x, 0, r.z]} rotation={[0, i * 1.8, 0]}>
      <Rocha position={[0, r.h * 0.32, 0]} scale={[r.r, r.h * 0.65, r.r * 0.8]} cor={i % 3 ? CORES.pedra : CORES.teal} />
      <Rocha position={[r.r * 0.7, 2, 1]} scale={[r.r * 0.8, 5, r.r]} cor={CORES.pedraClara} />
      <CoralMesa position={[0, 3, r.r * 0.6]} scale={1.5} cor={i % 2 ? CORES.coral : CORES.rosa} />
    </group>)}
    {ROCHEDOS.map((r, i) => <Rocha key={`rochedo-${i}`} position={[r.x, r.h * 0.4, r.z]} scale={[r.r, r.h, r.r * 0.8]} cor={i % 3 ? CORES.pedra : CORES.pedraClara} />)}
    {ILHAS.map(([x, z], b) => <group key={b} position={[x, 0, z]}>
      <ManchaDePradaria fase={b} />
      {Array.from({ length: 7 }, (_, i) => <group key={i} position={[Math.sin(i * 2.4) * (3 + i * 0.5), 0, Math.cos(i * 2.4) * (3 + i * 0.5)]}>
        {i % 2 ? <Coral cor={b % 3 ? CORES.coral : CORES.ouro} scale={1.3 + i * 0.15} /> : <CoralMesa cor={b % 3 ? CORES.rosa : CORES.coral} scale={0.6 + i * 0.12} />}
      </group>)}
    </group>)}
    {Array.from({ length: 330 }, (_, i) => {
      const x = (acaso(i + 200) - 0.5) * 254, z = (acaso(i + 600) - 0.5) * 214;
      if (Math.abs(x) < 43 && Math.abs(z) < 16) return null;
      return i % 3 ? <Concha key={i} position={[x, 0, z]} rotation={[0, i, 0]} scale={0.5 + acaso(i) * 0.9} /> : <Estrela key={i} position={[x, 0, z]} cor={i % 2 ? CORES.ouro : CORES.coral} scale={1.5} rotation={[0, i, 0]} />;
    })}
    {/* Ondulações baixas, agrupadas em bancos de areia orgânicos. */}
    {Array.from({ length: 80 }, (_, b) => {
      const x = (acaso(b + 1650) - 0.5) * 250, z = (acaso(b + 1700) - 0.5) * 210;
      if (Math.abs(x) < 43 && Math.abs(z) < 17) return null;
      return <group key={b} position={[x, -0.09, z]} rotation={[0, 0.35 + Math.sin(b) * 0.4, 0]}><Ondulacoes fase={b} /></group>;
    })}
  </group>;
}
const PRADARIAS: [number, number, number][] = Array.from({ length: 42 }, (_, b) => {
  const x = (acaso(b + 2200) - 0.5) * 244, z = (acaso(b + 2400) - 0.5) * 204;
  return Array.from({ length: 65 }, (_, i): [number, number, number] => [x + Math.cos(i * 2.4) * Math.sqrt(i) * 1.1, z + Math.sin(i * 2.4) * Math.sqrt(i) * 1.1, 0.6 + acaso(i + b * 80) * 1.4]);
}).flat().filter(([x, z]) => livreParaRecife(x, z));
const ALGAS: [number, number, number][] = [
  ...PRADARIAS,
  ...ILHAS.flatMap(([x, z], b) => Array.from({ length: 40 }, (_, i): [number, number, number] => [x + Math.cos(i * 2.4) * (3 + Math.sqrt(i)), z + Math.sin(i * 2.4) * (3 + Math.sqrt(i)), (b % 3 === 0 ? 6 : 1) + acaso(i + b) * (b % 3 === 0 ? 9 : 2)]).filter(([a, b]) => livreParaRecife(a, b))),
  ...RECIFES.flatMap((r, b) => Array.from({ length: 12 }, (_, i): [number, number, number] => [r.x + Math.sin(i * 2.4) * 7, r.z + Math.cos(i * 2.4) * 7, 9 + acaso(b * 12 + i) * 20])),
];
export function Vegetacao() { return <AlgasInstanciadas posicoes={ALGAS} />; }
export function Caminhos() {
  return <group>{ROTAS.map(([x, z, xx, zz], k) => {
    const comprimento = Math.hypot(xx - x, zz - z), n = Math.ceil(comprimento / 1.3);
    const nx = -(zz - z) / comprimento, nz = (xx - x) / comprimento;
    return <group key={k}>{Array.from({ length: n }, (_, i) => {
      const t = i / n;
      return <group key={i} position={[x + (xx - x) * t, 0, z + (zz - z) * t]}>
        {[-1, 0, 1].map(j => <Rocha key={j} position={[nx * j * 1.25, -0.04, nz * j * 1.25]} scale={[0.55, 0.14, 0.45]} cor={i % 4 ? '#a28e72' : '#c4a575'} />)}
        {i % 14 === 5 && <Lanterna poste position={[nx * 3.5 * (i % 2 ? 1 : -1), 0, nz * 3.5 * (i % 2 ? 1 : -1)]} scale={0.8} />}
      </group>;
    })}</group>;
  })}</group>;
}function ManchaDePradaria({ fase }: { fase: number }) {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(8, 15); g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 1; i < p.count; i++) {
      const f = 0.8 + Math.sin(i * 3.2 + fase) * 0.15;
      p.setXYZ(i, p.getX(i) * f, -0.1, p.getZ(i) * f);
    }
    return g;
  }, [fase]);
  return <mesh geometry={geo} material={mat('#939472')} />;
}
function Ondulacoes({ fase }: { fase: number }) {
  const geo = useMemo(() => {
    const v: number[] = [];
    for (let linha = 0; linha < 9; linha++) {
      const largura = 2 + Math.sin(linha / 8 * Math.PI) * 2;
      for (let j = 0; j < 12; j++) {
        const ponto = (k: number, lado: number) => {
          const u = k / 12, x = (u - 0.5) * largura * 2;
          return [x, 0.02 + Math.sin(u * Math.PI) * (lado === 0 ? 0.11 : 0), linha * 0.65 + Math.sin(u * 3.5 + fase * 0.4) * 0.6 + lado * 0.10];
        };
        const a = ponto(j, -1), b = ponto(j, 0), c = ponto(j + 1, 0), d = ponto(j + 1, -1);
        const e = ponto(j, 1), f = ponto(j + 1, 1);
        v.push(...a, ...b, ...c, ...a, ...c, ...d, ...b, ...e, ...f, ...b, ...f, ...c);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  }, [fase]);
  return <mesh geometry={geo} material={mat('#c1a775')} />;
}

