/**
 * NAVIO NAUFRAGADO (hub) — medidas e lugares (compartilhado entre client e servidor).
 * Quem desenha a sala é apps/client/src/game/rooms/Navio.tsx (+ rooms/navio/).
 */
import { yawPara, type Assento, type DefinicaoSala, type PontoInteracao, type V3 } from './tipos';

export const NAVIO = {
  /** casco: comprimento no eixo X */
  casco: { x0: -32, x1: 32, z0: -12, z1: 12, conves: 8 },
  /** escotilha quebrada: abertura real entre o convés e o porão */
  escotilha: { x0: 3.5, x1: 10.5, z0: 1, z1: 5 },
  /** buracos no casco para o porão (no lado +Z), com altura livre */
  buracos: [
    { x0: 6, x1: 13, altura: 5 },
    { x0: -16, x1: -10, altura: 5 },
  ],
  mastros: [
    { x: -12, z: 0, altura: 38, cesto: 22 },
    { x: 16, z: 0, altura: 34, cesto: 26 },
  ],
  praca: { centro: [0, 66] as const, raio: 12 },
  anfiteatro: { centro: [-62, 51] as const, palcoRaio: 5, degraus: [9, 12, 15], alturaDegrau: 0.8 },
  adega: { fachada: [68, 42] as const },
  jardim: { centro: [-62, -40] as const },
  arcos: [
    [64, -44, 5],
    [80, -57, 14],
    [94, -43, 25],
  ] as const,
  mirante: { x0: 54, x1: 64, z0: -6, z1: 6, altura: 13 },
  perola: { centro: [-30, -77] as const },
  peixaria: { centro: [57, 82] as const },
} as const;

function assentosNavio(): Assento[] {
  const lista: Assento[] = [];
  // anfiteatro: degraus em arco virados para o palco
  const [ax, az] = NAVIO.anfiteatro.centro;
  NAVIO.anfiteatro.degraus.forEach((r, d) => {
    const y = (d + 1) * NAVIO.anfiteatro.alturaDegrau;
    const passo = 2.4 / r; // ~2.4 unidades entre assentos
    for (let a = Math.PI * 0.55; a <= Math.PI * 1.45 + 1e-6; a += passo) {
      const pos: V3 = [ax + Math.cos(a) * r, y, az + Math.sin(a) * r];
      lista.push({ id: `anf${d}-${lista.length}`, sala: 'navio', pos, yaw: yawPara(pos, [ax, y, az]) });
    }
  });
  // praça: bancos em anel
  const [px, pz] = NAVIO.praca.centro;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const pos: V3 = [px + Math.cos(a) * 9.5, 0.7, pz + Math.sin(a) * 9.5];
    lista.push({ id: `praca-${i}`, sala: 'navio', pos, yaw: yawPara(pos, [px, 0.7, pz]) });
  }
  // convés: bancos nas bordas, olhando para o centro do navio
  const { x0, x1, z0, z1, conves } = NAVIO.casco;
  for (let x = x0 + 6; x <= x1 - 8; x += 7) {
    if (Math.abs(x - NAVIO.mastros[0].x) < 3 || Math.abs(x - NAVIO.mastros[1].x) < 3) continue;
    lista.push({ id: `conves-n${x}`, sala: 'navio', pos: [x, conves + 0.7, z0 + 1.6], yaw: 0 });
    lista.push({ id: `conves-s${x}`, sala: 'navio', pos: [x, conves + 0.7, z1 - 1.6], yaw: Math.PI });
  }
  lista.push({ id: 'perola-0', sala: 'navio', pos: [NAVIO.perola.centro[0] - 4, 0.7, NAVIO.perola.centro[1] + 8], yaw: Math.PI });
  return lista;
}

const interacoesNavio = (): PontoInteracao[] => [
  { id: 'sino', sala: 'navio', tipo: 'sino', pos: [0, NAVIO.casco.conves, -5], raio: 4.5 },
  { id: 'garrafa', sala: 'navio', tipo: 'garrafa', pos: [8, 0, 62], raio: 3 },
  { id: 'quadro', sala: 'navio', tipo: 'quadro', pos: [-22, 0.3, -9], raio: 3.5 },
];

export const SALA_NAVIO: DefinicaoSala = {
  id: 'navio',
  nome: 'Navio Naufragado',
  limites: { min: [-130, 0.4, -110], max: [130, 52, 110] },
  spawn: [0, 1.2, 76],
  /** porta da adega (entrada na rocha) */
  porta: { pos: [NAVIO.adega.fachada[0], 0, NAVIO.adega.fachada[1] + 3], raio: 3.4, exigeEmPe: true },
  /** onde se aparece ao voltar da adega */
  chegada: [NAVIO.adega.fachada[0], 0.9, NAVIO.adega.fachada[1] + 10],
  assentos: assentosNavio(),
  interacoes: interacoesNavio(),
  // Mãos únicas separadas: entradas ao alcance de quem nada junto à areia.
  // As últimas tangentes descem suavemente e soltam o peixe fora das construções.
  correntes: [
    { id: 'praca-conves', raio: 2.8, velocidade: 22, pontos: [[-6, 3, 52], [-9, 4, 44], [-10, 6, 34], [-10, 9, 24], [-9, 11, 16], [-7, 11, 9], [-5, 10, 5]] },
    { id: 'conves-praca', raio: 2.8, velocidade: 22, pontos: [[17, 10, 16], [18, 9, 24], [17, 7, 34], [13, 5, 43], [8, 3, 51]] },
    { id: 'praca-adega', raio: 2.8, velocidade: 22, pontos: [[15, 3, 63], [26, 4, 61], [38, 6, 58], [49, 6, 55], [58, 4, 53], [64, 3, 52]] },
    { id: 'adega-praca', raio: 2.8, velocidade: 22, pontos: [[56, 3, 44], [49, 4, 44], [38, 6, 45], [26, 6, 48], [17, 4, 52], [12, 3, 55]] },
    { id: 'praca-concha', raio: 2.8, velocidade: 22, pontos: [[-15, 3, 68], [-25, 4, 69], [-36, 6, 68], [-46, 6, 65], [-54, 4, 61], [-59, 3, 59]] },
    { id: 'navio-jardim', raio: 2.8, velocidade: 22, pontos: [[-14, 3, -19], [-23, 4, -23], [-33, 6, -28], [-43, 6, -32], [-50, 4, -35], [-54, 3, -35]] },
    { id: 'navio-arcos', raio: 2.8, velocidade: 22, pontos: [[25, 3, -20], [34, 5, -25], [43, 7, -29], [52, 7, -33], [60, 5, -36], [64, 3, -39]] },
  ],
};
