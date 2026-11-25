import { Estatico } from '../props/Estatico';
import { Balcao } from './adega/Balcao';
import { CoresSolidas } from './adega/CoresSolidas';
import { Barman } from './adega/Barman';
import { Cabines } from './adega/Cabines';
import { Casco, Decoracao, Iluminacao } from './adega/Ambiente';
import { Mesas, Banquetas } from './adega/Mobiliario';
import { Palco, Pista } from './adega/Pista';
import { Dardos3D } from './adega/Dardos3D';

export { COLISAO_ADEGA } from './adega/colisao';

/** Uma taverna de 48 × 36, dividida em recantos sob vigas baixas. */
export function Adega() {
  return <group name='bar-do-cardume'>
    <color attach='background' args={['#214e4d']} />
    <fog attach='fog' args={['#214e4d', 38, 85]} />
    <Iluminacao />
    {/* AO e discos de contato dão profundidade sem mapas de sombra adicionais. */}
    <Estatico sombra={false}><CoresSolidas><Casco /></CoresSolidas></Estatico>
    <Estatico sombra={false}>
      <CoresSolidas>
        <Balcao /><Mesas /><Banquetas /><Cabines /><Palco /><Decoracao />
      </CoresSolidas>
    </Estatico>
    <Pista />
    <Dardos3D />
    <Barman />
  </group>;
}
