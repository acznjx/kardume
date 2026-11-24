import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Junta toda a decoração parada dentro dele em poucas malhas (uma por material).
 * Salas grandes têm centenas de pecinhas (garrafas, tábuas, bancos); sem isso cada uma
 * vira um draw call. Luzes e objetos com `userData.dinamico = true` são mantidos como estão.
 *
 * Use só para coisas que não se mexem nem mudam depois de montadas.
 */
export function Estatico({ children, sombra = true }: { children: ReactNode; sombra?: boolean }) {
  const fonte = useRef<THREE.Group>(null);
  const [mesclados, setMesclados] = useState<THREE.Mesh[]>([]);

  useLayoutEffect(() => {
    const g = fonte.current;
    if (!g) return;
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
    const baldes = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cor: boolean }>();
    const usados: THREE.Mesh[] = [];
    const m = new THREE.Matrix4();

    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as unknown as THREE.InstancedMesh).isInstancedMesh) return;
      if (Array.isArray(mesh.material) || dinamico(mesh, g)) return;
      const mat = mesh.material as THREE.Material & { vertexColors?: boolean };
      let geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      m.multiplyMatrices(inv, mesh.matrixWorld);
      geo.applyMatrix4(m);
      const cor = !!mat.vertexColors;
      // todos precisam ter o mesmo conjunto de atributos para juntar
      for (const nome of Object.keys(geo.attributes)) {
        if (!['position', 'normal', 'uv', 'color'].includes(nome)) geo.deleteAttribute(nome);
      }
      if (!geo.getAttribute('normal')) geo.computeVertexNormals();
      if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
      if (!cor && geo.getAttribute('color')) geo.deleteAttribute('color');
      if (cor && !geo.getAttribute('color')) {
        const c = new Float32Array(geo.getAttribute('position').count * 3).fill(1);
        geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
      }
      geo.morphAttributes = {};
      let b = baldes.get(mat);
      if (!b) baldes.set(mat, (b = { geos: [], cor }));
      b.geos.push(geo);
      usados.push(mesh);
      geo = null as unknown as THREE.BufferGeometry;
    });

    const novos: THREE.Mesh[] = [];
    for (const [mat, { geos }] of baldes) {
      const junto = mergeGeometries(geos, false);
      geos.forEach((x) => x.dispose());
      if (!junto) continue;
      const mesh = new THREE.Mesh(junto, mat);
      mesh.castShadow = sombra;
      mesh.receiveShadow = true;
      novos.push(mesh);
    }
    // esconde as peças originais (as luzes continuam funcionando)
    for (const u of usados) u.visible = false;
    setMesclados(novos);
    return () => {
      for (const u of usados) u.visible = true;
      novos.forEach((n) => n.geometry.dispose());
    };
  }, [sombra]);

  return (
    <>
      <group ref={fonte}>{children}</group>
      {mesclados.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}

function dinamico(o: THREE.Object3D, raiz: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p && p !== raiz; p = p.parent) if (p.userData.dinamico) return true;
  return false;
}
