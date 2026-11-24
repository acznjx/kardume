import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SALA_NAVIO } from '@cardume/shared';
import { Estatico } from '../../props/Estatico';
import { Placa } from '../../props/props';
import { CORES, Haste, Lanterna } from './pecas';
const DESTINOS: Record<string, string> = {
  'praca-conves': 'CONVÉS', 'conves-praca': 'PRAÇA', 'praca-adega': 'ADEGA',
  'adega-praca': 'PRAÇA', 'praca-concha': 'CONCHA', 'navio-jardim': 'JARDIM', 'navio-arcos': 'ARCOS',
};
/** Sete caminhos compartilham material, relógio e uma única malha de bolhas. */
export function CorrentesMarinhas() {
  const bolhas = useRef<THREE.InstancedMesh>(null);
  const dados = useMemo(() => SALA_NAVIO.correntes!.map(c => {
    const curva = new THREE.CatmullRomCurve3(c.pontos.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    const comprimento = curva.getLength();
    return { ...c, curva, comprimento, geo: new THREE.TubeGeometry(curva, Math.ceil(comprimento * 1.5), 1.25, 8, false) };
  }), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { tempo: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying float nevoa;
      void main() {vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.0); nevoa=1.0-smoothstep(65.0,190.0,length(p.xyz)); gl_Position=projectionMatrix*p;}`,
    fragmentShader: `uniform float tempo; varying vec2 vUv; varying float nevoa;
      void main() {
        float fim=smoothstep(0.0,0.045,vUv.x)*(1.0-smoothstep(0.94,1.0,vUv.x));
        float linha=pow(max(0.0,sin(vUv.y*18.8496+sin(vUv.x*13.0)*0.45)),16.0);
        float pulso=pow(max(0.0,sin(vUv.x*110.0-tempo*23.0)),12.0);
        float seta=pow(max(0.0,sin(vUv.x*100.0-abs(vUv.y-0.5)*13.0-tempo*16.0)),25.0);
        float a=(0.008+linha*0.065+pulso*linha*0.22+seta*0.025)*fim*nevoa;
        gl_FragColor=vec4(mix(vec3(0.22,0.7,0.65),vec3(0.64,1.0,0.9),pulso),a);
      }`,
  }), []);
  const amostras = useMemo(() => dados.flatMap(c => Array.from({ length: 54 }, (_, i) => ({ c, i }))), [dados]);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const cima = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    material.uniforms.tempo.value = t;
    const m = bolhas.current; if (!m) return;
    amostras.forEach(({ c, i }, j) => {
      const u = (i / 54 + t * c.velocidade / c.comprimento) % 1;
      c.curva.getPointAt(u, pos); c.curva.getTangentAt(u, normal);
      const a = i * 2.4 + t * 0.4, r = 0.45 + (i % 5) * 0.22;
      pos.x += Math.cos(a) * r; pos.y += Math.sin(a) * r;
      obj.position.copy(pos); obj.quaternion.setFromUnitVectors(cima, normal);
      const s = (0.045 + i % 4 * 0.022) * Math.min(1, u * 20, (1 - u) * 20);
      obj.scale.set(s, s * (i % 3 === 0 ? 4 : 1.2), s); obj.updateMatrix(); m.setMatrixAt(j, obj.matrix);

    });
    m.instanceMatrix.needsUpdate = true;
  });
  useEffect(() => () => { dados.forEach(c => c.geo.dispose()); material.dispose(); }, [dados, material]);
  return <group>
    {dados.map(c => <mesh key={c.id} geometry={c.geo} material={material} />)}
    <instancedMesh ref={bolhas} args={[undefined, undefined, amostras.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#b8f8e6" transparent opacity={0.65} depthWrite={false} />
    </instancedMesh>
    <Estatico sombra={false}>{dados.map(c => {
      const [x, y, z] = c.pontos[0];
      const direcao = new THREE.Vector3(...c.pontos[1]).sub(new THREE.Vector3(x, y, z)).normalize();
      const sx = x - direcao.z * 3.8, sz = z + direcao.x * 3.8;
      return <group key={c.id} position={[sx, y - 2.5, sz]} rotation={[0, Math.atan2(-direcao.x, -direcao.z), 0]}>
        <Haste a={[0, 0, 0]} b={[0, 3, 0]} r={0.12} cor={CORES.teal} />
        <Placa texto={`CORRENTE → ${DESTINOS[c.id]}`} largura={6} altura={0.8} position={[0, 2.5, 0]} />
        <Placa texto="entre nadando · deixe a maré levar" largura={5} altura={0.48} position={[0, 1.6, 0]} />
        <Lanterna position={[0, 3.5, 0]} scale={0.65} />
      </group>;
    })}</Estatico>
  </group>;
}
