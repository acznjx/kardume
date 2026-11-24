import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
/** Uma malha para pradarias e florestas; o balanço acontece na GPU. */
function geometriaAlga() {
  const vertices: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => vertices.push(...a, ...b, ...c, ...c, ...b, ...a);
  for (let i = 0; i < 7; i++) {
    const y = i / 7, yy = (i + 1) / 7;
    const x = Math.sin(y * 6) * 0.1, xx = Math.sin(yy * 6) * 0.1;
    const w = 0.055 * (1 - y * 0.65), ww = 0.055 * (1 - yy * 0.65);
    tri([x - w, y, 0], [x + w, y, 0], [xx + ww, yy, 0.02]);
    tri([x - w, y, 0], [xx + ww, yy, 0.02], [xx - ww, yy, 0.02]);
    if (i > 0 && i < 6) {
      const l = i % 2 ? -1 : 1;
      tri([x, y, 0], [x + l * 0.23, y + 0.12, 0.07], [x + l * 0.34, y + 0.26, 0]);
      tri([x, y, 0], [x + l * 0.34, y + 0.26, 0], [x + l * 0.15, y + 0.2, -0.04]);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.computeVertexNormals(); return g;
}
export function AlgasInstanciadas({ posicoes }: { posicoes: [number, number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tempo = useMemo(() => ({ value: 0 }), []);
  const geo = useMemo(geometriaAlga, []);
  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    m.onBeforeCompile = shader => {
      shader.uniforms.tempoAlga = tempo;
      shader.vertexShader = 'uniform float tempoAlga;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        float fase = instanceMatrix[3].x * 0.17 + instanceMatrix[3].z * 0.23;
        transformed.x += sin(tempoAlga * 0.65 + fase + position.y * 2.0) * position.y * position.y * 0.12;
        transformed.z += cos(tempoAlga * 0.5 + fase) * position.y * position.y * 0.07;
      `);
    };
    return m;
  }, [tempo]);
  useLayoutEffect(() => {
    const mesh = ref.current; if (!mesh) return;
    const obj = new THREE.Object3D(), cor = new THREE.Color();
    posicoes.forEach(([x, z, h], i) => {
      obj.position.set(x, -0.1, z); obj.rotation.set(0, i * 2.4, 0);
      obj.scale.set(h > 5 ? 3.2 : 1.7, h, h > 5 ? 2.5 : 1.4); obj.updateMatrix(); mesh.setMatrixAt(i, obj.matrix);
      cor.set(['#35754c', '#477e55', '#24675b', '#69805a'][i % 4]); mesh.setColorAt(i, cor);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [posicoes]);
  useFrame(({ clock }) => { tempo.value = clock.elapsedTime; });
  useEffect(() => () => { geo.dispose(); material.dispose(); }, [geo, material]);
  return <instancedMesh ref={ref} args={[geo, material, posicoes.length]} frustumCulled={false} />;
}
