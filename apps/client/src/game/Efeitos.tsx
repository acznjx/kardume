import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, HueSaturation, N8AO, SMAA, Vignette } from '@react-three/postprocessing';
import { create } from 'zustand';
import type { RoomId } from '@cardume/shared';
import { definirCausticas } from './style/materials';
import { avisar } from './mundo';

export type Qualidade = 'bonito' | 'leve';

function lerQualidade(): Qualidade {
  try {
    return localStorage.getItem('cardume-graficos') === 'leve' ? 'leve' : 'bonito';
  } catch {
    return 'bonito';
  }
}

function salvarQualidade(q: Qualidade) {
  try {
    localStorage.setItem('cardume-graficos', q);
  } catch {
    /* sem storage, tudo bem */
  }
}

/** Máximo de pixels renderizados por quadro (a tela pode ser enorme; a placa de vídeo, não). */
const ORCAMENTO_PIXELS = { bonito: 2_600_000, leve: 1_300_000 };

/** Densidade de pixels que cabe no orçamento: nunca acima da tela, nem do limite da qualidade. */
export function dprPara(qualidade: Qualidade, fator = 1) {
  const tela = window.devicePixelRatio || 1;
  const cabe = Math.sqrt(ORCAMENTO_PIXELS[qualidade] / Math.max(1, window.innerWidth * window.innerHeight));
  const teto = qualidade === 'bonito' ? 1.5 : 1;
  return Math.max(0.6, Math.min(tela, teto, cabe) * fator);
}

interface GraficosState {
  qualidade: Qualidade;
  /** redução automática de resolução quando o FPS cai (1 = sem redução) */
  fator: number;
  alternar: () => void;
  reduzir: () => void;
}

export const useGraficos = create<GraficosState>((set, get) => ({
  qualidade: lerQualidade(),
  fator: 1,
  alternar: () => {
    const qualidade: Qualidade = get().qualidade === 'bonito' ? 'leve' : 'bonito';
    salvarQualidade(qualidade);
    set({ qualidade, fator: 1 });
  },
  reduzir: () => {
    const { fator, qualidade } = get();
    if (fator > 0.7) return set({ fator: Math.round((fator - 0.15) * 100) / 100 });
    if (qualidade === 'bonito') {
      salvarQualidade('leve');
      set({ qualidade: 'leve', fator: 1 });
      avisar('O aquário estava pesado para este computador: mudei os gráficos para "leve".');
    }
  },
}));

/** Liga as cáusticas no navio (luz do sol filtrada pela água) e desliga dentro da adega. */
function Causticas({ sala }: { sala: RoomId }) {
  useFrame(({ clock }) => definirCausticas(clock.elapsedTime, sala === 'navio' ? 0.9 : 0));
  return null;
}

/**
 * Pós-processamento: oclusão de ambiente (as sombras macias nos cantos e embaixo das coisas,
 * como na imagem de referência), brilho suave nas lâmpadas, um pouco mais de cor e vinheta.
 * Antisserrilhamento por SMAA (barato) em vez de multisampling, que custa muita memória de vídeo.
 * No modo "leve" fica só a cena crua. Se o FPS cair, a resolução e depois a qualidade baixam sozinhas.
 */
export function Efeitos({ sala }: { sala: RoomId }) {
  const qualidade = useGraficos((s) => s.qualidade);
  const reduzir = useGraficos((s) => s.reduzir);
  // só mede o FPS depois que a sala carregou (a compilação dos shaders na entrada derruba o FPS por uns segundos)
  const [medindo, setMedindo] = useState(false);
  useEffect(() => {
    setMedindo(false);
    const t = setTimeout(() => setMedindo(true), 8000);
    return () => clearTimeout(t);
  }, [sala, qualidade]);
  return (
    <>
      <Causticas sala={sala} />
      {medindo && <PerformanceMonitor bounds={() => [24, 50]} flipflops={3} onDecline={reduzir} />}
      {qualidade === 'bonito' && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO
            quality="low"
            aoRadius={sala === 'adega' ? 1.6 : 2.4}
            distanceFalloff={1}
            intensity={sala === 'adega' ? 2.6 : 2}
            color="#0e2a2c"
            halfRes
          />
          <Bloom luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.5} mipmapBlur levels={5} />
          <HueSaturation saturation={0.12} />
          <Vignette offset={0.32} darkness={0.55} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}
