/**
 * Ponto único de acesso à música da Radiola para quem só quer reagir a ela (luzes, pista de dança).
 * O motor de áudio fica em ./audio/radiola.ts; quem toca é o componente SomRadiola (HUD/jogo).
 */
type Fonte = { nivel(): number; batida(): number } | null;
let fonte: Fonte = null;

export function definirFonteMusica(f: Fonte) {
  fonte = f;
}

/** 0..1: intensidade atual da música (0 se não houver música tocando) */
export function nivelMusica() {
  return fonte ? fonte.nivel() : 0;
}

/** 0..1: pulso que vai a 1 em cada batida e decai (0 sem música) */
export function batidaMusica() {
  return fonte ? fonte.batida() : 0;
}
