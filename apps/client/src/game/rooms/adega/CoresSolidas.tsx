import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mat } from '../../style/materials';

/**
 * Grava as cores sólidas nos vértices antes de o Estatico mesclar as peças.
 * Assim madeira, latão e paredes compartilham uma malha, preservando suas cores.
 * Textos, halos e materiais emissivos conservam seus próprios materiais.
 */
export function CoresSolidas({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const originais: { mesh: THREE.Mesh; geometria: THREE.BufferGeometry; material: THREE.Material; copia: THREE.BufferGeometry }[] = [];
    const unico = mat('#ffffff', { vertexColors: true });
    ref.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || Array.isArray(mesh.material)) return;
      const m = mesh.material as THREE.MeshLambertMaterial;
      if (!m.isMeshLambertMaterial || m.map || m.transparent || (m.emissiveIntensity > 0 && m.emissive.getHex() !== 0)) return;
      const g = mesh.geometry.clone();
      const existente = m.vertexColors ? g.getAttribute('color') : undefined;
      const cores = new Float32Array(g.getAttribute('position').count * 3);
      for (let i = 0; i < cores.length / 3; i++) {
        cores[i * 3] = m.color.r * (existente?.getX(i) ?? 1);
        cores[i * 3 + 1] = m.color.g * (existente?.getY(i) ?? 1);
        cores[i * 3 + 2] = m.color.b * (existente?.getZ(i) ?? 1);
      }
      g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
      originais.push({ mesh, geometria: mesh.geometry, material: mesh.material, copia: g });
      mesh.geometry = g;
      mesh.material = unico;
    });
    return () => {
      for (const { mesh, geometria, material, copia } of originais) {
        mesh.geometry = geometria;
        mesh.material = material;
        copia.dispose();
      }
    };
  }, []);
  return <group ref={ref}>{children}</group>;
}
