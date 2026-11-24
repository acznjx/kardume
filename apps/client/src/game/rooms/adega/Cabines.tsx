import { ADEGA } from '@cardume/shared';
import { Placa } from '../../props/props';
import { EscotilhaMar as Escotilha } from './Nautica';
import { PALETA } from '../../style/materials';
import { ASSENTOS_ADEGA, BANCOS_CABINES, ENCOSTOS_CABINES } from './medidas';
import { Bebidas, Madeira, Pendente, Tapete } from './Pecas';

export function Cabines() {
  return <group>
    {BANCOS_CABINES.map((b, i) => <group key={i}>
      <Madeira position={[(b.min[0] + b.max[0]) / 2, 0.42, (b.min[1] + b.max[1]) / 2]} tamanho={[b.max[0] - b.min[0], 0.84, b.max[1] - b.min[1]]} cor={PALETA.madeiraEscura} />
      <Madeira position={[(b.min[0] + b.max[0]) / 2, 0.945, (b.min[1] + b.max[1]) / 2]} tamanho={[b.max[0] - b.min[0], 0.21, b.max[1] - b.min[1]]} cor='#a54e3f' />
    </group>)}
    {ENCOSTOS_CABINES.map((b, i) => <Madeira key={i} position={[(b.min[0] + b.max[0]) / 2, b.topo / 2, (b.min[1] + b.max[1]) / 2]} tamanho={[b.max[0] - b.min[0], b.topo, b.max[1] - b.min[1]]} cor={i % 3 === 0 ? '#873d32' : PALETA.madeiraEscura} />)}
    {ASSENTOS_ADEGA.filter((a) => a.id.startsWith('cabine')).map((a) => <Madeira key={a.id} name={a.id} position={[a.pos[0], a.pos[1] - 0.1, a.pos[2]]} tamanho={[1.18, 0.2, 1.16]} cor='#be7051' />)}
    {ADEGA.cabines.map(([x, z], i) => <group key={z}>
      <Tapete x={x + 1} z={z} largura={7} profundidade={7.3} cor='#315f61' />
      <Madeira position={[x + 0.6, ADEGA.alturaMesa - 0.12, z]} tamanho={[2.4, 0.24, 2.3]} cor={PALETA.madeiraClara} />
      <Madeira position={[x + 0.6, 0.8, z]} tamanho={[0.45, 1.6, 0.45]} />
      <Bebidas position={[x + 0.6, ADEGA.alturaMesa + 0.02, z]} />
      <Escotilha position={[-23.6, 4.6, z]} rotation={[0, Math.PI / 2, 0]} raio={1.15} />
      <Placa texto={['Recanto do Anzol', 'Conversa de Pescador', 'Mesa dos Náufragos'][i]} largura={5.5} altura={0.65} position={[-23.5, 6.4, z]} rotation={[0, Math.PI / 2, 0]} />
      <Pendente x={x + 0.6} z={z} y={4.9} />
    </group>)}
  </group>;
}
