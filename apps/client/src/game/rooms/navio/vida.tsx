import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mat } from '../../style/materials';
import { acaso } from './ambiente';
/** Um cardume inteiro usa duas chamadas: corpos e caudas. */
export function CardumeDecorativo({ centro, cor, fase = 0 }: { centro: [number, number, number]; cor: string; fase?: number }) {
  const corpo = useRef<THREE.InstancedMesh>(null), cauda = useRef<THREE.InstancedMesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.12 + fase;
    for (let i = 0; i < 22; i++) {
      const a = t + i * 0.065, r = 7 + acaso(i) * 3;
      obj.position.set(centro[0] + Math.cos(a) * r, centro[1] + Math.sin(i * 2 + t) * 1.3, centro[2] + Math.sin(a) * r);
      obj.rotation.set(0, -a, 0); obj.scale.set(0.26, 0.38, 0.75); obj.updateMatrix(); corpo.current?.setMatrixAt(i, obj.matrix);
      obj.translateZ(-0.8); obj.scale.set(0.09, 0.45, 0.38); obj.rotation.z = Math.sin(clock.elapsedTime * 5 + i) * 0.12; obj.updateMatrix(); cauda.current?.setMatrixAt(i, obj.matrix);
    }
    if (corpo.current) corpo.current.instanceMatrix.needsUpdate = true;
    if (cauda.current) cauda.current.instanceMatrix.needsUpdate = true;
  });
  return <group><instancedMesh ref={corpo} args={[undefined, mat(cor), 22]} frustumCulled={false}><icosahedronGeometry args={[0.65, 0]} /></instancedMesh><instancedMesh ref={cauda} args={[undefined, mat(cor), 22]} frustumCulled={false}><coneGeometry args={[0.6, 1, 3]} /></instancedMesh></group>;
}
export function RaiosSuaves() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(5, 60, 8, 6);
    const p = g.getAttribute('position'), cores = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      // No modo aditivo, preto nas bordas desaparece: evita faixas retangulares duras.
      const v = Math.pow(Math.max(0, 1 - Math.abs(p.getX(i)) / 2.5), 2) * Math.sin((p.getY(i) / 60 + 0.5) * Math.PI);
      cores.set([v, v, v], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    return g;
  }, []);
  return <group>{[[-24, -12], [18, 26], [47, -25], [-46, 22]].map(([x, z], i) => <mesh key={i} position={[x, 26, z]} rotation={[0, i * 1.2, -0.25]}>
    <primitive object={geo} attach="geometry" /><meshBasicMaterial color="#b9ead4" vertexColors transparent opacity={0.03} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
  </mesh>)}</group>;
}
