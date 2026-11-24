/**
 * Dardos do Javas — regras compartilhadas entre client (mira na tela) e servidor (pontuação).
 *
 * O alvo é um círculo de raio 1 (borda externa do anel duplo), com x para a direita e y para cima.
 * Medidas de um alvo de verdade, normalizadas pelo raio do anel duplo (170 mm).
 */

export const ALVO = {
  mosca: 6.35 / 170,
  bull: 15.9 / 170,
  trioInterno: 99 / 170,
  trioExterno: 107 / 170,
  duploInterno: 162 / 170,
  duploExterno: 1,
} as const;

/** Setores no sentido horário a partir do topo (20 em cima). */
export const SETORES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const;

export const DARDOS_POR_RODADA = 3;
/** a rodada acaba sozinha se o jogador ficar parado */
export const RODADA_TIMEOUT_MS = 30_000;

export interface Acerto {
  pontos: number;
  /** "D20", "T19", "S5", "MOSCA", "25" ou "FORA" */
  rotulo: string;
}

export function pontuarDardo(x: number, y: number): Acerto {
  const r = Math.hypot(x, y);
  if (r > ALVO.duploExterno) return { pontos: 0, rotulo: 'FORA' };
  if (r <= ALVO.mosca) return { pontos: 50, rotulo: 'MOSCA' };
  if (r <= ALVO.bull) return { pontos: 25, rotulo: '25' };
  // ângulo a partir do topo, no sentido horário; cada setor tem 18° centrado no seu número
  let ang = (Math.atan2(x, y) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  const setor = SETORES[Math.floor(((ang + 9) % 360) / 18)];
  if (r >= ALVO.trioInterno && r <= ALVO.trioExterno) return { pontos: setor * 3, rotulo: `T${setor}` };
  if (r >= ALVO.duploInterno) return { pontos: setor * 2, rotulo: `D${setor}` };
  return { pontos: setor, rotulo: `S${setor}` };
}

/** PRNG pequeno e determinístico para as fases da mira. */
function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Onde a mira está no instante `t` (segundos desde o início da rodada).
 * Figura de Lissajous lenta + tremidinha; a bebida acelera e aumenta o tremor.
 * Determinística: client e servidor calculam o mesmo ponto com a mesma semente.
 */
export function miraEm(t: number, semente: number, bebida = 0) {
  const r = aleatorio(semente);
  const fx = 0.9 + r() * 0.5;
  const fy = 1.25 + r() * 0.5;
  const px = r() * Math.PI * 2;
  const py = r() * Math.PI * 2;
  const b = Math.max(0, Math.min(5, bebida));
  const vel = 1 + b * 0.18;
  const amp = 0.78 + b * 0.05;
  const tremor = 0.035 + b * 0.03;
  const x = amp * Math.sin(t * fx * vel + px) + tremor * Math.sin(t * 13.7 + px * 3);
  const y = amp * Math.sin(t * fy * vel + py) + tremor * Math.cos(t * 11.3 + py * 2);
  return { x, y };
}
