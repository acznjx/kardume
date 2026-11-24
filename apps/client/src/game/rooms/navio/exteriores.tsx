import { NAVIO } from '@cardume/shared';
import { Ancora, Barril, Coral, Placa } from '../../props/props';
import { mat } from '../../style/materials';
import { BancoNavio, Caixa, Caixote, CORES, Concha, CoralMesa, Haste, Lanterna, Rocha } from './pecas';
/** Pequenas histórias nas margens das rotas; os volumes também alimentam a colisão. */
export const DESTROCOS = [
  { x: -28, z: 34, r: 5.8, h: 2.8 }, { x: 36, z: 27, r: 4.5, h: 2.8 },
  { x: -94, z: 5, r: 5, h: 4 }, { x: 29, z: -65, r: 5, h: 3.6 },
  { x: 103, z: 31, r: 5, h: 3 }, { x: 16, z: 96, r: 4, h: 2 },
  { x: -96, z: -73, r: 5, h: 3 },
];
function Bote() {
  return <group rotation={[0.08, 0.4, -0.12]}>
    {[-1, 1].map(l => <group key={l}>
      {[0, 1, 2].map(i => <group key={i}>
        <Caixa pos={[0, 0.5 + i * 0.5, l * (1.5 + i * 0.2)]} tam={[7.5 - i * 0.3, 0.43, 0.2]} cor={i % 2 ? CORES.teal : CORES.madeira} />
        <Haste a={[-3.8, 0.5 + i * 0.5, l * 1.5]} b={[-5, 0.8 + i * 0.5, 0]} r={0.2} cor={CORES.clara} />
        <Haste a={[3.8, 0.5 + i * 0.5, l * 1.5]} b={[4.8, 0.8 + i * 0.5, 0]} r={0.2} cor={CORES.madeira} />
      </group>)}
    </group>)}
    {[-2.5, 1.8].map(x => <Caixa key={x} pos={[x, 1.35, 0]} tam={[0.8, 0.16, 3.7]} cor={CORES.clara} />)}
    <Caixa pos={[0, 0.2, 0]} tam={[7.8, 0.18, 2.7]} cor={CORES.escura} />
    <Haste a={[-3, 1, -2]} b={[2.5, 1.6, 2.8]} r={0.09} cor={CORES.creme} />
    <Caixa pos={[2.6, 1.6, 2.9]} tam={[1.7, 0.15, 0.5]} rot={[0, -0.65, 0]} cor={CORES.clara} />
    <CoralMesa position={[3, 0.6, 0]} scale={0.7} cor={CORES.rosa} />
    <Placa texto="BOTE SEM PRESSA" largura={3.8} altura={0.55} position={[0, 1.2, 2.05]} />
  </group>;
}
function Canhao() {
  return <group rotation={[0, -0.4, 0.12]}>
    <Caixa pos={[0, 0.7, 0]} tam={[2.4, 0.5, 3.3]} cor={CORES.escura} />
    <mesh position={[0, 1.5, 0.5]} rotation={[1.36, 0, 0]} material={mat(CORES.ferro)}><cylinderGeometry args={[0.5, 0.8, 4, 8]} /></mesh>
    <mesh position={[0, 1.92, 2.48]} rotation={[1.36, 0, 0]} material={mat('#162f32')}><circleGeometry args={[0.35, 8]} /></mesh>
    {[-1.2, 1.2].map(x => <mesh key={x} position={[x, 0.6, -0.6]} rotation={[0, 0, Math.PI / 2]} material={mat(CORES.madeira)}><cylinderGeometry args={[0.65, 0.65, 0.25, 8]} /></mesh>)}
    <Coral position={[1, 0, 0]} cor={CORES.coral} scale={1.3} />
  </group>;
}
function PerolaGigante() {
  const [x, z] = NAVIO.perola.centro;
  return <group position={[x, 0, z]}>
    <Rocha position={[0, 0.5, 0]} scale={[7, 1.3, 6]} cor={CORES.teal} />
    <group position={[0, 1.2, 0]}>
      <mesh scale={[5, 0.65, 4]} material={mat('#c98691')}><sphereGeometry args={[1, 12, 5]} /></mesh>
      <group position={[0, 0.4, -2.6]} rotation={[-0.65, 0, 0]}>
        <mesh position={[0, 1.5, 0]} scale={[5, 3.6, 0.6]} material={mat('#e7b8a5')}><sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {Array.from({ length: 11 }, (_, i) => {
          const a = -1.35 + i * 0.27;
          return <Haste key={i} a={[0, 0, 0.1]} b={[Math.sin(a) * 4.6, 1.7 + Math.cos(a) * 3.2, 0.5]} r={0.11} cor={i % 2 ? CORES.creme : '#d18e8d'} />;
        })}
      </group>
      <mesh position={[0, 1.1, 0.2]} material={mat('#e4eddf', { emissivo: '#b8e8d5', intensidade: 0.65 })}><icosahedronGeometry args={[1.35, 2]} /></mesh>
    </group>
    {[-7, 7].map(a => <group key={a}><CoralMesa position={[a, 0, -2]} scale={1.7} cor={CORES.rosa} /><Lanterna poste position={[a, 0, 4]} /></group>)}
    <Placa texto="PÉROLA DA MARÉ" largura={5.4} altura={0.8} position={[0, 2.1, 6]} />
    <BancoNavio position={[-4, 0.7, 8]} rotation={[0, Math.PI, 0]} />
  </group>;
}
function Peixaria() {
  const [x, z] = NAVIO.peixaria.centro;
  return <group position={[x, 0, z]} rotation={[0, -0.4, 0]}>
    <mesh position={[0, 0.06, 0]} material={mat(CORES.pedraClara)}><cylinderGeometry args={[9, 9.5, 0.2, 10]} /></mesh>
    <Caixa pos={[0, 0.8, 0]} tam={[8, 1.6, 3]} cor={CORES.teal} />
    <Caixa pos={[0, 1.7, 0]} tam={[8.5, 0.2, 3.5]} cor={CORES.clara} />
    {[-3.8, 3.8].map(a => <Haste key={a} a={[a, 0, -1.1]} b={[a, 6.5, -1.1]} r={0.22} />)}
    {Array.from({ length: 8 }, (_, i) => i !== 5 && <Caixa key={i} pos={[-4.2 + i * 1.2, 6 + Math.sin(i) * 0.2, 0]} tam={[1.1, 0.2, i === 4 ? 2.2 : 5]} rot={[0.08, 0, i === 4 ? 0.3 : 0]} cor={i % 2 ? CORES.coral : CORES.creme} />)}
    <Placa texto="PEIXARIA DO SEU SIRI" largura={7.5} altura={0.9} position={[0, 4.8, 1.6]} rotation={[0, 0, -0.06]} />
    <Placa texto="fechada por excesso de água" largura={5.4} altura={0.65} position={[0, 2.9, 1.8]} rotation={[0, 0, 0.08]} />
    {[-2.5, 0, 2.5].map(a => <Concha key={a} position={[a, 1.9, 0]} scale={1.7} />)}
    <Caixote position={[-5.8, 0, 0]} /><Barril position={[5.6, 0, 1]} scale={1.5} />
    <CoralMesa position={[4, 5.6, -0.7]} scale={1.3} cor={CORES.rosa} />
    <Lanterna poste position={[6.5, 0, 5]} /><Lanterna poste position={[-6.5, 0, 5]} />
  </group>;
}
export function Descobertas() {
  return <group>
    <PerolaGigante /><Peixaria />
    {DESTROCOS.map((d, i) => <group key={i} position={[d.x, 0, d.z]} rotation={[0, i * 1.7, 0]}>
      {i === 0 ? <Bote /> : i === 1 ? <Canhao /> : <>
        <Barril position={[-1.7, 0.4, 0]} rotation={[0, 0, 1.2]} scale={1.5} />
        <Caixote position={[1.5, 0, -1]} rotation={[0, 0.3, 0.08]} />
        <Haste a={[-4, 0.4, 2]} b={[4, 1.5, -1]} r={0.32} cor={CORES.madeira} />
        {[-2, 0, 2].map(a => <Caixa key={a} pos={[a, 0.15, 2.8]} tam={[3.7, 0.2, 0.6]} rot={[0.03, a * 0.6, 0.05]} cor={CORES.clara} />)}
        <CoralMesa position={[-3, 0, -1]} scale={1.2} cor={CORES.coral} />
        {i === 2 && <group position={[2, 0, 2]} rotation={[-Math.PI / 2, 0, -0.4]} scale={2}><Ancora /></group>}
      </>}
      <Lanterna poste position={[-6.5, 0, 3.5]} scale={0.85} />
    </group>)}
  </group>;
}
