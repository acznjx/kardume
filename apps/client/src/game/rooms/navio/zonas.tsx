import { useMemo } from 'react';
import * as THREE from 'three';
import { ASSENTOS, NAVIO, PORTAS } from '@cardume/shared';
import { Barril, Coral, Placa } from '../../props/props';
import { mat } from '../../style/materials';
import { BancoNavio, Caixa, Caixote, CORES, Concha, CoralMesa, Haste, Lanterna, Rocha } from './pecas';
export function Praca() {
  const [x, z] = NAVIO.praca.centro;
  return <group>
    <group position={[x, 0, z]}>
      <mesh material={mat('#958969')} position={[0, 0.02, 0]}><cylinderGeometry args={[12, 12.4, 0.15, 16]} /></mesh>
      <mesh material={mat(CORES.areia)} position={[0, 0.1, 0]}><cylinderGeometry args={[10.8, 11, 0.12, 16]} /></mesh>
      {Array.from({ length: 24 }, (_, i) => <Rocha key={i} position={[Math.sin(i / 24 * Math.PI * 2) * 11.6, 0.15, Math.cos(i / 24 * Math.PI * 2) * 11.6]} scale={[0.6, 0.3, 0.7]} cor={CORES.pedraClara} />)}
      {/* Fonte de coral em três taças, com bolhas saindo do topo. */}
      <mesh material={mat(CORES.teal)} position={[0, 0.5, 0]}><cylinderGeometry args={[2.7, 3, 0.9, 10]} /></mesh>
      <mesh material={mat('#3f9e9b', { emissivo: '#388f85', intensidade: 0.35 })} position={[0, 1, 0]}><cylinderGeometry args={[2.35, 2.35, 0.12, 10]} /></mesh>
      {[1.5, 2.5].map((y, i) => <group key={y}><mesh material={mat(CORES.coral)} position={[0, y, 0]}><cylinderGeometry args={[1.6 - i * 0.6, 0.4, 0.4, 8]} /></mesh><Haste a={[0, y - 0.7, 0]} b={[0, y, 0]} r={0.2} cor={CORES.ouro} /></group>)}
      <Concha position={[0, 2.8, 0]} scale={1.7} />
      {Array.from({ length: 8 }, (_, i) => <Concha key={i} position={[Math.sin(i * Math.PI / 4) * 2.6, 0.9, Math.cos(i * Math.PI / 4) * 2.6]} rotation={[0, i * Math.PI / 4, 0]} />)}
      <Placa texto="PRAÇA DO CARDUME" largura={6.5} altura={1} position={[0, 4.8, -4]} rotation={[0, 0, -0.025]} />
      {[-5, 5].map(dx => <Haste key={dx} a={[dx, 0, -4]} b={[dx, 6, -4]} r={0.18} />)}
      <Bandeirinhas a={[-5, 5.8, -4]} b={[5, 5.8, -4]} />
      {[-7, 7].map(dx => <Lanterna key={dx} poste position={[dx, 0, 5]} />)}
    </group>
    {ASSENTOS.filter(a => a.sala === 'navio' && a.id.startsWith('praca')).map(a => <BancoNavio key={a.id} position={[...a.pos]} rotation={[0, a.yaw, 0]} />)}
    <Barraca x={x - 22} z={z + 8} texto="CONCHAS & CAUSOS" cor={CORES.teal} />
    <Barraca x={x + 22} z={z + 10} texto="CORREIO DE MARÉ" cor={CORES.coral} />
    <group position={[x + 16, 0, z - 14]}>
      <Haste a={[0, 0, 0]} b={[0, 6.2, 0]} r={0.18} />
      {['← CONCHA ACÚSTICA', 'ADEGA →', '↑ PORÃO & MIRANTE', '← JARDIM DE CORAIS'].map((t, i) => <Placa key={t} texto={t} largura={4.5} altura={0.6} position={[0, 5.5 - i * 0.9, 0.2]} rotation={[0, i % 2 * 0.15, i % 2 ? 0.035 : -0.035]} />)}
      <Lanterna position={[0, 6.4, 0]} />
    </group>
  </group>;
}
function Bandeirinhas({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  return <group>{Array.from({ length: 10 }, (_, i) => {
    const t = i / 9, tt = (i + 1) / 9;
    const p = (v: number): [number, number, number] => [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v - Math.sin(v * Math.PI) * 0.7, a[2] + (b[2] - a[2]) * v];
    return <group key={i}><Haste a={p(t)} b={p(Math.min(1, tt))} r={0.04} cor={CORES.creme} /><mesh position={p(t)} rotation={[0, 0, Math.PI]} material={mat(i % 3 ? CORES.teal : CORES.coral)}><coneGeometry args={[0.4, 0.9, 3]} /></mesh></group>;
  })}</group>;
}
function Barraca({ x, z, texto, cor }: { x: number; z: number; texto: string; cor: string }) {
  return <group position={[x, 0, z]} rotation={[0, x > 0 ? -0.25 : 0.25, 0]}>
    {[-2.4, 2.4].map(dx => <Haste key={dx} a={[dx, 0, -0.7]} b={[dx, 4.8, -0.7]} r={0.15} />)}
    <Caixa pos={[0, 1, 0]} tam={[4.8, 2, 1.8]} cor={CORES.escura} /><Caixa pos={[0, 2.1, 0]} tam={[5.2, 0.2, 2.2]} cor={CORES.clara} />
    {Array.from({ length: 6 }, (_, i) => <Caixa key={i} pos={[-2 + i * 0.8, 4.2, 0.1]} tam={[0.78, 0.16, 3]} rot={[0.12, 0, 0]} cor={i % 2 ? cor : CORES.creme} />)}
    <Placa texto={texto} largura={4.2} altura={0.65} position={[0, 3.4, 1.35]} />
    {[-1.5, 0, 1.5].map(dx => <Concha key={dx} position={[dx, 2.3, 0]} scale={0.8} />)}
    <Lanterna position={[2.7, 3.5, 1]} /><Caixote position={[-3.8, 0, 0]} /><Barril position={[3.8, 0, 0]} />
  </group>;
}
export function Anfiteatro() {
  const A = NAVIO.anfiteatro, [x, z] = A.centro;
  return <group position={[x, 0, z]}>
    <mesh material={mat(CORES.teal)} position={[0, 0.2, 0]}><cylinderGeometry args={[5.4, 5.8, 0.4, 12]} /></mesh>
    <mesh material={mat('#cd8c68')} position={[0, 0.42, 0]}><cylinderGeometry args={[5, 5, 0.06, 12]} /></mesh>
    {/* Cada faixa tem um único topo: sem faces coplanares sobrepostas. */}
    {A.degraus.map((r, d) => <Arquibancada key={r} raio={r} altura={(d + 1) * A.alturaDegrau} cor={d % 2 ? '#83988a' : CORES.pedra} />)}    {/* Leque de vieira atrás do palco, aberto para a plateia a oeste (-X). */}
    <group position={[3.7, 0.45, 0]}>
      {Array.from({ length: 11 }, (_, i) => {
        const a = -Math.PI / 2 + i / 10 * Math.PI;
        return <group key={i}>
          <Haste a={[0, 0, 0]} b={[0.7, 1.4 + Math.cos(a) * 7.5, Math.sin(a) * 6.7]} r={0.7} cor={i % 2 ? '#ec9c7c' : '#d97965'} />
          <Rocha position={[0.7, 1.4 + Math.cos(a) * 7.5, Math.sin(a) * 6.7]} scale={[0.8, 0.8, 0.8]} cor={CORES.creme} />
        </group>;
      })}
      <CoralMesa position={[0, 0, -6]} scale={1.4} cor={CORES.rosa} />
    </group>
    <Haste a={[-0.7, 0.5, 0]} b={[-0.7, 2.2, 0]} r={0.08} cor={CORES.ferro} />
    <Rocha position={[-0.7, 2.2, 0]} scale={[0.22, 0.3, 0.22]} cor={CORES.ferro} />
    <Placa texto="CONCHA ACÚSTICA" largura={5.5} altura={0.85} position={[1, 1.4, 7]} rotation={[0, -0.35, -0.05]} />
    {[-7.5, 7.5].map(dz => <Lanterna key={dz} poste position={[-4, 0, dz]} />)}
  </group>;
}
function Arquibancada({ raio, altura, cor }: { raio: number; altura: number; cor: string }) {
  const geo = useMemo(() => {
    const v: number[] = [];
    const quad = (a: number[], b: number[], c: number[], d: number[]) => v.push(...a, ...b, ...c, ...a, ...c, ...d);
    const p = (r: number, a: number, y: number) => [Math.cos(a) * r, y, Math.sin(a) * r];
    const ri = raio - 1.5, ro = raio + 1.5;
    for (let i = 0; i < 28; i++) {
      const a = Math.PI * 0.5 + i / 28 * Math.PI, b = a + Math.PI / 28;
      quad(p(ri, a, altura), p(ri, b, altura), p(ro, b, altura), p(ro, a, altura));
      quad(p(ro, a, 0), p(ro, a, altura), p(ro, b, altura), p(ro, b, 0));
      quad(p(ri, b, 0), p(ri, b, altura), p(ri, a, altura), p(ri, a, 0));
    }
    for (const a of [Math.PI * 0.5, Math.PI * 1.5]) quad(p(ri, a, 0), p(ri, a, altura), p(ro, a, altura), p(ro, a, 0));
    // Duas faces também nos cortes das extremidades.
    const frente = [...v]; for (let i = 0; i < frente.length; i += 9) v.push(...frente.slice(i + 6, i + 9), ...frente.slice(i + 3, i + 6), ...frente.slice(i, i + 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  }, [raio, altura]);
  return <group><mesh geometry={geo} material={mat(cor)} />
    {/* Marcações de assentos sobre a pedra, sem duplicar o piso inteiro. */}
    {Array.from({ length: Math.floor(raio) }, (_, i) => {
      const a = Math.PI * 0.55 + i / Math.floor(raio) * Math.PI * 0.9;
      return <Rocha key={i} position={[Math.cos(a) * (raio + 1.2), altura + 0.06, Math.sin(a) * (raio + 1.2)]} scale={[0.18, 0.1, 0.18]} cor={CORES.creme} />;
    })}
  </group>;
}export function EntradaAdega() {
  const [x, , z] = PORTAS.navio.pos;
  return <group position={[x, 0, z]}>
    <mesh material={mat('#958969')} position={[0, 0.05, 5]}><cylinderGeometry args={[10, 10.5, 0.2, 10]} /></mesh>
    {/* As laterais e a verga deixam a abertura física livre até o gatilho. */}
    {[-1, 1].map(l => <group key={l}>
      <Rocha position={[l * 5.6, 3.4, -2.5]} scale={[4.3, 6.2, 5]} />
      <Rocha position={[l * 3, 4, 0]} scale={[1.3, 4.8, 2]} cor={CORES.pedraClara} />
      <Barril position={[l * 5, 0.2, 3]} scale={1.5} /><Barril position={[l * 6.3, 0.2, 4.8]} />
      <Lanterna position={[l * 2.8, 3.8, 1.2]} />
      <CoralMesa position={[l * 6, 5.6, 0]} cor={CORES.coral} scale={1.7} />
    </group>)}
    <Rocha position={[0, 8.5, -2.5]} scale={[6.5, 3.7, 5]} cor={CORES.pedra} />
    <Caixa pos={[0, 2.3, -1.6]} tam={[4, 4.6, 0.2]} cor={CORES.escura} />
    <mesh position={[0, 2.2, -1.4]} material={mat('#d49a48', { emissivo: '#e99735', intensidade: 0.65 })}><planeGeometry args={[3.6, 4.4]} /></mesh>
    <Caixa pos={[0, 0.22, 0.1]} tam={[4.5, 0.35, 2.8]} cor={CORES.clara} />
    <Caixa pos={[0, 4.8, 0.3]} tam={[5.8, 0.5, 1]} cor={CORES.escura} />
    <Placa texto="ADEGA · BAR DO CARDUME" largura={8.2} altura={1.1} position={[0, 6.6, 3.1]} rotation={[0, 0, -0.025]} />
    <Placa texto="só entra em pé!" fonte="Caveat" largura={3} altura={0.75} position={[4.6, 2.5, 3.5]} rotation={[0, -0.2, 0.09]} />
    <Caixote position={[-7, 0, 5]} /><Lanterna poste position={[7, 0, 7]} />
    <Bandeirinhas a={[-7, 8, 1]} b={[7, 8, 1]} />
  </group>;
}
export function Arcos() {
  return <group>{NAVIO.arcos.map(([x, z, y], i) => <group key={i} position={[x, 0, z]}>
    {/* Pilares até o fundo: nada de aros soltos no ar. */}
    {[-1, 1].map(l => <group key={l}><Rocha position={[l * 4.8, y * 0.38, 0]} scale={[1.8, Math.max(2, y * 0.7), 2]} /><CoralMesa position={[l * 4.9, y * 0.3, 1.5]} cor={i % 2 ? CORES.rosa : CORES.coral} scale={1.3} /></group>)}
    <mesh position={[0, y, 0]} material={mat(i % 2 ? CORES.pedraClara : CORES.pedra)}><torusGeometry args={[4.7, 1.2, 5, 11, Math.PI]} /></mesh>
    <Lanterna position={[-4.3, y - 0.5, 1.4]} />
    {i === 2 && <><mesh position={[0, y - 4.6, 0]} material={mat(CORES.pedraClara)}><cylinderGeometry args={[3.6, 3, 0.8, 8]} /></mesh><Placa texto="MIRANTE DOS ARCOS" largura={4} altura={0.65} position={[0, y - 3.6, 3]} /></>}
  </group>)}</group>;
}
export function Jardim() {
  const [x, z] = NAVIO.jardim.centro;
  return <group position={[x, 0, z]}>
    <Rocha position={[0, 1, 0]} scale={[5, 2, 4]} />
    {Array.from({ length: 28 }, (_, i) => {
      const a = i * 2.4, r = 2 + Math.sqrt(i) * 2;
      return <group key={i} position={[Math.cos(a) * r, i < 5 ? 1.8 : 0, Math.sin(a) * r]}>
        {i % 2 ? <CoralMesa scale={1 + i % 4 * 0.4} cor={[CORES.coral, CORES.rosa, CORES.ouro][i % 3]} /> : <Coral cor={[CORES.rosa, CORES.coral, CORES.ouro][i % 3]} scale={2 + i % 3} />}
      </group>;
    })}
    <Placa texto="JARDIM DE CORAIS" largura={5.5} altura={0.8} position={[8, 2, 10]} rotation={[0, -0.3, -0.04]} />
    <Lanterna poste position={[10, 0, 7]} /><Lanterna poste position={[-7, 0, 9]} />
  </group>;
}
export function LuzesDosCaminhos() {
  return <group>{[[-17, 33], [36, 63], [-43, 58], [-69, 7], [73, -5], [-34, -38]].map(([x, z], i) => <Lanterna key={i} poste position={[x, 0, z]} />)}</group>;
}
