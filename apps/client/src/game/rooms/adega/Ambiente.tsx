import { useMemo } from 'react';
import * as THREE from 'three';
import { ADEGA } from '@cardume/shared';
import { Placa } from '../../props/props';
import { mat, PALETA } from '../../style/materials';
import { MURETAS, PILARES } from './medidas';
import { Corda, Madeira, Pendente, Tapete, Varal } from './Pecas';
export { Decoracao } from './Decoracao';

/** O degradê nos vértices escurece a base sem texturas de parede ou luzes extras. */
function Painel({ largura, altura, cor, ...props }: { largura: number; altura: number; cor: string; position: THREE.Vector3Tuple; rotation?: THREE.EulerTuple }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(largura, altura, Math.ceil(largura / 3), 4);
    const pos = g.getAttribute('position');
    const cores: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + altura / 2) / altura;
      const borda = Math.min(1, (largura / 2 - Math.abs(pos.getX(i))) / 2);
      const c = new THREE.Color(cor).multiplyScalar((0.65 + 0.35 * Math.sin(t * Math.PI * 0.85)) * (0.78 + 0.22 * borda));
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return g;
  }, [largura, altura, cor]);
  return <mesh {...props} geometry={geo} material={mat('#ffffff', { vertexColors: true })} receiveShadow />;
}
export function Casco() {
  return <group>
    <Madeira position={[0, -0.2, 0]} tamanho={[48, 0.24, 36]} cor={PALETA.madeiraEscura} />
    {/* Tábuas largas, com juntas desencontradas e variação contida de cor. */}
    {Array.from({ length: 48 }, (_, i) => Array.from({ length: 7 }, (_, k) => {
      const inicio = Math.max(-18, -18 + k * 6 - (i % 3) * 1.6);
      const fim = Math.min(18, -12 + k * 6 - (i % 3) * 1.6);
      if (fim <= inicio) return null;
      return <Madeira key={`${i}/${k}`} position={[-23.5 + i, -0.035, (inicio + fim) / 2]} tamanho={[0.965, 0.07, fim - inicio - 0.035]} cor={['#98744f', '#a58258', '#a07b55', '#916c49'][(i * 7 + k * 3) % 4]} />;
    }))}
    <Painel position={[0, 4, -17.96]} largura={48} altura={8} cor={PALETA.paredeTeal} />
    <Painel position={[-23.96, 4, 0]} rotation={[0, Math.PI / 2, 0]} largura={36} altura={8} cor={PALETA.paredeTealEscura} />
    <Painel position={[23.96, 4, 0]} rotation={[0, -Math.PI / 2, 0]} largura={36} altura={8} cor={PALETA.paredeTeal} />
    {[-1, 1].map((s) => <group key={s}>
      <Painel position={[s * 13.5, 4, 17.96]} rotation={[0, Math.PI, 0]} largura={21} altura={8} cor={PALETA.paredeTealEscura} />
      <Madeira position={[s * 13.5, 0.85, 17.7]} tamanho={[21, 1.7, 0.25]} cor={PALETA.madeiraEscura} />
      <Madeira position={[s * 23.7, 0.85, 0]} tamanho={[0.25, 1.7, 36]} cor={PALETA.madeiraEscura} />
      <Madeira position={[s * 23.55, 1.75, 0]} tamanho={[0.2, 0.18, 36]} cor={PALETA.madeiraClara} />
      {Array.from({ length: 30 }, (_, i) => <Madeira key={i} position={[s * 23.5, 0.85, -17.4 + i * 1.2]} tamanho={[0.18, 1.5, 0.07]} />)}
      {Array.from({ length: 18 }, (_, i) => <Madeira key={i} position={[s * (3.4 + i * 1.17), 0.85, 17.5]} tamanho={[0.08, 1.5, 0.15]} />)}
    </group>)}
    <Madeira position={[0, 0.85, -17.7]} tamanho={[48, 1.7, 0.25]} cor={PALETA.madeiraEscura} />
    <Madeira position={[0, 1.75, -17.5]} tamanho={[48, 0.18, 0.2]} cor={PALETA.madeiraClara} />
    {Array.from({ length: 40 }, (_, i) => <Madeira key={i} position={[-23.4 + i * 1.2, 0.85, -17.5]} tamanho={[0.07, 1.5, 0.18]} />)}
    <Madeira position={[0, 6.5, 18]} tamanho={[6, 3, 0.25]} cor={PALETA.paredeTealEscura} />
    <Madeira position={[0, 8.12, 0]} tamanho={[48, 0.24, 36]} cor='#315754' />
    {[-16, -9, -2, 5, 12, 17.5].map((z) => <group key={z}>
      <Madeira position={[0, 7.65, z]} tamanho={[48, 0.7, 0.65]} />
      {[-23.6, 23.6].map((x) => <group key={x}>
        <Madeira position={[x, 4, z]} tamanho={[0.48, 8, 0.5]} />
        <Madeira position={[x + (x > 0 ? -0.45 : 0.45), 7.05, z]} rotation={[0, 0, x > 0 ? -0.7 : 0.7]} tamanho={[0.35, 1.6, 0.4]} cor={PALETA.madeiraClara} />
      </group>)}
    </group>)}
    {[-14.2, -2, 12.8].map((x) => <Madeira key={x} position={[x, 7.75, 0]} tamanho={[0.6, 0.5, 36]} />)}
    <Divisoes />
    <PortaSaida />
    <Tapete x={0} z={12.5} largura={4.6} profundidade={9.8} cor='#315f61' />
    <Pendente x={0} z={13.4} y={5.4} mesa={false} />
    <Varal de={[-13.5, 7.15, -9.2]} para={[12.6, 7.15, -9.2]} quantidade={16} />
    <Varal de={[-13.5, 6.5, 2]} para={[12.6, 6.5, 2]} quantidade={22} />
    <Varal de={[-13.5, 6.5, 12]} para={[12.6, 6.5, 12]} quantidade={22} />
  </group>;
}
function Divisoes() {
  return <group>
    {MURETAS.map((b, i) => <group key={i}>
      <Madeira position={[-14.2, 1.1, (b.min[1] + b.max[1]) / 2]} tamanho={[0.6, 2.2, b.max[1] - b.min[1]]} cor={PALETA.paredeTealEscura} />
      <Madeira position={[-14.2, 2.3, (b.min[1] + b.max[1]) / 2]} tamanho={[0.9, 0.2, b.max[1] - b.min[1] + 0.2]} cor={PALETA.madeiraClara} />
    </group>)}
    {PILARES.map(([x, z]) => <Madeira key={z} position={[x, 3.8, z]} tamanho={[0.5, 7.6, 0.5]} />)}
    {ADEGA.cabines.map(([, z]) => <group key={z} position={[-14.2, 5.2, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh scale={[1, 0.65, 1]} material={mat(PALETA.madeiraClara)}><torusGeometry args={[3.4, 0.22, 4, 10, Math.PI]} /></mesh>
      <Madeira position={[0, 2.25, 0]} tamanho={[7.4, 0.35, 0.65]} />
    </group>)}
    {[8.2, 11.3, 14.4, 17.5].map((z) => <group key={z}>
      <Madeira position={[12.82, 0.7, z]} tamanho={[0.25, 1.4, 0.25]} />
      {z < 17.5 && [0.7, 1.25].map((y) => <group key={y}>
        <Corda de={[12.82, y, z]} para={[12.82, y - 0.22, z + 1.55]} />
        <Corda de={[12.82, y - 0.22, z + 1.55]} para={[12.82, y, z + 3.1]} />
      </group>)}
    </group>)}
  </group>;
}
function PortaSaida() {
  return <group position={[0, 0, ADEGA.entrada[2]]} rotation={[0, Math.PI, 0]}>
    {/* Vão livre de seis unidades, com arco acima da altura de passagem. */}
    <Madeira position={[0, 2.4, -0.5]} tamanho={[6, 4.8, 0.15]} cor='#183b3b' />
    {[-1, 1].map((s) => <Madeira key={s} position={[s * 3.15, 2.3, 0]} tamanho={[0.4, 4.6, 0.6]} cor={PALETA.madeiraClara} />)}
    <mesh position={[0, 4.6, 0]} scale={[1, 0.65, 1]} material={mat(PALETA.madeiraClara)}><torusGeometry args={[3.15, 0.22, 4, 10, Math.PI]} /></mesh>
    <Placa texto='Ao navio' largura={4} altura={0.7} position={[0, 6.7, 0.2]} />
  </group>;
}
export function Iluminacao() {
  return <group>
    <hemisphereLight args={['#c1e0e2', '#6d5544', 0.72]} />
    <directionalLight position={[2, 14, 4]} intensity={0.55} color='#fff0d8' />
    {([[-7, 4.7, -13], [-6, 4.5, -4], [6, 4.5, -4], [-6, 4.5, 7], [6, 4.5, 7], [-20, 4.2, 1], [18, 4.7, 8.5], [18, 4.5, -9]] as const).map((p, i) => <pointLight key={i} position={[...p]} color={i === 6 ? '#ffbb77' : '#ffdeb2'} intensity={i === 0 ? 65 : 48} distance={i === 5 ? 23 : 18} decay={1.7} />)}
  </group>;
}
