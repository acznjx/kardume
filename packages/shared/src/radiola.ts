/**
 * Radiola das Marés — catálogo de faixas originais (geradas por síntese no navegador, sem arquivos de áudio).
 * O servidor usa as durações para trocar de faixa; o client toca a faixa sincronizada pelo horário de início.
 */
export interface Faixa {
  id: string;
  nome: string;
  /** estilo, mostrado na radiola */
  estilo: string;
  /** duração em segundos (a faixa não repete: no fim o servidor escolhe a próxima) */
  duracao: number;
  bpm: number;
}

export const FAIXAS: readonly Faixa[] = [
  { id: 'forro-das-ostras', nome: 'Forró das Ostras', estilo: 'forró', duracao: 72, bpm: 118 },
  { id: 'bossa-do-baiacu', nome: 'Bossa do Baiacu', estilo: 'bossa nova', duracao: 80, bpm: 96 },
  { id: 'brega-da-mare', nome: 'Brega da Maré', estilo: 'brega', duracao: 70, bpm: 104 },
  { id: 'lofi-do-lodo', nome: 'Lo-fi do Lodo', estilo: 'lo-fi', duracao: 90, bpm: 78 },
  { id: 'samba-da-sardinha', nome: 'Samba da Sardinha', estilo: 'samba', duracao: 64, bpm: 128 },
  { id: 'valsa-do-polvo', nome: 'Valsa do Polvo', estilo: 'valsa', duracao: 75, bpm: 132 },
  { id: 'shanty-pirata-sem-rumo', nome: 'Shanty do Pirata Sem Rumo', estilo: 'canção de marujo', duracao: 68, bpm: 100 },
];

export const FAIXA_POR_ID = new Map(FAIXAS.map((f) => [f.id, f]));
