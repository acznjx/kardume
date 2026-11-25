/** Roupeiro: peças que o peixe veste por cima do corpo (modelo pronto ou desenho). */

export const CHAPEUS = ['nenhum', 'bone', 'gorro', 'pescador', 'cartola', 'coroa'] as const;
export const OCULOS = ['nenhum', 'escuro', 'redondo', 'coracao'] as const;
export const PESCOCO = ['nenhum', 'cachecol', 'gravata', 'colar'] as const;

/** Cores de tecido do roupeiro (mesma paleta de papel/colagem do jogo). */
export const CORES_ROUPA = {
  coral: '#e26a4f',
  mostarda: '#e0a93b',
  teal: '#2e8a87',
  creme: '#f1ead9',
  preto: '#2b2b2b',
  lilas: '#a68bc4',
  verde: '#5f9e57',
  vinho: '#8c3045',
} as const;

export type Chapeu = (typeof CHAPEUS)[number];
export type Oculos = (typeof OCULOS)[number];
export type Pescoco = (typeof PESCOCO)[number];
export type CorRoupa = keyof typeof CORES_ROUPA;
export const CORES_ROUPA_IDS = Object.keys(CORES_ROUPA) as CorRoupa[];

export interface Roupa {
  chapeu: Chapeu;
  corChapeu: CorRoupa;
  oculos: Oculos;
  pescoco: Pescoco;
  corPescoco: CorRoupa;
  /** cor do tênis (aparece quando o peixe fica em pé) */
  tenis: CorRoupa;
}

export const ROUPA_PADRAO: Roupa = {
  chapeu: 'nenhum',
  corChapeu: 'coral',
  oculos: 'nenhum',
  pescoco: 'nenhum',
  corPescoco: 'mostarda',
  tenis: 'creme',
};

const de = <T extends string>(lista: readonly T[], v: unknown, padrao: T): T =>
  typeof v === 'string' && (lista as readonly string[]).includes(v) ? (v as T) : padrao;

/** Lê uma roupa vinda de fora (corpo da requisição, banco). Retorna null se não for um objeto. */
export function normalizarRoupa(v: unknown): Roupa | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  return {
    chapeu: de(CHAPEUS, o.chapeu, ROUPA_PADRAO.chapeu),
    corChapeu: de(CORES_ROUPA_IDS, o.corChapeu, ROUPA_PADRAO.corChapeu),
    oculos: de(OCULOS, o.oculos, ROUPA_PADRAO.oculos),
    pescoco: de(PESCOCO, o.pescoco, ROUPA_PADRAO.pescoco),
    corPescoco: de(CORES_ROUPA_IDS, o.corPescoco, ROUPA_PADRAO.corPescoco),
    tenis: de(CORES_ROUPA_IDS, o.tenis, ROUPA_PADRAO.tenis),
  };
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
