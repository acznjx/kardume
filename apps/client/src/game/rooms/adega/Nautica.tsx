import * as THREE from 'three';
import { useMemo } from 'react';
import { mat, PALETA } from '../../style/materials';
import { Cilindro, Corda, Madeira, type Grupo } from './Pecas';

/** Vidro com água facetada e silhuetas, sem luz pontual adicional. */
export function EscotilhaMar({ raio = 1, ...props }: Grupo & { raio?: number }) {
  const vidro = useMemo(() => {
    const g = new THREE.CircleGeometry(raio, 12);
    const pos = g.getAttribute('position');
    const cores: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) / raio + 1) / 2;
      const c = new THREE.Color('#12609c').lerp(new THREE.Color('#43c1d1'), t);
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return g;
  }, [raio]);
  return <group {...props}>
    <mesh material={mat(PALETA.madeiraEscura)}><torusGeometry args={[raio * 1.04, raio * 0.23, 4, 12]} /></mesh>
    <mesh material={mat(PALETA.latao)} position={[0, 0, 0.07]}><torusGeometry args={[raio, raio * 0.17, 5, 12]} /></mesh>
    <mesh position={[0, 0, -0.015]} geometry={vidro} material={mat('#ffffff', { vertexColors: true, emissivo: '#249fca', intensidade: 0.38 })} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return <mesh key={i} position={[Math.sin(a) * raio, Math.cos(a) * raio, raio * 0.2]} material={mat('#745a32')}><icosahedronGeometry args={[raio * 0.055, 0]} /></mesh>;
    })}
    {[[-0.3, 0.28], [0.3, -0.3]].map(([x, y], i) => <group key={i} position={[x * raio, y * raio, 0.01]} scale={raio}>
      <mesh scale={[0.24, 0.075, 0.025]} material={mat('#3da8bd', { emissivo: '#3da8bd', intensidade: 0.3 })}><icosahedronGeometry args={[1, 0]} /></mesh>
      <mesh position={[-0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#3da8bd', { emissivo: '#3da8bd', intensidade: 0.3 })}><coneGeometry args={[0.1, 0.16, 3]} /></mesh>
    </group>)}
    {[-0.4, 0.1, 0.55].map((y, i) => <mesh key={y} position={[(0.5 - i * 0.13) * raio, y * raio, 0.015]} material={mat('#79c9d2', { emissivo: '#79c9d2', intensidade: 0.25 })}><ringGeometry args={[raio * 0.035, raio * 0.045, 8]} /></mesh>)}
  </group>;
}
export function AlvoTaverna(props: Grupo) {
  const setores = 20;
  return <group {...props}>
    <Cilindro position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} raio={1.2} altura={0.2} cor={PALETA.madeiraEscura} />
    {Array.from({ length: setores }, (_, i) => <group key={i}>
      {[[0.12, 0.5], [0.56, 0.95]].map(([r0, r1]) => <mesh key={r0} material={mat(i % 2 ? '#eee0b7' : '#34332b')}><ringGeometry args={[r0, r1, 1, 1, i * Math.PI * 2 / setores, Math.PI * 2 / setores]} /></mesh>)}
      {[[0.5, 0.56], [0.95, 1.03]].map(([r0, r1]) => <mesh key={r0} position={[0, 0, 0.005]} material={mat(i % 2 ? '#a74533' : '#4d7950')}><ringGeometry args={[r0, r1, 1, 1, i * Math.PI * 2 / setores, Math.PI * 2 / setores]} /></mesh>)}
      <Corda de={[Math.sin(i * Math.PI * 2 / setores) * 0.12, Math.cos(i * Math.PI * 2 / setores) * 0.12, 0.018]} para={[Math.sin(i * Math.PI * 2 / setores) * 1.03, Math.cos(i * Math.PI * 2 / setores) * 1.03, 0.018]} raio={0.009} cor='#b7ac8a' />
    </group>)}
    <mesh position={[0, 0, 0.01]} material={mat('#a74533')}><circleGeometry args={[0.12, 10]} /></mesh>
    <mesh position={[0, 0, 0.02]} material={mat('#4d7950')}><circleGeometry args={[0.055, 8]} /></mesh>
    {[[0.22, 0.35], [-0.4, -0.22], [0.6, 0.1]].map(([x, y], i) => <group key={i} position={[x, y, 0.17]} rotation={[0.12, 0.2, i]}>
      <Cilindro rotation={[Math.PI / 2, 0, 0]} raio={0.02} altura={0.45} cor={PALETA.latao} />
      <Madeira position={[0, 0, 0.2]} tamanho={[0.21, 0.045, 0.2]} cor='#c6533e' />
      <Madeira position={[0, 0, 0.2]} tamanho={[0.045, 0.21, 0.2]} cor='#c6533e' />
    </group>)}
  </group>;
}
