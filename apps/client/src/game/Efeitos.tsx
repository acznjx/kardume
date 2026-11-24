import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, HueSaturation, N8AO, Vignette } from '@react-three/postprocessing';
import { create } from 'zustand';
import type { RoomId } from '@cardume/shared';
import { definirCausticas } from './style/materials';

export type Qualidade = 'bonito' | 'leve';

function lerQualidade(): Qualidade {
  try {
    return localStorage.getItem('cardume-graficos') === 'leve' ? 'leve' : 'bonito';
  } catch {
    return 'bonito';
  }
}

export const useGraficos = create<{ qualidade: Qualidade; alternar: () => void }>((set, get) => ({
  qualidade: lerQualidade(),
  alternar: () => {
    const qualidade: Qualidade = get().qualidade === 'bonito' ? 'leve' : 'bonito';
    try {
      localStorage.setItem('cardume-graficos', qualidade);
    } catch {
      /* sem storage, tudo bem */
    }
    set({ qualidade });
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
 * No modo "leve" fica só a cena crua.
 */
export function Efeitos({ sala }: { sala: RoomId }) {
  const qualidade = useGraficos((s) => s.qualidade);
  return (
    <>
      <Causticas sala={sala} />
      {qualidade === 'bonito' && (
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <N8AO aoRadius={sala === 'adega' ? 1.6 : 2.4} distanceFalloff={1} intensity={sala === 'adega' ? 2.6 : 2} color="#0e2a2c" halfRes />
          <Bloom luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.55} mipmapBlur />
          <HueSaturation saturation={0.12} />
          <Vignette offset={0.32} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  );
}
