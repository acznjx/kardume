import { NAVIO, SALA_NAVIO } from '@cardume/shared';
import { Estatico } from '../props/Estatico';
import { LuzSolar } from '../props/LuzSolar';
import { Bolhas } from '../props/props';
import { Caminhos, FundoMarinho, Vegetacao } from './navio/ambiente';
import { GarrafaMensagem, Naufragio, Porao, Sino } from './navio/naufragio';
import { Anfiteatro, Arcos, EntradaAdega, Jardim, LuzesDosCaminhos, Praca } from './navio/zonas';
import { CardumeDecorativo, RaiosSuaves } from './navio/vida';
import { CorrentesMarinhas } from './navio/correntes';
import { Descobertas } from './navio/exteriores';
export { COLISAO_NAVIO } from './navio/colisaoNavio';
/** Clareiras para encontros, recifes para enquadrar e um naufrágio para explorar. */
export function Navio() {
  const [px, pz] = NAVIO.praca.centro;
  return <>
    <color attach="background" args={['#205e68']} />
    <fog attach="fog" args={['#205e68', 60, 205]} />
    <hemisphereLight args={['#a4d9d1', '#6c4930', 1.05]} />
    <LuzSolar intensidade={1.35} alcance={42} />
    <Estatico>
      <FundoMarinho /><Caminhos /><Descobertas /><Naufragio /><Porao /><Sino />
      <Praca /><Anfiteatro /><EntradaAdega /><Jardim /><Arcos /><LuzesDosCaminhos /><GarrafaMensagem />
    </Estatico>
    {/* Cinco luzes reais; as demais lanternas são peças emissivas mescladas. */}
    <pointLight position={[-18, 4.7, -5]} color="#ffb95c" intensity={44} distance={22} decay={1.5} />
    <pointLight position={[3, 4.7, -5]} color="#ffb95c" intensity={44} distance={22} decay={1.5} />
    <pointLight position={[23, 4.7, -5]} color="#ffb95c" intensity={44} distance={22} decay={1.5} />
    <pointLight position={[SALA_NAVIO.porta.pos[0], 3.2, SALA_NAVIO.porta.pos[2] + 1.5]} color="#ffb95c" intensity={65} distance={18} decay={1.5} />
    <pointLight position={[px, 4, pz]} color="#7ee0c2" intensity={20} distance={12} decay={1.5} />
    <Vegetacao /><CorrentesMarinhas />
    <CardumeDecorativo centro={[-35, 10, 39]} cor="#e6b64a" />
    <CardumeDecorativo centro={[73, 15, -39]} cor="#8dc5c0" fase={2.1} />
    <CardumeDecorativo centro={[-43, 12, -54]} cor="#e48e5d" fase={4.2} />
    <Estatico sombra={false}><RaiosSuaves /></Estatico>
    <Bolhas quantidade={240} area={252} altura={49} />
    <group position={[px, 2.8, pz]}><Bolhas quantidade={28} area={1.5} altura={11} /></group>
  </>;
}
