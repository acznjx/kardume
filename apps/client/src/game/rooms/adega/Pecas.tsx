import { useMemo, type ComponentProps } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { Garrafa } from '../../props/props';
import { mat, PALETA } from '../../style/materials';

type G = ThreeElements['group'];
export function Madeira({ tamanho, cor = PALETA.madeira, ...props }: G & { tamanho: [number, number, number]; cor?: string }) {
  return <group {...props}><mesh material={mat(cor)} castShadow receiveShadow><boxGeometry args={tamanho} /></mesh></group>;
}
export function Cilindro({ raio, base = raio, altura, cor, ...props }: G & { raio: number; base?: number; altura: number; cor: string }) {
  return <group {...props}><mesh material={mat(cor)} castShadow receiveShadow><cylinderGeometry args={[raio, base, altura, 8]} /></mesh></group>;
}
/** Alça vertical e copo de oito faces; mantém a escala dos adereços compartilhados. */
export function CanecaTaverna(props: G) {
  return <group {...props}>
    <Cilindro position={[0, 0.2, 0]} raio={0.17} base={0.16} altura={0.4} cor={PALETA.caneca} />
    <mesh position={[0.21, 0.21, 0]} material={mat(PALETA.caneca)}><torusGeometry args={[0.115, 0.04, 4, 8]} /></mesh>
    <Cilindro position={[0, 0.41, 0]} raio={0.165} altura={0.03} cor='#f7f3ea' />
  </group>;
}
export function Bebidas(props: G) {
  return <group {...props}>
    <Garrafa scale={1.65} position={[-0.25, 0, -0.25]} />
    <CanecaTaverna scale={1.7} position={[-0.85, 0, 0.45]} rotation={[0, 2.2, 0]} />
    <CanecaTaverna scale={1.7} position={[0.8, 0, 0.28]} rotation={[0, 0.3, 0]} />
    <Vela position={[0.5, 0, -0.6]} />
    <Cilindro position={[-0.85, 0.012, 0.45]} raio={0.42} altura={0.024} cor={PALETA.madeiraEscura} />
    <Cilindro position={[0.8, 0.012, 0.28]} raio={0.42} altura={0.024} cor={PALETA.madeiraEscura} />
  </group>;
}
export function Vela(props: G) {
  return <group {...props}>
    <Cilindro position={[0, 0.05, 0]} raio={0.23} altura={0.1} cor={PALETA.latao} />
    <Cilindro position={[0, 0.26, 0]} raio={0.115} altura={0.36} cor={PALETA.caneca} />
    <mesh position={[0, 0.51, 0]} scale={[0.08, 0.16, 0.08]} material={mat('#ffe6a0', { emissivo: '#ffbf52', intensidade: 2.4 })}><icosahedronGeometry args={[1, 0]} /></mesh>
  </group>;
}
let materialSombra: THREE.MeshBasicMaterial | undefined;
let materialHalo: THREE.MeshBasicMaterial | undefined;
function halo() {
  if (!materialHalo) {
    const tela = document.createElement('canvas'); tela.width = tela.height = 128;
    const ctx = tela.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,183,76,0.3)'); g.addColorStop(0.35, 'rgba(255,172,65,0.16)'); g.addColorStop(1, 'rgba(255,162,56,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const mapa = new THREE.CanvasTexture(tela); mapa.colorSpace = THREE.SRGBColorSpace;
    materialHalo = new THREE.MeshBasicMaterial({ map: mapa, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  }
  return materialHalo;
}
/** Contato suave mesmo no modo leve, sem mapas de sombra. */
export function SombraContato({ x, z, raio = 1 }: { x: number; z: number; raio?: number }) {
  const material = useMemo(() => {
    if (!materialSombra) {
      const tela = document.createElement('canvas'); tela.width = tela.height = 64;
      const ctx = tela.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(28,19,12,0.36)'); g.addColorStop(0.45, 'rgba(28,19,12,0.18)'); g.addColorStop(1, 'rgba(28,19,12,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      materialSombra = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tela), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    }
    return materialSombra;
  }, []);
  return <mesh position={[x, 0.075, z]} rotation={[-Math.PI / 2, 0, 0]} material={material}><planeGeometry args={[raio * 2, raio * 2]} /></mesh>;
}
/** Halos sem luzes adicionais: a mesma textura/material é mesclada em toda a sala. */
export function PocoLuz({ x, z, y = 0.035, raio = 4 }: { x: number; z: number; y?: number; raio?: number }) {
  const material = useMemo(halo, []);
  return <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} material={material}><planeGeometry args={[raio * 2, raio * 2]} /></mesh>;
}
export function Pendente({ x, z, y = 5.1, mesa = true }: { x: number; z: number; y?: number; mesa?: boolean }) {
  return <group>
    <Cilindro position={[x, (7.6 + y) / 2, z]} raio={0.045} altura={7.6 - y} cor='#34342c' />
    <group position={[x, y, z]}>
      <Cilindro raio={0.28} base={0.98} altura={0.65} cor={PALETA.latao} />
      <Cilindro position={[0, -0.32, 0]} raio={1.02} altura={0.08} cor={PALETA.madeiraEscura} />
      <mesh position={[0, -0.4, 0]} material={mat('#ffdfb0', { emissivo: '#ffb56b', intensidade: 1.5 })}><icosahedronGeometry args={[0.34, 0]} /></mesh>
    </group>
    <PocoLuz x={x} z={z} raio={4.6} />
    {mesa && <PocoLuz x={x} z={z} y={1.795} raio={1.65} />}
  </group>;
}
export function Tapete({ x, z, largura = 7, profundidade = 7, cor = '#8d3839' }: { x: number; z: number; largura?: number; profundidade?: number; cor?: string }) {
  return <group position={[x, 0.018, z]}>
    <Madeira tamanho={[largura, 0.025, profundidade]} cor={PALETA.madeiraEscura} />
    <Madeira position={[0, 0.017, 0]} tamanho={[largura - 0.18, 0.012, profundidade - 0.18]} cor={cor} />
    {[-1, 1].map((s) => <group key={s}>
      <Madeira position={[s * (largura / 2 - 0.4), 0.028, 0]} tamanho={[0.12, 0.012, profundidade - 0.55]} cor='#d2a65a' />
      <Madeira position={[0, 0.028, s * (profundidade / 2 - 0.4)]} tamanho={[largura - 0.7, 0.012, 0.12]} cor='#d2a65a' />
      {Array.from({ length: Math.floor(largura / 0.35) }, (_, i) => <Madeira key={i} position={[-largura / 2 + 0.2 + i * 0.35, 0, s * (profundidade / 2 + 0.12)]} tamanho={[0.08, 0.02, 0.25]} cor='#c4a574' />)}
    </group>)}
    {[-1, 0, 1].map((i) => <group key={i} position={[0, 0.03, i * profundidade * 0.2]} rotation={[0, Math.PI / 4, 0]}><Madeira tamanho={[0.6, 0.012, 0.6]} cor='#d2a65a' /><Madeira position={[0, 0.01, 0]} tamanho={[0.35, 0.012, 0.35]} cor={cor} /></group>)}
  </group>;
}
export function Corda({ de, para, raio = 0.055, cor = '#c3a470' }: { de: THREE.Vector3Tuple; para: THREE.Vector3Tuple; raio?: number; cor?: string }) {
  const meio = new THREE.Vector3(...de).add(new THREE.Vector3(...para)).multiplyScalar(0.5);
  const direcao = new THREE.Vector3(...para).sub(new THREE.Vector3(...de));
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direcao.clone().normalize());
  return <mesh position={meio} quaternion={quat} material={mat(cor)}><cylinderGeometry args={[raio, raio, direcao.length(), 5]} /></mesh>;
}
export function Varal({ de, para, quantidade = 14 }: { de: THREE.Vector3Tuple; para: THREE.Vector3Tuple; quantidade?: number }) {
  const pontos = Array.from({ length: quantidade + 1 }, (_, i) => {
    const t = i / quantidade;
    return [THREE.MathUtils.lerp(de[0], para[0], t), THREE.MathUtils.lerp(de[1], para[1], t) - Math.sin(t * Math.PI) * 0.65, THREE.MathUtils.lerp(de[2], para[2], t)] as THREE.Vector3Tuple;
  });
  return <group>{pontos.map((p, i) => <group key={i}>
    {i > 0 && <Corda de={pontos[i - 1]} para={p} raio={0.025} cor='#34342c' />}
    <mesh position={[p[0], p[1] - 0.12, p[2]]} material={mat(i % 3 === 0 ? '#ffb55d' : '#ffdfb0', { emissivo: '#ffb56b', intensidade: 1.1 })}><icosahedronGeometry args={[0.13, 0]} /></mesh>
  </group>)}</group>;
}
export type Grupo = ComponentProps<'group'>;
