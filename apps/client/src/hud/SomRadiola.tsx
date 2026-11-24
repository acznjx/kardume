import { useEffect, useRef } from 'react';
import { FAIXA_POR_ID } from '@cardume/shared';
import { useMundo } from '../game/mundo';
import { definirFonteMusica } from '../game/musica';
import { criarMotorRadiola, destravarAudio, type MotorRadiola } from '../game/audio/radiola';
import { eventosVolume, lerVolume } from './Javas';

/**
 * Toca a Radiola das Marés para quem está no bar, sincronizada pelo horário de início do servidor.
 * Fora do bar, silêncio. O áudio só pode começar depois de um clique/tecla (regra dos navegadores).
 */
export function SomRadiola() {
  const motor = useRef<MotorRadiola | null>(null);
  const tocando = useRef<string | null>(null);
  const sala = useMundo((s) => s.sala);
  const radiola = useMundo((s) => s.radiola);

  // cria o motor uma vez e libera o áudio no primeiro gesto do jogador
  useEffect(() => {
    const m = criarMotorRadiola();
    motor.current = m;
    m.definirVolume(lerVolume());
    definirFonteMusica(m);
    const gesto = () => destravarAudio();
    const volume = () => m.definirVolume(lerVolume());
    window.addEventListener('pointerdown', gesto);
    window.addEventListener('keydown', gesto);
    eventosVolume.addEventListener('mudou', volume);
    return () => {
      window.removeEventListener('pointerdown', gesto);
      window.removeEventListener('keydown', gesto);
      eventosVolume.removeEventListener('mudou', volume);
      definirFonteMusica(null);
      m.destruir();
      motor.current = null;
      tocando.current = null;
    };
  }, []);

  // segue a faixa do servidor
  useEffect(() => {
    const m = motor.current;
    if (!m) return;
    if (sala !== 'adega' || !radiola) {
      if (tocando.current) m.parar();
      tocando.current = null;
      return;
    }
    const chave = `${radiola.faixa}@${radiola.inicioLocal}`;
    if (tocando.current === chave) return;
    const faixa = FAIXA_POR_ID.get(radiola.faixa);
    const posicao = (Date.now() - radiola.inicioLocal) / 1000;
    if (!faixa || posicao >= faixa.duracao) {
      m.parar();
      tocando.current = null;
      return;
    }
    m.tocar(radiola.faixa, Math.max(0, posicao));
    tocando.current = chave;
  }, [sala, radiola]);

  return null;
}
