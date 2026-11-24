import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { Aparencia, RoomId } from '@cardume/shared';
import { useApp } from '../store';
import { Fish } from './Fish';
import { Controlador } from './Controlador';
import { alvoRemoto, conectar, desconectar, local, useMundo, type AlvoPeixe } from './mundo';
import { Navio, COLISAO_NAVIO } from './rooms/Navio';
import { Adega, COLISAO_ADEGA } from './rooms/Adega';
import { Hud } from '../hud/Hud';
import '../hud/hud.css';

const COLISOES = { navio: COLISAO_NAVIO, adega: COLISAO_ADEGA };

function useAgora(intervalo = 500) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);
  return agora;
}

function Jogadores({ visitante, aparenciaPropria, nomeProprio }: { visitante: boolean; aparenciaPropria: Aparencia; nomeProprio: string }) {
  const remotos = useMundo((s) => s.remotos);
  const bolhas = useMundo((s) => s.bolhas);
  const voce = useMundo((s) => s.voce);
  const agora = useAgora();
  const alvoLocal = useRef<AlvoPeixe>(local);
  const bolha = (id: string | null) => (id && bolhas[id] && bolhas[id].ate > agora ? bolhas[id].texto : null);

  return (
    <>
      {!visitante && <Fish aparencia={aparenciaPropria} alvo={alvoLocal} nome={nomeProprio} bolha={bolha(voce)} destaque />}
      {Object.entries(remotos).map(([id, info]) => (
        <Fish key={id} aparencia={info.aparencia} alvo={() => alvoRemoto(id)} nome={info.nome} bolha={bolha(id)} />
      ))}
    </>
  );
}

function Sala({ sala }: { sala: RoomId }) {
  return sala === 'adega' ? <Adega /> : <Navio />;
}

export function Game() {
  const visitante = useApp((s) => s.visitante);
  const usuario = useApp((s) => s.usuario);
  const sala = useMundo((s) => s.sala);
  const entrada = useMundo((s) => s.entrada);

  useEffect(() => {
    conectar(visitante);
    return () => desconectar();
  }, [visitante]);

  const aparencia: Aparencia = usuario?.aparencia ?? { tipo: 'modelo', modelo: 'palhaco' };

  return (
    <div className="jogo">
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        camera={{ fov: 50, near: 0.1, far: 200, position: [0, 6, 20] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Suspense fallback={null}>
          <Sala key={entrada} sala={sala} />
          <Jogadores visitante={visitante} aparenciaPropria={aparencia} nomeProprio={usuario?.username ?? ''} />
          <Controlador sala={sala} colisao={COLISOES[sala]} visitante={visitante} />
        </Suspense>
      </Canvas>
      <Hud />
    </div>
  );
}
