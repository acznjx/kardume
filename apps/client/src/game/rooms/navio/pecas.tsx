import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { mat } from '../../style/materials';
export type G = ThreeElements['group'];
export const CORES = { madeira: '#724327', clara: '#a96a37', escura: '#422e26', teal: '#245e59', pedra: '#496f70', pedraClara: '#71918a', areia: '#bc9b68', creme: '#ead4a0', coral: '#e46d52', rosa: '#ce6288', ouro: '#d9a542', alga: '#35754c', ferro: '#354a4c' };
export function Caixa({ pos, tam, cor = CORES.madeira, rot = [0, 0, 0] }: { pos: [number, number, number]; tam: [number, number, number]; cor?: string; rot?: [number, number, number] }) {
  return <mesh position={pos} rotation={rot} material={mat(cor)}><boxGeometry args={tam} /></mesh>;
}
export function Haste({ a, b, r = 0.09, cor = CORES.escura }: { a: [number, number, number]; b: [number, number, number]; r?: number; cor?: string }) {
  const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  return <mesh position={new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(0.5)} quaternion={q} material={mat(cor)}><cylinderGeometry args={[r, r, v.length(), 6]} /></mesh>;
}
export function Rocha({ cor = CORES.pedra, ...props }: G & { cor?: string }) {
  return <group {...props}><mesh material={mat(cor)}><dodecahedronGeometry args={[1, 0]} /></mesh></group>;
}
export function Lanterna({ poste = false, ...props }: G & { poste?: boolean }) {
  return <group {...props}>
    {poste && <><Haste a={[0, 0, 0]} b={[0, 3.6, 0]} r={0.14} /><Haste a={[0, 3.6, 0]} b={[0.65, 3.6, 0]} r={0.12} /></>}
    <group position={poste ? [0.65, 2.9, 0] : [0, 0, 0]}>
      <mesh material={mat(CORES.escura)} position={[0, 0.65, 0]}><torusGeometry args={[0.18, 0.05, 4, 8]} /></mesh>
      <mesh material={mat(CORES.ouro)} position={[0, 0.4, 0]}><coneGeometry args={[0.48, 0.32, 6]} /></mesh>
      <mesh material={mat('#ffd27a', { emissivo: '#ffb842', intensidade: 1.3 })}><cylinderGeometry args={[0.25, 0.3, 0.62, 6]} /></mesh>
      <mesh material={mat(CORES.escura)} position={[0, -0.35, 0]}><cylinderGeometry args={[0.38, 0.38, 0.14, 6]} /></mesh>
      {[-1, 1].map(i => <Caixa key={i} pos={[i * 0.27, 0, 0.1]} tam={[0.06, 0.7, 0.08]} cor={CORES.escura} />)}
    </group>
  </group>;
}
/** O topo coincide com o contrato de assentos; +Z é a frente do banco. */
export function BancoNavio({ ...props }: G) {
  return <group {...props}>
    <Caixa pos={[0, -0.09, 0]} tam={[2.6, 0.18, 0.95]} cor={CORES.clara} />
    <Caixa pos={[0, 0.57, -0.5]} tam={[2.7, 0.55, 0.16]} cor={CORES.teal} />
    {[-1, 1].map(i => <group key={i}><Caixa pos={[i, -0.38, 0]} tam={[0.22, 0.6, 0.8]} cor={CORES.escura} /><Caixa pos={[i, 0.24, -0.5]} tam={[0.16, 0.9, 0.16]} /></group>)}
  </group>;
}
export function Caixote(props: G) {
  return <group {...props}><Caixa pos={[0, 0.8, 0]} tam={[1.8, 1.6, 1.8]} cor={CORES.clara} />
    {[-1, 1].map(i => <Caixa key={i} pos={[0, 0.8, i * 0.92]} tam={[2, 0.18, 0.13]} cor={CORES.escura} rot={[0, 0, i * 0.68]} />)}
    {[-0.65, 0.65].map(x => <Caixa key={x} pos={[x, 0.8, 0.94]} tam={[0.15, 1.7, 0.12]} cor={CORES.escura} />)}
  </group>;
}
export function CoralMesa({ cor = CORES.coral, ...props }: G & { cor?: string }) {
  return <group {...props}>{[0, 1, 2].map(i => <group key={i} position={[Math.sin(i * 3) * 0.8, i * 0.65 + 0.3, Math.cos(i * 3) * 0.6]}>
    <mesh material={mat(cor)}><cylinderGeometry args={[1.2 - i * 0.15, 0.3, 0.25, 7]} /></mesh>
    <Haste a={[0, -0.8, 0]} b={[0, 0, 0]} r={0.12} cor={cor} />
  </group>)}</group>;
}
export function Concha(props: G) {
  return <group {...props}><mesh material={mat(CORES.creme)} rotation={[-Math.PI / 2, 0, 0]}><sphereGeometry args={[0.55, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
    {[-0.3, 0, 0.3].map(x => <Haste key={x} a={[0, 0.04, 0.38]} b={[x, 0.18, -0.35]} r={0.025} cor={CORES.clara} />)}</group>;
}
