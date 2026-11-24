import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Aparencia, RoomId } from '@cardume/shared';
import { useApp } from '../store';
import { Fish } from './Fish';
import { Controlador } from './Controlador';
import { alvoRemoto, conectar, desconectar, local, useMundo, type AlvoPeixe } from './mundo';
import { Navio, COLISAO_NAVIO } from './rooms/Navio';
import { Adega, COLISAO_ADEGA } from './rooms/Adega';
import { Hud } from '../hud/Hud';
import { Contencao } from '../Contencao';
import { Efeitos, dprPara, useGraficos } from './Efeitos';
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

function Jogadores({
  visitante,
  aparenciaPropria,
  nomeProprio,
}: {
  visitante: boolean;
  aparenciaPropria: Aparencia;
  nomeProprio: string;
}) {
  const remotos = useMundo((s) => s.remotos);
  const bolhas = useMundo((s) => s.bolhas);
  const emotes = useMundo((s) => s.emotes);
  const brindes = useMundo((s) => s.brindes);
  const voce = useMundo((s) => s.voce);
  const agora = useAgora();
  const alvoLocal = useRef<AlvoPeixe>(local);
  const bolha = (id: string | null) => (id && bolhas[id] && bolhas[id].ate > agora ? bolhas[id].texto : null);
  const emote = (id: string | null) => (id && emotes[id] && emotes[id].ate > agora ? emotes[id].tipo : null);
  const brinde = (id: string | null) => !!(id && brindes[id] && brindes[id] > agora);

  return (
    <>
      {!visitante && (
        <Fish
          aparencia={aparenciaPropria}
          alvo={alvoLocal}
          nome={nomeProprio}
          bolha={bolha(voce)}
          emote={emote(voce)}
          brinde={brinde(voce)}
          destaque
        />
      )}
      {Object.entries(remotos).map(([id, info]) => (
        <Fish
          key={id}
          aparencia={info.aparencia}
          alvo={() => alvoRemoto(id)}
          nome={info.nome}
          bolha={bolha(id)}
          emote={emote(id)}
          brinde={brinde(id)}
        />
      ))}
    </>
  );
}

/** Só em desenvolvimento: expõe o renderizador para medir memória da placa de vídeo nos testes. */
function Diagnostico() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __cardume?: Record<string, unknown> };
    w.__cardume = { ...(w.__cardume ?? {}), gl };
  }, [gl]);
  return null;
}

function Sala({ sala }: { sala: RoomId }) {
  return sala === 'adega' ? <Adega /> : <Navio />;
}

export function Game() {
  const visitante = useApp((s) => s.visitante);
  const usuario = useApp((s) => s.usuario);
  const sala = useMundo((s) => s.sala);
  const entrada = useMundo((s) => s.entrada);
  const qualidade = useGraficos((s) => s.qualidade);
  const fator = useGraficos((s) => s.fator);
  const [gpuCaiu, setGpuCaiu] = useState(false);

  useEffect(() => {
    conectar(visitante);
    return () => desconectar();
  }, [visitante]);

  const aparencia: Aparencia = usuario?.aparencia ?? { tipo: 'modelo', modelo: 'palhaco' };

  return (
    <div className="jogo">
      <Contencao
        reserva={
          <div className="carregando">
            <div style={{ textAlign: 'center' }}>
              O aquário deu uma engasgada.
              <br />
              <button onClick={() => window.location.reload()} style={{ marginTop: 14 }}>
                recarregar
              </button>
            </div>
          </div>
        }
      >
        <Canvas
          key={qualidade}
          shadows={qualidade === 'bonito' ? 'soft' : false}
          dpr={dprPara(qualidade, fator)}
          camera={{ fov: 52, near: 0.1, far: 320, position: [0, 6, 20] }}
          gl={{
            // o antisserrilhamento fica com o SMAA do pós-processamento (no "leve", com o do navegador)
            antialias: qualidade === 'leve',
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            // se a placa de vídeo reiniciar, mostra "recarregar" em vez de deixar a tela morta
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setGpuCaiu(true);
            });
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Suspense fallback={null}>
            <Sala key={entrada} sala={sala} />
            <Efeitos sala={sala} />
            <Diagnostico />
            <Jogadores
              visitante={visitante}
              aparenciaPropria={aparencia}
              nomeProprio={usuario?.username ?? ''}
            />
            <Controlador sala={sala} colisao={COLISOES[sala]} visitante={visitante} />
          </Suspense>
        </Canvas>
      </Contencao>
      <Hud />
      {gpuCaiu && (
        <div className="carregando" style={{ zIndex: 60 }}>
          <div style={{ textAlign: 'center', maxWidth: 420, padding: 16 }}>
            A placa de vídeo pediu arrego e reiniciou.
            <br />
            Experimente os gráficos no modo leve.
            <br />
            <button
              onClick={() => {
                if (useGraficos.getState().qualidade === 'bonito') useGraficos.getState().alternar();
                window.location.reload();
              }}
              style={{ marginTop: 14 }}
            >
              recarregar no modo leve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
