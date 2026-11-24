import { ADEGA } from '@cardume/shared';
import { Banco } from '../../props/props';
import { mat, PALETA } from '../../style/materials';
import { ASSENTOS_ADEGA } from './medidas';
import { Bebidas, Cilindro, Madeira, Pendente, SombraContato, Tapete } from './Pecas';
export { Madeira } from './Pecas';

export function MesaCompleta({ x, z }: { x: number; z: number }) {
  const h = ADEGA.alturaMesa;
  return <group>
    <Tapete x={x} z={z} largura={7} profundidade={7} cor={x > 12 ? '#315f61' : '#8d3839'} />
    <group position={[x, 0, z]}>
      <Cilindro position={[0, h - 0.13, 0]} raio={ADEGA.raioMesa} altura={0.26} cor={PALETA.madeiraClara} />
      <Cilindro position={[0, 0.8, 0]} raio={0.3} base={0.4} altura={1.6} cor={PALETA.madeira} />
      <Cilindro position={[0, 0.12, 0]} raio={0.8} base={0.95} altura={0.24} cor={PALETA.madeiraEscura} />
      {[-0.95, -0.35, 0.35, 0.95].map((s) => <Madeira key={s} position={[0, h + 0.008, s]} tamanho={[Math.sqrt(1.6 ** 2 - s ** 2) * 1.9, 0.012, 0.025]} cor={PALETA.madeiraEscura} />)}
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 4) * 1.48, h - 0.13, Math.cos(i * Math.PI / 4) * 1.48]} material={mat('#533c26')}><icosahedronGeometry args={[0.055, 0]} /></mesh>)}
      <Bebidas position={[0, h + 0.02, 0]} />
    </group>
    <SombraContato x={x} z={z} raio={1.8} />
    <Pendente x={x} z={z} />
  </group>;
}
export function Mesas() {
  return <>{ADEGA.mesas.map(([x, z]) => <MesaCompleta key={`${x}/${z}`} x={x} z={z} />)}</>;
}
export function Banquetas() {
  return <>{ASSENTOS_ADEGA.filter((a) => !a.id.startsWith('cabine')).map((a) => <group key={a.id} name={a.id} position={[a.pos[0], 0, a.pos[2]]} rotation={[0, a.yaw, 0]}>
    {/* O banco original tem o topo em 1,03. O contrato indica o topo, não o centro. */}
    <SombraContato x={0} z={0} raio={0.85} />
    <Banco scale={[1.09, a.pos[1] / 1.03, 1.09]} />
    {a.id.startsWith('balcao-') && <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(PALETA.latao)}><torusGeometry args={[0.42, 0.055, 4, 8]} /></mesh>}
  </group>)}</>;
}
