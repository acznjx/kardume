import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ADEGA, FAIXA_POR_ID } from '@cardume/shared';
import { nivelMusica, batidaMusica } from '../../musica';
import { useMundo } from '../../mundo';
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
/** O letreiro muda só na troca de faixa; os pulsos não passam pelo React. */
function VisorRadiola() {
  const faixa = useMundo((s) => s.radiola?.faixa);
  const mapa = useMemo(() => {
    const tela = document.createElement('canvas'); tela.width = 1024; tela.height = 256;
    const c = tela.getContext('2d')!;
    c.fillStyle = '#183d38'; c.fillRect(0, 0, 1024, 256);
    c.strokeStyle = '#dfb769'; c.lineWidth = 8; c.strokeRect(5, 5, 1014, 246);
    c.textAlign = 'center'; c.fillStyle = '#a7d1b9'; c.font = '32px monospace';
    c.fillText(faixa ? 'TOCANDO AGORA' : 'RADIOLA DAS MARÉS', 512, 57);
    const f = faixa ? FAIXA_POR_ID.get(faixa) : undefined;
    const palavras = (f?.nome ?? 'Escolha sua maré').split(' ');
    const linhas = ['']; c.font = 'bold 62px Georgia';
    for (const p of palavras) {
      const i = linhas.length - 1;
      if (c.measureText(`${linhas[i]} ${p}`).width > 920) linhas.push(p);
      else linhas[i] = `${linhas[i]} ${p}`.trim();
    }
    c.fillStyle = '#ffe3a2'; linhas.forEach((l, i) => c.fillText(l, 512, linhas.length > 1 ? 126 + i * 63 : 157));
    const t = new THREE.CanvasTexture(tela); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }, [faixa]);
  useEffect(() => () => mapa.dispose(), [mapa]);
  return <mesh name='faixa-na-radiola' position={[18.5, 3.94, 15.74]} rotation={[0, Math.PI, 0]}>
    <planeGeometry args={[2.25, 0.56]} /><meshBasicMaterial map={mapa} toneMapped={false} />
  </mesh>;
}

/** Barrinhas, tubos e 54 ladrilhos: matrizes/cores reutilizadas, sem luzes extras. */
export function Pista() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const piso = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const tinta = useMemo(() => new THREE.Color(), []);
  const cores = useMemo(() => ['#328f87', '#d4944e', '#bb6552', '#5e9caa'].map((c) => new THREE.Color(c)), []);
  const luz = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffd58b', emissive: '#ffb74b', emissiveIntensity: 0.6 }), []);
  const tubos = useMemo(() => new THREE.MeshLambertMaterial({ color: '#7ccbc0', emissive: '#42b9b2', emissiveIntensity: 0.4 }), []);
  useEffect(() => () => { luz.dispose(); tubos.dispose(); }, [luz, tubos]);
  useFrame(({ clock }) => {
    if (!ref.current || !piso.current) return;
    const nivel = nivelMusica(), batida = batidaMusica(), t = clock.elapsedTime;
    luz.emissiveIntensity = 0.45 + nivel * 2.1;
    tubos.emissiveIntensity = 0.25 + nivel * 1.8;
    for (let i = 0; i < 10; i++) {
      const onda = 0.5 + 0.5 * Math.sin(t * 2.6 + i * 1.4);
      const h = 0.07 + onda * 0.12 + nivel * (0.13 + onda * 0.25);
      tmp.position.set(18.5 - 0.86 + i * 0.19, 3.05 + h / 2, 15.69);
      tmp.scale.set(0.11, h, 0.06); tmp.updateMatrix(); ref.current.setMatrixAt(i, tmp.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    for (let x = 0; x < 9; x++) for (let z = 0; z < 6; z++) {
      const i = x * 6 + z;
      tmp.position.set(14.2 + x, 0.073, 7.3 + z * 0.98); tmp.scale.set(0.96, 0.025, 0.94);
      tmp.updateMatrix(); piso.current.setMatrixAt(i, tmp.matrix);
      const onda = 0.5 + 0.5 * Math.sin(t * 1.2 + x * 0.8 - z * 0.9);
      tinta.copy(cores[(x + z * 3) % cores.length]).multiplyScalar(0.32 + onda * 0.13 + batida * (0.45 + onda * 0.65));
      piso.current.setColorAt(i, tinta);
    }
    piso.current.instanceMatrix.needsUpdate = true;
    if (piso.current.instanceColor) piso.current.instanceColor.needsUpdate = true;
  });
  return <group userData={{ dinamico: true }}>
    <VisorRadiola />
    <instancedMesh name='equalizador-radiola' ref={ref} args={[undefined, luz, 10]} frustumCulled={false}><boxGeometry /></instancedMesh>
    <instancedMesh name='ladrilhos-musicais' ref={piso} args={[undefined, undefined, 54]} frustumCulled={false}>
      <boxGeometry /><meshBasicMaterial toneMapped={false} />
    </instancedMesh>
    <group position={[...ADEGA.radiola]} rotation={[0, Math.PI, 0]}>
      {[-1.3, 1.3].map((x) => <mesh key={x} position={[x, 1.9, 1.04]} material={tubos}><cylinderGeometry args={[0.04, 0.04, 2.65, 6]} /></mesh>)}
      <mesh position={[0, 2.7, 1.02]} material={tubos}><torusGeometry args={[1.25, 0.055, 4, 16, Math.PI]} /></mesh>
    </group>
  </group>;
}
