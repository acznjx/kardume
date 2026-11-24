import { ADEGA, SALA_ADEGA } from '@cardume/shared';
import { Garrafa, Placa } from '../../props/props';
import { mat, PALETA } from '../../style/materials';
import { CanecaTaverna as Caneca, Cilindro, Madeira, Pendente, Vela } from './Pecas';

export function Balcao() {
  const b = ADEGA.balcao;
  const largura = b.x1 - b.x0;
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  return <group>
    <Madeira position={[cx, 0.83, cz]} tamanho={[largura, 1.66, 2]} cor={PALETA.madeiraEscura} />
    {Array.from({ length: 25 }, (_, i) => <Madeira key={i} position={[b.x0 + (i + 0.5) * largura / 25, 0.83, b.z1 + 0.03]} tamanho={[largura / 25 - 0.035, 1.6, 0.14]} cor={i % 3 ? PALETA.madeira : PALETA.madeiraClara} />)}
    <Madeira position={[cx, b.altura - 0.12, cz]} tamanho={[largura + 0.4, 0.24, 2.44]} cor={PALETA.madeiraClara} />
    {[0.19, 1.45].map((y) => <Madeira key={y} position={[cx, y, b.z1 + 0.15]} tamanho={[largura + 0.2, 0.12, 0.14]} cor={PALETA.madeiraEscura} />)}
    <Cilindro position={[cx, 0.38, b.z1 + 0.4]} rotation={[0, 0, Math.PI / 2]} raio={0.055} altura={largura} cor={PALETA.latao} />
    {[-12, -8.2, -4.4, 0].map((x) => <group key={x}>
      <Garrafa scale={1.65} position={[x, b.altura, cz - 0.25]} />
      <Caneca scale={1.7} position={[x + 0.6, b.altura, cz + 0.25]} />
      <Vela position={[x - 0.35, b.altura, cz + 0.65]} />
    </group>)}
    <Prateleiras />
    {[-11, -5, 1].map((x) => <Pendente key={x} x={x} z={-12.4} y={5.3} mesa={false} />)}
    {SALA_ADEGA.interacoes.map((p) => <mesh key={p.id} name={p.id} position={[p.pos[0], 0.055, p.pos[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#c4964b', { emissivo: '#c4964b', intensidade: 0.18 })}><ringGeometry args={[0.5, 0.55, 10]} /></mesh>)}
  </group>;
}
function Prateleiras() {
  return <group>
    <Madeira position={[-6, 3.1, -17.65]} tamanho={[14.5, 6.2, 0.35]} cor={PALETA.madeiraEscura} />
    {[-13, -9.5, -6, -2.5, 1].map((x) => <Madeira key={x} position={[x, 3, -17.15]} tamanho={[0.26, 6, 1.1]} />)}
    {[1.55, 3.05, 4.55].map((y, linha) => <group key={y}>
      <Madeira position={[-6, y - 0.1, -17.1]} tamanho={[14.3, 0.2, 1.15]} cor={PALETA.madeiraClara} />
      {Array.from({ length: 15 }, (_, i) => {
        const x = -12.5 + i * 0.93;
        return (i + linha) % 4 === 0 ? <Caneca key={i} scale={1.8} position={[x, y, -17.05]} /> : <Garrafa key={i} scale={1.6} position={[x, y, -17.05]} cor={['#4f8a3c', '#3b7137', '#78953e'][(i + linha) % 3]} />;
      })}
    </group>)}
    <Madeira position={[-6, 5.9, -17.1]} tamanho={[15.2, 0.35, 1.4]} />
    <Placa texto='BAR DO CARDUME' fonte='Arial Black' largura={13.5} altura={1.35} position={[-6, 6.75, -16.85]} />
    <Placa texto='Fiado só com Anzol Reconhecido' largura={8.2} altura={0.6} position={[-6, 0.9, -11.94]} />
  </group>;
}
