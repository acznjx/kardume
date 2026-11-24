export const ROOMS = {
  navio: {
    id: 'navio',
    nome: 'Navio Naufragado',
    // limites do volume nadável (x, y, z)
    min: [-38, 0.4, -38],
    max: [38, 18, 38],
    spawn: [0, 1.2, 16],
  },
  adega: {
    id: 'adega',
    nome: 'Bar do Cardume',
    min: [-12.5, 0.4, -8.6],
    max: [12.5, 6.2, 10.5],
    spawn: [0, 0.9, 8.5],
  },
} as const satisfies Record<
  string,
  { id: string; nome: string; min: readonly number[]; max: readonly number[]; spawn: readonly number[] }
>;

export type RoomId = keyof typeof ROOMS;
export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

type V3 = readonly [number, number, number];

/** Portas entre salas: onde ficam, raio de ativação e onde o peixe aparece do outro lado. */
export const PORTAS: Record<RoomId, { para: RoomId; pos: V3; raio: number; exigeEmPe: boolean; chegada: V3 }> = {
  navio: { para: 'adega', pos: [9, 0, 3], raio: 2.6, exigeEmPe: true, chegada: [0, 0.9, 6] },
  adega: { para: 'navio', pos: [0, 0, 10.2], raio: 2.4, exigeEmPe: false, chegada: [9, 0.9, 6.5] },
};

/** Pontos de interação. */
export const PONTOS = {
  balcao: { sala: 'adega' as RoomId, pos: [-5, 0, -3.4] as V3, raio: 3.4 },
  sino: { sala: 'navio' as RoomId, pos: [-1.2, 4.6, -9.5] as V3, raio: 4.5 },
  garrafa: { sala: 'navio' as RoomId, pos: [-6, 0, 9] as V3, raio: 3 },
};

export function distancia(a: readonly number[], b: readonly number[], ignorarY = false) {
  const dx = a[0] - b[0];
  const dy = ignorarY ? 0 : a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const LIMITES = {
  usernameMin: 3,
  usernameMax: 20,
  senhaMin: 6,
  chatMax: 120,
  /** velocidade máxima aceita pelo servidor (unidades/s), com folga */
  velocidadeMax: 16,
  tickHz: 15,
  bebidaMax: 5,
  /** quanto tempo cada nível de bebida dura, em ms */
  bebidaDecaimentoMs: 2 * 60 * 1000,
  bolhaChatMs: 6000,
  fishPngMaxBytes: 350_000,
  fishContornoMaxPontos: 120,
} as const;

export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/** Mensagens da garrafa do navio — uma por dia, em rodízio. */
export const MENSAGENS_GARRAFA = [
  'Quem nada com o cardume nunca nada sozinho.',
  'Hoje é dia de tirar o anzol do coração.',
  'A maré não pede licença, mas o peixe educado pede.',
  'Nem toda rede é social.',
  'Beba água. Você já está nela, mas mesmo assim.',
  'Se a vida te der limões, faça uma casa em formato de limão.',
  'Peixe que fica em pé conhece o mundo de outro ângulo.',
];
