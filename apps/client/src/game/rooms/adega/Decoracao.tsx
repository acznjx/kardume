import { useMemo } from 'react';
import * as THREE from 'three';
import { ADEGA } from '@cardume/shared';
import { Ancora, Barril, Garrafa, Placa, Timao } from '../../props/props';
import { mat, PALETA } from '../../style/materials';
import { AlvoTaverna as AlvoDardos, EscotilhaMar as Escotilha } from './Nautica';
import { BARRIS, CAIXOTES, VASOS } from './medidas';
import { CanecaTaverna as Caneca, Cilindro, Corda, Madeira, Varal, type Grupo } from './Pecas';

function Retrato({ variante = 0, ...props }: Grupo & { variante?: number }) {
  const cor = ['#e5ad45', '#dc765c', '#8d83b7'][variante % 3];
  return <group {...props}>
    <Madeira tamanho={[2.15, 2.5, 0.18]} cor={PALETA.latao} />
    <Madeira position={[0, 0, 0.1]} tamanho={[1.87, 2.22, 0.07]} cor='#193f41' />
    <mesh position={[0, 0, 0.2]} scale={[0.72, 0.5, 0.22]} material={mat(cor)}><icosahedronGeometry args={[1, 1]} /></mesh>
    <mesh position={[-0.72, 0, 0.2]} rotation={[0, 0, -Math.PI / 2]} material={mat(cor)}><coneGeometry args={[0.38, 0.6, 3]} /></mesh>
    <mesh position={[0.35, 0.12, 0.43]} material={mat(PALETA.caneca)}><circleGeometry args={[0.16, 8]} /></mesh>
    <mesh position={[0.4, 0.12, 0.44]} material={mat('#262b29')}><circleGeometry args={[0.08, 8]} /></mesh>
    <Madeira position={[0, 0.65, 0.2]} tamanho={[1.25, 0.15, 0.35]} cor={PALETA.madeiraClara} />
    <Madeira position={[0, 0.88, 0.2]} tamanho={[0.75, 0.4, 0.35]} cor={PALETA.madeira} />
    <Placa texto={['Cap. Sardinha', 'Dona Tainha', 'Velho Atum'][variante % 3]} largura={1.7} altura={0.35} position={[0, -0.86, 0.2]} />
  </group>;
}
function Boia(props: Grupo) {
  return <group {...props}>
    <mesh material={mat(PALETA.caneca)}><torusGeometry args={[0.9, 0.24, 5, 12]} /></mesh>
    {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, 0, i * Math.PI / 2]}><mesh position={[0, 0.9, 0]} material={mat('#c9553e')}><boxGeometry args={[0.48, 0.42, 0.49]} /></mesh></group>)}
    <mesh material={mat('#bba072')}><torusGeometry args={[1.2, 0.045, 4, 12]} /></mesh>
    <Placa texto='CARDUME' largura={1.5} altura={0.35} position={[0, -1.48, 0.1]} />
  </group>;
}
function Remos(props: Grupo) {
  return <group {...props}>{[-1, 1].map((s) => <group key={s} rotation={[0, 0, s * 0.62]}>
    <Madeira tamanho={[0.13, 3.9, 0.13]} cor={PALETA.madeiraClara} />
    <Madeira position={[0, 1.65, 0]} tamanho={[0.5, 1.2, 0.15]} cor={s === 1 ? '#c66743' : '#d4a34f'} />
  </group>)}</group>;
}
function Rede(props: Grupo) {
  return <group {...props}>
    {Array.from({ length: 7 }, (_, i) => <group key={i}>
      <Corda de={[-1.65 + i * 0.55, -1.4, 0]} para={[-1.65 + i * 0.55, 1.4, 0]} raio={0.025} />
      <Corda de={[-1.65, -1.4 + i * 0.47, 0]} para={[1.65, -1.4 + i * 0.47, 0]} raio={0.025} />
      <mesh position={[-1.65 + i * 0.55, 1.4, 0]} material={mat(i % 2 ? '#d27543' : PALETA.caneca)}><icosahedronGeometry args={[0.15, 0]} /></mesh>
    </group>)}
    <mesh position={[0.3, -0.4, 0.1]} scale={[0.6, 0.25, 0.15]} material={mat('#b3bb9a')}><icosahedronGeometry args={[1, 0]} /></mesh>
  </group>;
}
function Espadarte(props: Grupo) {
  return <group {...props}>
    <Madeira tamanho={[4.5, 1.5, 0.18]} cor={PALETA.madeiraEscura} />
    <mesh position={[0, 0, 0.2]} scale={[1.35, 0.42, 0.22]} material={mat('#58a6a4')}><icosahedronGeometry args={[1, 1]} /></mesh>
    <mesh position={[1.65, 0.08, 0.2]} rotation={[0, 0, -Math.PI / 2]} material={mat('#9cbeb1')}><coneGeometry args={[0.12, 1.5, 5]} /></mesh>
    <mesh position={[-1.5, 0, 0.2]} rotation={[0, 0, Math.PI / 2]} material={mat('#3c747e')}><coneGeometry args={[0.58, 0.8, 3]} /></mesh>
    <mesh position={[0, 0.5, 0.2]} material={mat('#3c747e')}><coneGeometry args={[0.35, 0.6, 3]} /></mesh>
    <mesh position={[0.8, 0.15, 0.43]} material={mat('#202d2a')}><icosahedronGeometry args={[0.08, 0]} /></mesh>
  </group>;
}
function QuadroDoses(props: Grupo) {
  const mapa = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#203f3b'; ctx.fillRect(0, 0, 512, 640);
    ctx.strokeStyle = '#d8c391'; ctx.lineWidth = 3; ctx.strokeRect(20, 20, 472, 600);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f4dda7'; ctx.font = 'bold 48px Georgia';
    ctx.fillText('DOSES DO DIA', 256, 100);
    ctx.font = '30px Georgia';
    ['Uma maré de sabor', '────────────', 'Espuma de onda', 'Rum do naufrágio', 'Licor de coral', '────────────', 'Saúde, cardume!'].forEach((t, i) => ctx.fillText(t, 256, 180 + i * 60));
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <group {...props}>
    <Madeira tamanho={[2.8, 3.5, 0.2]} cor={PALETA.madeiraClara} />
    <mesh position={[0, 0, 0.12]}><planeGeometry args={[2.55, 3.2]} /><meshLambertMaterial map={mapa} /></mesh>
  </group>;
}
function Vaso(props: Grupo) {
  return <group {...props}>
    <Cilindro position={[0, 0.4, 0]} raio={0.57} base={0.4} altura={0.8} cor='#b45e42' />
    <Cilindro position={[0, 0.8, 0]} raio={0.62} altura={0.18} cor='#d18a54' />
    {Array.from({ length: 5 }, (_, i) => <group key={i} position={[Math.sin(i * 2) * 0.25, 0.8, Math.cos(i * 2) * 0.25]} rotation={[0.15 * Math.sin(i), i, 0.2 * Math.cos(i)]}>
      <mesh position={[0.1, 0.9, 0]} scale={[0.22, 1.3 + i % 2 * 0.4, 0.14]} rotation={[0, 0, 0.15]} material={mat(i % 2 ? PALETA.alga : '#678b43')}><icosahedronGeometry args={[1, 1]} /></mesh>
    </group>)}
  </group>;
}
export function Decoracao() {
  return <group>
    {/* Parede focal: a mesma sequência da referência, agora maior e mais cheia. */}
    <Timao position={[3.2, 4.4, -17.5]} scale={1.25} />
    <Escotilha position={[7, 4.25, -17.5]} raio={1.4} />
    <Ancora position={[10.6, 4.35, -17.5]} scale={1.45} />
    <Escotilha position={[14.3, 4.25, -17.5]} raio={1.4} />
    <AlvoDardos position={[19, 4.2, -17.5]} scale={1.15} />
    <Placa texto='Proibido pescar clientes' largura={7} altura={0.7} position={[10.5, 6.7, -17.5]} />
    <Boia position={[22.2, 5.9, -17.45]} scale={0.65} />
    <QuadroDoses position={[-16.8, 4.4, -17.5]} />
    <group position={[-21, 0, -17.45]}>
      <Madeira position={[0, 1.9, 0]} tamanho={[3.2, 3.8, 0.2]} cor='#173d3c' />
      <mesh position={[0, 3.8, 0.12]} material={mat('#173d3c')}><circleGeometry args={[1.6, 10, 0, Math.PI]} /></mesh>
      {[-1, 1].map((s) => <Madeira key={s} position={[s * 1.72, 1.9, 0.2]} tamanho={[0.35, 3.8, 0.5]} cor={PALETA.madeiraClara} />)}
      <mesh position={[0, 3.8, 0.2]} material={mat(PALETA.madeiraClara)}><torusGeometry args={[1.72, 0.18, 4, 10, Math.PI]} /></mesh>
      <Placa texto='Adega do Capitão' largura={2.8} altura={0.45} position={[0, 3.8, 0.4]} />
    </group>
    {ADEGA.dardos.map(([x, z], i) => <group key={z}>
      <AlvoDardos position={[x, 3.65, z]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
      <Placa texto={i ? 'Mira de Tubarão' : 'Dardos do Capitão'} largura={4.3} altura={0.65} position={[x, 5.6, z]} rotation={[0, -Math.PI / 2, 0]} />
      <Madeira position={[21.15, 0.055, z]} tamanho={[0.07, 0.025, 3.1]} cor={PALETA.latao} />
    </group>)}
    <Retrato position={[23.5, 4.2, -14]} rotation={[0, -Math.PI / 2, 0]} />
    <Boia position={[23.5, 4.4, -5.4]} rotation={[0, -Math.PI / 2, 0]} />
    <Espadarte position={[23.5, 5.2, 6.3]} rotation={[0, -Math.PI / 2, 0]} />
    <Rede position={[23.5, 4.2, 11]} rotation={[0, -Math.PI / 2, 0]} />
    <Retrato position={[23.5, 4.8, 15.5]} rotation={[0, -Math.PI / 2, 0]} variante={2} />
    {[-14.4, -4, 6, 15.8].map((z, i) => <group key={z} position={[-23.5, 4.4, z]} rotation={[0, Math.PI / 2, 0]}>
      {i % 2 === 0 ? <Retrato variante={i} /> : <Boia />}
    </group>)}
    <group position={[-14.2, 4.5, 16]} rotation={[0, Math.PI / 2, 0]}><Boia scale={0.8} /></group>
    <Rede position={[-14.2, 4.4, -16]} rotation={[0, Math.PI / 2, 0]} scale={0.8} />
    <group position={[-14.2, 4.1, 6]} rotation={[0, Math.PI / 2, 0]}><Retrato variante={1} scale={0.8} /></group>
    <group position={[-14.2, 4.1, -4]} rotation={[0, Math.PI / 2, 0]}><Retrato variante={2} scale={0.8} /></group>
    {/* Quem olha para a saída também encontra uma parede habitada. */}
    <Remos position={[-20, 4.6, 17.5]} rotation={[0, Math.PI, 0]} />
    <Rede position={[-16, 4.5, 17.5]} rotation={[0, Math.PI, 0]} />
    <Espadarte position={[-10.5, 4.7, 17.5]} rotation={[0, Math.PI, 0]} />
    <Boia position={[-5, 4.8, 17.5]} rotation={[0, Math.PI, 0]} />
    <Retrato position={[5.3, 4.6, 17.5]} rotation={[0, Math.PI, 0]} variante={1} />
    <Placa texto='Aqui a conversa vai longe' largura={5.3} altura={0.75} position={[10, 5.4, 17.5]} rotation={[0, Math.PI, 0]} />
    {BARRIS.map(([x, z], i) => <group key={`${x}/${z}`}>
      <Barril position={[x, 0, z]} scale={1.2} rotation={[0, i * 0.4, 0]} />
      <Garrafa position={[x, 1.56, z]} scale={1.4} />
      {i % 2 === 0 && <Caneca position={[x + 0.3, 1.56, z + 0.3]} scale={1.4} />}
    </group>)}
    {CAIXOTES.map(([x, z], i) => <group key={x} position={[x, 0, z]} rotation={[0, i * 0.12, 0]}>
      <Madeira position={[0, 0.65, 0]} tamanho={[1.3, 1.3, 1.3]} cor={PALETA.madeira} />
      {[-0.55, 0, 0.55].map((s) => <Madeira key={s} position={[s, 0.65, 0.67]} tamanho={[0.08, 1.3, 0.05]} cor={PALETA.madeiraEscura} />)}
      <Madeira position={[0, 0.65, 0.72]} rotation={[0, 0, 0.7]} tamanho={[0.13, 1.6, 0.08]} cor={PALETA.madeiraClara} />
    </group>)}
    {VASOS.map(([x, z]) => <Vaso key={x + z} position={[x, 0, z]} />)}
    {[[-18, -15], [21, -14.8], [10, 15]].map(([x, z]) => <group key={x} position={[x, 0.08, z]} rotation={[Math.PI / 2, 0, 0]}>
      {[0.45, 0.6, 0.75].map((r) => <mesh key={r} material={mat('#c3a470')}><torusGeometry args={[r, 0.06, 4, 10]} /></mesh>)}
    </group>)}
    <Varal de={[13, 6.4, -15.8]} para={[23.3, 6.4, -15.8]} quantidade={10} />
    <Varal de={[-23.4, 6.4, -15]} para={[-14.4, 6.4, -15]} quantidade={10} />
  </group>;
}
