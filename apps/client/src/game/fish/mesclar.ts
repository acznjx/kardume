import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat } from '../style/materials';

const tmpCor = new THREE.Color();

/**
 * Funde todas as malhas de um objeto (com as transformações já aplicadas) numa malha só,
 * convertendo a cor de cada material em cor de vértice. Resultado: 1 draw call por objeto.
 * As geometrias originais são descartadas.
 */
export function mesclarEmUmaMalha(raiz: THREE.Object3D): THREE.Mesh {
  raiz.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(raiz.matrixWorld).invert();
  const m = new THREE.Matrix4();
  const geos: THREE.BufferGeometry[] = [];

  raiz.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const material = mesh.material as THREE.MeshLambertMaterial;
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    m.multiplyMatrices(inv, mesh.matrixWorld);
    g.applyMatrix4(m);
    const n = g.getAttribute('position').count;
    const cores = new Float32Array(n * 3);
    const base = material.color ?? tmpCor.set('#ffffff');
    const existente = material.vertexColors ? g.getAttribute('color') : null;
    for (let i = 0; i < n; i++) {
      const r = existente ? existente.getX(i) : 1;
      const gg = existente ? existente.getY(i) : 1;
      const b = existente ? existente.getZ(i) : 1;
      cores[i * 3] = base.r * r;
      cores[i * 3 + 1] = base.g * gg;
      cores[i * 3 + 2] = base.b * b;
    }
    for (const nome of Object.keys(g.attributes)) if (nome !== 'position' && nome !== 'normal') g.deleteAttribute(nome);
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    geos.push(g);
    mesh.geometry.dispose();
  });

  const junta = mergeGeometries(geos, false) ?? new THREE.BufferGeometry();
  geos.forEach((g) => g.dispose());
  const resultado = new THREE.Mesh(junta, mat('#ffffff', { vertexColors: true }));
  resultado.castShadow = true;
  return resultado;
}
