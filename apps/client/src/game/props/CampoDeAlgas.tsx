import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETA, mat } from '../style/materials';

/**
 * Muitas algas balançando com poucos draw calls: cada "andar" da alga é um InstancedMesh
 * (todas as algas compartilham), e o balanço é aplicado na matriz de cada instância.
 */
export function CampoDeAlgas({ posicoes, segmentos = 5 }: { posicoes: [number, number, number][]; segmentos?: number }) {
  // posicoes: [x, z, altura]
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geos = useMemo(
    () =>
      Array.from({ length: segmentos }, (_, i) => {
        const g = new THREE.ConeGeometry(0.42 * (1 - i / (segmentos + 1)), 1, 4);
        g.translate(0, 0.5, 0);
        return g;
      }),
    [segmentos],
  );
  const mats = useMemo(() => [mat(PALETA.alga), mat(PALETA.algaEscura)], []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const sobe = useMemo(() => new THREE.Vector3(), []);
  const n = posicoes.length;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let k = 0; k < n; k++) {
      const [x, z, h] = posicoes[k];
      const seg = h / segmentos;
      base.set(x, 0, z);
      let rotZ = 0;
      let rotX = 0;
      for (let i = 0; i < segmentos; i++) {
        const mesh = refs.current[i];
        if (!mesh) continue;
        rotZ += Math.sin(t * 1.2 + k * 1.7 + i * 0.6) * 0.07;
        rotX += Math.cos(t * 1.0 + k * 0.9 + i * 0.5) * 0.05;
        tmp.position.copy(base);
        tmp.rotation.set(rotX, k * 0.7, rotZ);
        tmp.scale.set(1, seg * 1.15, 1);
        tmp.updateMatrix();
        mesh.setMatrixAt(k, tmp.matrix);
        // o próximo segmento começa no topo deste
        base.add(sobe.set(0, seg, 0).applyEuler(tmp.rotation));
      }
    }
    for (const m of refs.current) if (m) m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {geos.map((g, i) => (
        <instancedMesh
          key={i}
          ref={(m) => (refs.current[i] = m)}
          args={[g, mats[i % 2], n]}
          castShadow
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
