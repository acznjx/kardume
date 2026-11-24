import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { AlvoPeixe } from '../mundo';

const N = 18;
const VEL_MINIMA = 10.5; // só aparece no turbo ou nas correntes

/**
 * Rastro de bolhas atrás do peixe quando ele nada muito rápido (turbo, correntes).
 * Fica no espaço do mundo, fora do grupo do peixe, para as bolhas "ficarem para trás".
 */
export function TrilhaBolhas({ ler }: { ler: () => AlvoPeixe | undefined }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const bolhas = useMemo(
    () => Array.from({ length: N }, () => ({ pos: new THREE.Vector3(), vida: 0, tam: 0.1 })),
    [],
  );
  const estado = useRef({ anterior: new THREE.Vector3(NaN, 0, 0), vel: 0, proxima: 0, i: 0 });
  const tmp = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const m = ref.current;
    const a = ler();
    if (!m || !a || dt <= 0) return;
    const e = estado.current;
    if (!Number.isNaN(e.anterior.x)) {
      const v = Math.hypot(a.pos.x - e.anterior.x, a.pos.z - e.anterior.z, a.pos.y - e.anterior.y) / dt;
      if (v < 60) e.vel += (v - e.vel) * Math.min(1, dt * 8); // ignora teletransporte
    }
    e.anterior.copy(a.pos);

    e.proxima -= dt;
    if (e.vel > VEL_MINIMA && e.proxima <= 0) {
      e.proxima = 0.045;
      const b = bolhas[e.i];
      e.i = (e.i + 1) % N;
      // nasce um pouco atrás e com espalhamento
      b.pos.set(
        a.pos.x - Math.sin(a.yaw) * 0.9 + (Math.random() - 0.5) * 0.5,
        a.pos.y + (Math.random() - 0.5) * 0.5,
        a.pos.z - Math.cos(a.yaw) * 0.9 + (Math.random() - 0.5) * 0.5,
      );
      b.vida = 1;
      b.tam = 0.07 + Math.random() * 0.1;
    }

    for (let k = 0; k < N; k++) {
      const b = bolhas[k];
      if (b.vida > 0) {
        b.vida -= dt * 1.4;
        b.pos.y += dt * 1.2;
      }
      tmp.position.copy(b.pos);
      tmp.scale.setScalar(b.vida > 0 ? b.tam * (0.6 + (1 - b.vida) * 0.8) : 0.0001);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshLambertMaterial color="#e6fbfb" transparent opacity={0.7} emissive="#a8e6e6" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
