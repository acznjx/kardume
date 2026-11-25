import { SALA_ADEGA } from './salas/adega';
import { SALA_NAVIO } from './salas/navio';
import type { RoomId, V3 } from './salas/tipos';

export type { RoomId } from './salas/tipos';

/** Limites e spawn de cada sala (vêm de ./salas/*.ts). */
export const ROOMS: Record<RoomId, { id: RoomId; nome: string; min: V3; max: V3; spawn: V3 }> = {
  navio: { id: 'navio', nome: SALA_NAVIO.nome, min: SALA_NAVIO.limites.min, max: SALA_NAVIO.limites.max, spawn: SALA_NAVIO.spawn },
  adega: { id: 'adega', nome: SALA_ADEGA.nome, min: SALA_ADEGA.limites.min, max: SALA_ADEGA.limites.max, spawn: SALA_ADEGA.spawn },
};

export const ROOM_IDS: RoomId[] = ['navio', 'adega'];

/** Portas entre salas: onde ficam, raio de ativação e onde o peixe aparece do outro lado. */
export const PORTAS: Record<RoomId, { para: RoomId; pos: V3; raio: number; exigeEmPe: boolean; chegada: V3 }> = {
  navio: { para: 'adega', ...SALA_NAVIO.porta, chegada: SALA_ADEGA.chegada },
  adega: { para: 'navio', ...SALA_ADEGA.porta, chegada: SALA_NAVIO.chegada },
};

/** Raio em volta do spawn onde os peixes aparecem (para ninguém nascer empilhado). */
export const RAIO_SPAWN = 7;

export function distancia(a: readonly number[], b: readonly number[], ignorarY = false) {
  const dx = a[0] - b[0];
  const dy = ignorarY ? 0 : a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const LIMITES = {
  usernameMin: 3,
  usernameMax: 20,
  /** mínimo recomendado pelo NIST (SP 800-63B); só vale para senhas novas, logins antigos continuam */
  senhaMin: 8,
  /** o bcrypt ignora tudo depois de 72 bytes: acima disso a senha seria cortada sem aviso */
  senhaMaxBytes: 72,
  chatMax: 120,
  /** velocidade máxima aceita pelo servidor (unidades/s), com folga */
  velocidadeMax: 46,
  tickHz: 15,
  bebidaMax: 5,
  /** quanto tempo cada nível de bebida dura, em ms */
  bebidaDecaimentoMs: 2 * 60 * 1000,
  bolhaChatMs: 6000,
  fishPngMaxBytes: 350_000,
  fishContornoMaxPontos: 120,
  /** distância máxima para sentar num assento */
  alcanceAssento: 3.2,
  /** janela para juntar brindes num brinde coletivo */
  brindeJanelaMs: 2500,
  brindeRaio: 7,
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
