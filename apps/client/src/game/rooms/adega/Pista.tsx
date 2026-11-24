import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ADEGA } from '@cardume/shared';
import { Placa } from '../../props/props';
import { mat, PALETA } from '../../style/materials';
import { DEGRAUS_PALCO } from './medidas';
import { Cilindro, Madeira, PocoLuz, Varal } from './Pecas';

export function Palco() {
  const p = ADEGA.palco;
  const pista = ADEGA.pista;
  return <group>
    <Madeira position={[(p.x0 + p.x1) / 2, p.altura / 2, (p.z0 + p.z1) / 2]} tamanho={[p.x1 - p.x0, p.altura, p.z1 - p.z0]} cor={PALETA.madeiraEscura} />
    {Array.from({ length: 19 }, (_, i) => <Madeira key={i} position={[p.x0 + (i + 0.5) * 0.5, p.altura - 0.035, (p.z0 + p.z1) / 2]} tamanho={[0.48, 0.07, p.z1 - p.z0]} cor={i % 2 ? PALETA.madeiraClara : PALETA.madeira} />)}
    {DEGRAUS_PALCO.map((d, i) => <group key={i}>
      <Madeira position={[(d.min[0] + d.max[0]) / 2, d.y / 2, (d.min[1] + d.max[1]) / 2]} tamanho={[d.max[0] - d.min[0], d.y, d.max[1] - d.min[1]]} cor={PALETA.madeiraClara} />
      <Madeira position={[(d.min[0] + d.max[0]) / 2, d.y + 0.005, d.min[1] + 0.06]} tamanho={[9, 0.012, 0.1]} cor={PALETA.latao} />
    </group>)}
    <Madeira position={[18.5, 0.815, 14.7]} tamanho={[6.6, 0.02, 1.5]} cor='#8d3839' />
    {[14.9, 22.2].map((x) => <group key={x} position={[x, p.altura, 16.3]} rotation={[0, Math.PI, 0]}>
      <Madeira position={[0, 1.15, 0]} tamanho={[1.6, 2.3, 1.6]} cor='#343a35' />
      {[0.65, 1.65].map((y) => <group key={y}>
        <Cilindro position={[0, y, 0.82]} rotation={[Math.PI / 2, 0, 0]} raio={y < 1 ? 0.57 : 0.3} altura={0.08} cor={PALETA.latao} />
        <Cilindro position={[0, y, 0.88]} rotation={[Math.PI / 2, 0, 0]} raio={y < 1 ? 0.46 : 0.22} altura={0.08} cor='#252d2c' />
      </group>)}
    </group>)}
    <Radiola />
    <group position={[18.5, 5.9, 17.5]} rotation={[0, Math.PI, 0]}>
      <Placa texto='RADIOLA DAS MARÉS' largura={8.1} altura={0.9} />
      <Placa texto='Do baião à maré cheia' largura={6} altura={0.55} position={[0, -0.95, 0]} />
    </group>
    <Varal de={[13.4, 6.9, 14.6]} para={[23.3, 6.9, 14.6]} quantidade={15} />
    <Varal de={[13.4, 6.8, 7]} para={[23.3, 6.8, 7]} quantidade={12} />
    <PocoLuz x={18.5} z={9.5} raio={5} />
    <Madeira position={[18.2, 0.032, 9.75]} tamanho={[pista.x1 - pista.x0 + 0.2, 0.04, pista.z1 - pista.z0 + 0.2]} cor={PALETA.madeiraEscura} />
    {Array.from({ length: 9 }, (_, x) => Array.from({ length: 6 }, (_, z) => <Madeira key={`${x}/${z}`} position={[14.2 + x, 0.062, 7.3 + z * 0.98]} tamanho={[0.96, 0.02, 0.94]} cor={(x + z) % 2 ? '#b17a44' : '#6c4430'} />))}
  </group>;
}
function Radiola() {
  const arco = useMemo(() => new THREE.Shape().absarc(0, 0, 1.5, 0, Math.PI, false).closePath(), []);
  return <group position={[18.5, ADEGA.palco.altura, 16.7]} rotation={[0, Math.PI, 0]}>
    <Madeira position={[0, 1.5, 0]} tamanho={[3, 3, 1.6]} cor={PALETA.madeiraEscura} />
    <mesh position={[0, 2.7, -0.8]} material={mat(PALETA.madeiraEscura)}><extrudeGeometry args={[arco, { depth: 1.6, bevelEnabled: false, curveSegments: 5 }]} /></mesh>
    <mesh position={[0, 2.7, 0.85]} material={mat(PALETA.latao)}><torusGeometry args={[1.25, 0.14, 4, 12, Math.PI]} /></mesh>
    <Madeira position={[0, 1.5, 0.85]} tamanho={[2.55, 2.9, 0.12]} cor={PALETA.latao} />
    <Madeira position={[0, 1.1, 0.93]} tamanho={[2.1, 1.8, 0.06]} cor='#263c38' />
    {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Madeira key={x} position={[x, 1.1, 0.97]} tamanho={[0.08, 1.7, 0.06]} cor={PALETA.latao} />)}
    <Madeira position={[0, 2.45, 0.95]} tamanho={[2.15, 0.55, 0.1]} cor='#263c38' />
    <Placa texto='Uma moeda, uma maré' largura={2.2} altura={0.32} position={[0, 0.25, 1]} />
    {[-1.3, 1.3].map((x) => <Cilindro key={x} position={[x, 1.9, 0.94]} raio={0.07} altura={2.7} cor='#d89f4b' />)}
  </group>;
}
/** Só as barrinhas da radiola se animam; toda a marcenaria fica no Estatico. */
export function Pista() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < 10; i++) {
      const h = 0.1 + (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.6 + i * 1.4)) * 0.3;
      tmp.position.set(18.5 - 0.86 + i * 0.19, 3.05 + h / 2, 15.69);
      tmp.scale.set(0.11, h, 0.06); tmp.updateMatrix(); ref.current.setMatrixAt(i, tmp.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, mat('#ffcf77', { emissivo: '#ffc15b', intensidade: 1.4 }), 10]} userData={{ dinamico: true }} frustumCulled={false}><boxGeometry /></instancedMesh>;
}
