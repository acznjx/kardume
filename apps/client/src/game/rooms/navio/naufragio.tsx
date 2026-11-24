import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ASSENTOS, INTERACAO_POR_ID, NAVIO } from '@cardume/shared';
import { Ancora, Barril, Coral, Garrafa, Placa, Timao } from '../../props/props';
import { mat } from '../../style/materials';
import { useMundo } from '../../mundo';
import { BancoNavio, Caixa, Caixote, CORES, CoralMesa, Haste, Lanterna, Rocha } from './pecas';
const C = NAVIO.casco;
/** Peças curvas em camadas: quilha enterrada, barriga larga, borda partida. */
export function Naufragio() {
  return <group>
    <Caixa pos={[0, 0.14, 0]} tam={[64, 0.28, 23.6]} cor={CORES.escura} />
    <group rotation={[0.08, 0, -0.02]}>
      {[-1, 1].map(l => <group key={l}>
        {Array.from({ length: 9 }, (_, row) => {
          const y = row * 0.87 + 0.1;
          const z = (9.2 + Math.sin((row / 9) * Math.PI / 2) * 2.8) * l;
          return <group key={row}>{Array.from({ length: 16 }, (_, i) => {
            const x = -30 + i * 4;
            const entrada = l === 1 && NAVIO.buracos.some(b => x + 2 > b.x0 && x - 2 < b.x1) && y < 5.9;
            const canhao = row === 6 && [2, 7, 13].includes(i);
            if (entrada || canhao || (row > 6 && (i + row) % 11 === 0)) return null;
            return <Caixa key={i} pos={[x, y, z]} tam={[3.94, 0.79, 0.32]} cor={[CORES.madeira, '#865334', '#62422d'][((i * 7 + row) % 3)]} rot={[0, 0, Math.sin(i * 7 + row) * 0.018]} />;
          })}</group>;
        })}
        {/* Costelas aparentes e topos quebrados. As portas nunca recebem uma costela. */}
        {Array.from({ length: 17 }, (_, i) => {
          const x = -32 + i * 4;
          if (l === 1 && NAVIO.buracos.some(b => x > b.x0 - 0.7 && x < b.x1 + 0.7)) return null;
          return <group key={i}>
            <Haste a={[x, -0.7, l * 8.4]} b={[x, 4, l * 11.1]} r={0.23} cor={CORES.escura} />
            <Haste a={[x, 4, l * 11.1]} b={[x + Math.sin(i) * 0.3, 9 + (i % 3) * 0.5, l * 12.3]} r={0.23} cor={CORES.clara} />
            {i % 3 !== 1 && <Caixa pos={[x + 1.4, 9.2, l * 12.3]} tam={[2.8, 0.23, 0.25]} cor={CORES.escura} rot={[0, 0, i % 2 ? 0.06 : -0.09]} />}
          </group>;
        })}
        {/* Proa afunilada; a popa se fecha com madeira curva, não uma caixa. */}
        {Array.from({ length: 9 }, (_, row) => <group key={row}>
          <Haste a={[32, row * 0.91, l * 12]} b={[42, row * 1.03 + 0.6, 0]} r={0.43} cor={row % 2 ? CORES.madeira : CORES.clara} />
          <Haste a={[-32, row * 0.89, l * 12]} b={[-36, row * 0.94 + 0.2, l * 5]} r={0.4} cor={row % 2 ? CORES.madeira : CORES.escura} />
        </group>)}
        {/* Canhões saem dos portinholos escuros. */}
        {[-24, -4, 22].map(x => <group key={x} position={[x, 5.5, l * 12]}>
          <Caixa pos={[0, 0.1, -l * 0.15]} tam={[2.6, 1.8, 0.28]} cor={CORES.escura} />
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mat(CORES.ferro)} position={[0, 0.1, l * 0.8]}><cylinderGeometry args={[0.42, 0.58, 2.7, 8]} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('#1b3032')} position={[0, 0.1, l * 2.17]}><cylinderGeometry args={[0.28, 0.28, 0.015, 8]} /></mesh>
          <Caixa pos={[0, 1.25, 0.1]} tam={[2.2, 0.2, 1.3]} rot={[l * -0.5, 0, 0]} />
        </group>)}
      </group>)}
      {NAVIO.buracos.map(b => <group key={b.x0}>
        {[b.x0 + 0.35, b.x1 - 0.35].map((x, i) => <group key={x}>
          <Caixa pos={[x, 3.9, 11.9]} tam={[0.45, 2.2, 0.6]} rot={[0, 0, i ? -0.3 : 0.3]} cor={CORES.clara} />
          <Caixa pos={[x + (i ? -0.3 : 0.3), 5.5, 12.1]} tam={[1.8, 0.45, 0.5]} rot={[0, 0, i ? 0.3 : -0.3]} cor={CORES.escura} />
        </group>)}
      </group>)}
      {/* Colônias no casco; a vegetação se acumula nas bordas, longe das entradas. */}
      {Array.from({ length: 46 }, (_, i) => {
        const x = -30 + (i * 7.37 % 61), y = 1 + (i * 1.73 % 6);
        if (NAVIO.buracos.some(b => x > b.x0 - 1 && x < b.x1 + 1)) return null;
        return <group key={i} position={[x, y, 12.1]}>
          <mesh material={mat(i % 3 ? '#beac86' : CORES.creme)} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.18 + i % 3 * 0.1, 0.25, 6, 1, true]} /></mesh>
          {i % 5 === 0 && <CoralMesa scale={0.6} rotation={[0.4, 0, 0]} />}
        </group>;
      })}
      {[-29, -20, -4, 21, 29].map((x, i) => <group key={x} position={[x, 8.8, 12.4]}>
        {Array.from({ length: 5 }, (_, j) => <Haste key={j} a={[j * 0.3, 0, 0]} b={[j * 0.3 + 0.4, -1.8 - Math.sin(i + j) * 1.1, 0.35]} r={0.1} cor={j % 2 ? CORES.alga : CORES.teal} />)}
        <Coral position={[0, -2, 0]} cor={CORES.coral} scale={1.2} />
      </group>)}
    </group>
    {Array.from({ length: 8 }, (_, i) => <Caixa key={`popa-${i}`} pos={[-35.8, i * 0.95, 0]} tam={[0.45, 0.85, 10]} cor={i % 2 ? CORES.escura : CORES.madeira} rot={[0, 0, -0.04]} />)}
    {/* Convés nivelado: a colisão é uma aproximação estável do navio adernado. */}
    {Array.from({ length: 24 }, (_, i) => {
      const z = -11.5 + i, E = NAVIO.escotilha;
      const segmentos = z > E.z0 && z < E.z1 ? [[C.x0, E.x0], [E.x1, C.x1]] : [[C.x0, C.x1]];
      return <group key={i}>{segmentos.map(([a, b]) => <Caixa key={a} pos={[(a + b) / 2, C.conves, z]} tam={[b - a, 0.28, 0.94]} cor={i % 3 ? CORES.madeira : CORES.clara} />)}</group>;
    })}
    {[-24, -8, 8, 24].map(x => <Haste key={x} a={[x, 7.9, -12]} b={[x, 7.9, 12]} r={0.16} />)}
    {/* Abertura real: bordas lascadas e duas tábuas que sobraram. */}
    {[-1, 1].map(l => <group key={l}><Caixa pos={[7, 8.4, 3 + l * 2]} tam={[7.4, 0.5, 0.3]} cor={CORES.clara} /><Caixa pos={[7 + l * 3.5, 8.3, 3]} tam={[0.3, 0.3, 4.3]} cor={CORES.escura} /></group>)}
    <Caixa pos={[4.6, 8.35, 3]} tam={[0.55, 0.16, 4.2]} rot={[0, 0.13, 0.05]} />
    <Caixa pos={[10.1, 8.2, 2]} tam={[0.6, 0.16, 2.8]} rot={[-0.3, -0.15, 0]} />
    <Cabine />
    <Mastros />
    <Mirante />
    {ASSENTOS.filter(a => a.sala === 'navio' && a.id.startsWith('conves')).map(a => <BancoNavio key={a.id} position={[...a.pos]} rotation={[0, a.yaw, 0]} />)}
    {[-25, -5, 19, 30].map((x, i) => <Lanterna key={x} position={[x, 9.9, i % 2 ? -11 : 11]} />)}
    <group position={[29, 0.35, 21]} rotation={[-Math.PI / 2, 0, -0.6]} scale={3}><Ancora /></group>
    {Array.from({ length: 22 }, (_, i) => <mesh key={i} position={[28 - i * 0.17, 0.2 + Math.max(0, i - 16) * 0.45, 19 - i * 0.36]} rotation={[Math.PI / 2, i % 2 * Math.PI / 2, 0]} material={mat(CORES.ferro)}><torusGeometry args={[0.28, 0.075, 4, 8]} /></mesh>)}
    {[-27, -21, 19, 26].map((x, i) => <group key={x} position={[x, 0, 13.6]}><Rocha scale={[4, 0.65, 2.3]} position={[0, 0.1, 0]} cor={CORES.areia} /><Caixa pos={[i - 1, 0.3, 1]} tam={[5, 0.2, 0.65]} rot={[0.04, i * 1.2, 0.03]} /></group>)}
    <Placa texto="PORÃO · ENTRE PELOS ROMBOS" largura={5.4} altura={0.65} position={[-1, 5.6, 12.8]} rotation={[0, 0, -0.04]} />
  </group>;
}
function Cabine() {
  return <group position={[-27, 8.15, 0]}>
    <Caixa pos={[0, 2.3, 0]} tam={[9, 4.6, 17]} cor={CORES.teal} />
    {[-8.5, 8.5].map(z => <group key={z}>
      {[0, 1, 2].map(i => <Caixa key={i} pos={[0, i * 1.6, z]} tam={[9.4, 0.22, 0.25]} cor={CORES.escura} />)}
      {[-3, 0, 3].map(x => <group key={x} position={[x, 2.5, z]}>
        <Caixa pos={[0, 0, 0]} tam={[1.8, 2, 0.16]} cor={CORES.ouro} />
        <mesh position={[0, 0, Math.sign(z) * 0.12]} material={mat('#e9aa4c', { emissivo: '#ef9a32', intensidade: 0.5 })}><boxGeometry args={[1.4, 1.6, 0.1]} /></mesh>
        <Caixa pos={[0, 0, Math.sign(z) * 0.2]} tam={[0.13, 1.8, 0.12]} />
      </group>)}
    </group>)}
    <Caixa pos={[4.55, 1.7, 0]} tam={[0.15, 3.4, 2.2]} cor={CORES.escura} />
    <Placa texto="CAPITÃO SEM RUMO" largura={5.5} altura={0.65} position={[0, 4.05, 8.75]} rotation={[0, 0, -0.04]} />
    {/* Telhado quebrado, beirais salientes e vigas desencontradas. */}
    {Array.from({ length: 11 }, (_, i) => <Caixa key={i} pos={[0, 5.1 + Math.cos(i / 10 * Math.PI) * 0.35, -9 + i * 1.8]} tam={[10, 0.32, 1.7]} cor={i % 3 ? CORES.escura : CORES.madeira} rot={[0, i === 3 ? 0.08 : 0, -0.07]} />)}
    <CoralMesa position={[-3, 5.6, 7]} cor={CORES.coral} scale={1.6} />
    <Lanterna position={[4.9, 3.6, 1.8]} />
    <Timao position={[5.8, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} />
  </group>;
}
function Mastros() {
  return <group>{NAVIO.mastros.map((m, i) => <group key={m.x}>
    <Haste a={[m.x, 8, 0]} b={[m.x + (i ? -1.3 : 1.8), m.altura, 0.8]} r={0.44} cor={CORES.madeira} />
    {[m.cesto - 7, m.cesto + 7].map((y, j) => <group key={y}>
      <Haste a={[m.x + 0.5, y, -9 + j * 2]} b={[m.x + 0.5, y - 0.6, 9 - j * 2]} r={0.2} cor={CORES.clara} />
      <VelaRasgada x={m.x + 0.5} y={y - 0.9} largura={j ? 11 : 17} altura={j ? 5 : 7.5} />
    </group>)}
    <mesh material={mat(CORES.escura)} position={[m.x, m.cesto, m.z]}><cylinderGeometry args={[2.3, 1.9, 0.4, 10]} /></mesh>
    {Array.from({ length: 10 }, (_, j) => <Caixa key={j} pos={[m.x + Math.sin(j / 10 * Math.PI * 2) * 2.1, m.cesto + 0.7, Math.cos(j / 10 * Math.PI * 2) * 2.1]} tam={[0.7, 1.1, 0.22]} cor={CORES.clara} rot={[0, j / 10 * Math.PI * 2, j % 3 * 0.05]} />)}
    {[-1, 1].map(l => <group key={l}>
      <Haste a={[m.x + 1, m.altura - 2, 0]} b={[m.x - 8, 8.8, l * 11.5]} r={0.055} cor={CORES.creme} />
      <Haste a={[m.x, m.cesto + 3, 0]} b={[m.x + 7, 8.8, l * 11.5]} r={0.055} cor={CORES.creme} />
    </group>)}
    {/* Enxárcia com travessas de corda. */}
    {Array.from({ length: 12 }, (_, j) => {
      const t = j / 12; return <Haste key={j} a={[m.x - 1.4, 9 + t * (m.cesto - 9), 11 * (1 - t)]} b={[m.x + 1.4, 9 + t * (m.cesto - 9), 11 * (1 - t)]} r={0.05} cor={CORES.creme} />;
    })}
    <Lanterna position={[m.x, m.cesto + 1.4, 2.1]} scale={0.8} />
  </group>)}</group>;
}
function VelaRasgada({ x, y, largura, altura }: { x: number; y: number; largura: number; altura: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-largura / 2, 0); s.lineTo(largura / 2, -0.25);
    s.lineTo(largura / 2 - 0.5, -altura * 0.8);
    for (let i = 8; i >= 0; i--) {
      const xx = -largura / 2 + i / 9 * largura;
      s.lineTo(xx + 0.3, -altura * (0.78 + i % 3 * 0.1));
      s.lineTo(xx, -altura * (i === 3 ? 0.35 : 0.66 + i % 2 * 0.1));
    }
    s.closePath();
    const furo = new THREE.Path();
    furo.moveTo(-2, -1.2); furo.lineTo(-0.4, -1.7); furo.lineTo(-0.8, -3.4); furo.lineTo(-2.7, -2.8); furo.closePath(); s.holes.push(furo);
    const g = new THREE.ShapeGeometry(s, 1); g.rotateY(Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) p.setX(i, Math.sin(p.getZ(i) * 0.35) * Math.min(1, -p.getY(i) / 2) * 0.7);
    const ids = Array.from(g.index!.array), rev: number[] = [];
    for (let i = 0; i < ids.length; i += 3) rev.push(ids[i + 2], ids[i + 1], ids[i]);
    g.setIndex([...ids, ...rev]); g.computeVertexNormals(); return g;
  }, [largura, altura]);
  return <mesh geometry={geo} position={[x, y, 0]} material={mat('#c8b58b')} />;
}function Mirante() {
  const M = NAVIO.mirante, x = (M.x0 + M.x1) / 2;
  return <group>
    {/* A proa aponta para um rochedo separado, com passadiço partido sobre o vão. */}
    <Rocha position={[x, 5, 0]} scale={[5.3, 8.2, 6.2]} cor={CORES.pedra} />
    <Rocha position={[x + 4, 2, -3]} scale={[4.5, 4.5, 5]} cor={CORES.pedraClara} />
    {[-4.5, 4.5].map(z => <group key={z}>
      <Haste a={[40, 10, z]} b={[M.x0, 12.6, z]} r={0.22} cor={CORES.escura} />
      <Haste a={[41, 13.8, z]} b={[M.x0, 15, z]} r={0.055} cor={CORES.creme} />
      {[41, 45, 51, 54].map(a => <Haste key={a} a={[a, 10.8 + (a - 41) * 0.16, z]} b={[a, 13.8 + (a - 41) * 0.09, z]} r={0.13} />)}
    </group>)}
    {[41, 42, 44, 46, 51, 52, 53].map(a => <Caixa key={a} pos={[a, 10.4 + (a - 40) * 0.17, 0]} tam={[0.85, 0.16, a === 46 ? 4 : 9]} cor={CORES.clara} rot={[0, a === 46 ? 0.2 : 0, 0.17]} />)}
    <Caixa pos={[x, M.altura, 0]} tam={[M.x1 - M.x0, 0.2, 12]} cor={CORES.clara} />
    {[-6, 6].map(z => <group key={z}>
      <Haste a={[M.x0, M.altura + 1.2, z]} b={[M.x1, M.altura + 1.2, z]} r={0.11} cor={CORES.creme} />
      {[M.x0, x, M.x1].map(a => <Haste key={a} a={[a, M.altura, z]} b={[a, M.altura + 1.4, z]} r={0.16} />)}
    </group>)}
    <Timao position={[x + 1, M.altura + 1.5, 0]} rotation={[0, Math.PI / 2, 0]} />
    <Placa texto="MIRANTE DA PROA" largura={5} altura={0.75} position={[x, 11.8, 6.2]} />
    <Lanterna position={[M.x1, 14.3, 5.7]} /><CoralMesa position={[x + 4, 7, 4]} scale={1.8} />
  </group>;
}
export function Porao() {
  const q = INTERACAO_POR_ID.get('quadro')!.pos;
  return <group>
    {[-29, -20, -2, 19, 28].map(x => <group key={x}>
      <Haste a={[x, 0.3, -10.8]} b={[x, 7.5, -10.8]} r={0.23} />
      <Haste a={[x, 6.2, -10.8]} b={[x, 7.5, -7]} r={0.15} />
    </group>)}
    {[-25, -7, 14, 27].map((x, i) => <group key={x}><Barril position={[x, 0.3, -8.8]} scale={1.5} /><Barril position={[x + 2, 0.3, -9.6]} /><Caixote position={[x - 1.5, 0.3, -6]} rotation={[0, i * 0.4, 0]} /></group>)}
    <group position={[13, 0.3, -6]} rotation={[0, -0.18, 0]}>
      <Caixa pos={[0, 1, 0]} tam={[2.6, 2, 1.7]} cor={CORES.ferro} />
      <Caixa pos={[0, 1, 0.9]} tam={[2.2, 1.65, 0.16]} cor={CORES.pedra} />
      <mesh position={[0, 1.1, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={mat('#a86032')}><cylinderGeometry args={[0.4, 0.4, 0.15, 8]} /></mesh>
      <Caixa pos={[0.65, 1, 1.1]} tam={[0.12, 0.65, 0.1]} cor={CORES.ouro} />
      <Placa texto="COFRE · NÃO ABRIR" largura={3.3} altura={0.6} position={[0, 2.5, 0.8]} rotation={[0, 0, -0.06]} />
    </group>
    <group position={[-4, 0.3, -8.5]}>
      <mesh material={mat('#eadfc7')} position={[0, 0.5, 0.1]}><cylinderGeometry args={[0.7, 0.4, 0.9, 8]} /></mesh>
      <mesh material={mat('#eadfc7')} position={[0, 1, 0.1]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.52, 0.15, 5, 8]} /></mesh>
      <Caixa pos={[0, 1.4, -0.6]} tam={[1.3, 1.4, 0.5]} cor="#eadfc7" />
      <Caixa pos={[0.32, 1.85, -0.3]} tam={[0.2, 0.12, 0.15]} cor={CORES.ouro} />
      <Placa texto="NÃO É O BAR" largura={3} altura={0.65} position={[0, 3, -0.65]} rotation={[0, 0, 0.08]} />
    </group>
    <group position={[q[0], 3.2, q[2] + 0.45]} rotation={[0, 0, 0.18]}>
      <Caixa pos={[0, 0, 0]} tam={[3.4, 2.8, 0.2]} cor={CORES.ouro} /><Caixa pos={[0, 0, 0.12]} tam={[2.9, 2.3, 0.05]} cor={CORES.teal} />
      <Rocha position={[0, -0.15, 0.25]} scale={[0.65, 0.8, 0.18]} cor={CORES.coral} />
      <Caixa pos={[0, 0.65, 0.25]} tam={[1.8, 0.3, 0.12]} cor={CORES.escura} /><Caixa pos={[0, 0.85, 0.25]} tam={[1, 0.4, 0.12]} cor={CORES.escura} />
      <Rocha position={[0.3, 0, 0.45]} scale={[0.19, 0.19, 0.1]} cor={CORES.creme} />
      <Placa texto="O CAPITÃO (DIZEM)" largura={3.5} altura={0.45} position={[0, -1.8, 0.1]} />
    </group>
    <group position={[22, 0.3, 4]} rotation={[0, -0.35, 0]}>
      <Caixa pos={[0, 0.6, 0]} tam={[3, 1.2, 1.8]} cor={CORES.escura} />
      <Caixa pos={[0, 1.4, -0.7]} tam={[3, 1.6, 0.2]} cor={CORES.clara} rot={[-0.45, 0, 0]} />
      {[-1, 1].map(x => <Caixa key={x} pos={[x, 0.7, 0.95]} tam={[0.2, 1.4, 0.12]} cor={CORES.ouro} />)}
      {Array.from({ length: 16 }, (_, i) => <mesh key={i} material={mat(CORES.ouro)} position={[(i * 0.41 % 2.4) - 1.2, 1.28 + i % 3 * 0.06, (i * 0.33 % 1.3) - 0.6]}><cylinderGeometry args={[0.23, 0.23, 0.08, 6]} /></mesh>)}
      <Coral position={[1.7, 0, -0.3]} cor={CORES.rosa} />
    </group>
    {[-18, 3, 23].map(x => <Lanterna key={x} position={[x, 5.7, -5]} />)}
    <Placa texto="ACHADOS & AFUNDADOS" largura={6} altura={0.7} position={[5, 5.8, -11.2]} />
  </group>;
}
export function GarrafaMensagem() {
  const p = INTERACAO_POR_ID.get('garrafa')!.pos;
  return <group position={[p[0], p[1] + 0.25, p[2]]} rotation={[0, 0.6, 1.35]} scale={1.8}><Garrafa cor="#589e86" /></group>;
}
export function Sino() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = (performance.now() - useMundo.getState().sinoEm) / 1000;
    if (ref.current) ref.current.rotation.x = t >= 0 && t < 2.5 ? Math.sin(t * 14) * 0.5 * (1 - t / 2.5) : 0;
  });
  const p = INTERACAO_POR_ID.get('sino')!.pos;
  return <group position={[...p]}>
    {[-1.2, 1.2].map(x => <Haste key={x} a={[x, 0, 0]} b={[x, 3.4, 0]} r={0.16} />)}
    <Caixa pos={[0, 3.4, 0]} tam={[2.9, 0.3, 0.3]} />
    <group ref={ref} position={[0, 3.25, 0]} userData={{ dinamico: true }}>
      <mesh material={mat(CORES.ouro)} position={[0, -0.65, 0]}><cylinderGeometry args={[0.3, 0.75, 1.1, 8, 1, true]} /></mesh>
      <mesh material={mat(CORES.ouro)} position={[0, -0.17, 0]}><icosahedronGeometry args={[0.35, 0]} /></mesh>
      <mesh material={mat(CORES.escura)} position={[0, -1.2, 0]}><icosahedronGeometry args={[0.15, 0]} /></mesh>
      <Haste a={[0, -1.2, 0]} b={[0, -2.8, 0]} r={0.04} cor={CORES.creme} />
    </group>
  </group>;
}
