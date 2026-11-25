import { FAIXA_POR_ID, type Faixa } from '@cardume/shared';

export type Instrumento = 'baixo' | 'sanfona' | 'violao' | 'orgao' | 'canto'
  | 'piano' | 'cavaquinho' | 'celesta' | 'concertina'
  | 'bumbo' | 'aro' | 'caixa' | 'palma' | 'triangulo' | 'chocalho' | 'tamborim' | 'poeira';
export interface Nota {
  tempo: number;
  duracao: number;
  instrumento: Instrumento;
  midi: number;
  volume: number;
  destino?: number;
}
type Acorde = readonly [number, ...number[]];
interface Composicao {
  compasso: number;
  tonica: Acorde;
  acordes: readonly (readonly Acorde[])[];
  melodias: readonly (readonly string[])[];
  solo: Instrumento;
}

// Cada número é MIDI. As melodias são pequenas frases originais: nota:batidas; “-” é pausa.
const D: Acorde = [38, 62, 66, 69], G: Acorde = [43, 62, 67, 71];
const A7: Acorde = [45, 61, 67, 69], Bm: Acorde = [47, 62, 66, 71];
const C9: Acorde = [36, 59, 62, 64, 67], Am9: Acorde = [45, 60, 64, 67, 71];
const Dm9: Acorde = [38, 60, 64, 65, 69], G9: Acorde = [43, 59, 65, 69];
const F7M: Acorde = [41, 60, 64, 69], Em7: Acorde = [40, 59, 62, 67];
const Am: Acorde = [45, 60, 64, 69], F: Acorde = [41, 60, 65, 69];
const C: Acorde = [36, 60, 64, 67], E7: Acorde = [40, 59, 62, 68];
const Dm: Acorde = [38, 62, 65, 69], Bb: Acorde = [46, 62, 65, 70];

const COMPOSICOES: Record<string, Composicao> = {
  'forro-das-ostras': {
    compasso: 4, tonica: D, solo: 'sanfona',
    acordes: [[D, D, G, A7, D, Bm, G, A7], [Bm, G, D, A7, G, D, A7, A7]],
    melodias: [[
      'F#4:.5 A4:.5 B4:1 A4:.5 F#4:.5 E4:.5 F#4:.5', 'D4:1 -:.5 F#4:.5 A4:1 F#4:1',
      'G4:.5 B4:.5 D5:1 B4:.5 A4:.5 G4:1', 'E4:.5 G4:.5 A4:1 C#5:.5 B4:.5 A4:1',
      'F#4:.5 A4:.5 D5:1 C#5:.5 A4:.5 F#4:1', 'B4:.5 A4:.5 F#4:1 D4:1 F#4:1',
      'G4:.5 A4:.5 B4:.5 D5:.5 B4:1 G4:.5 E4:.5', 'C#5:.5 B4:.5 A4:1 E4:.5 C#4:.5 D4:1',
    ], [
      'D5:1 F#5:.5 E5:.5 D5:1 B4:1', 'B4:.5 D5:.5 G5:1 F#5:.5 D5:.5 B4:1',
      'A4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1', 'C#5:1 E5:.5 C#5:.5 B4:1 A4:1',
      'B4:.5 D5:.5 B4:1 A4:.5 G4:.5 B4:1', 'A4:.5 F#4:.5 D4:1 F#4:.5 A4:.5 D5:1',
      'E5:.5 C#5:.5 A4:1 G4:.5 E4:.5 C#4:1', 'E4:.5 G4:.5 A4:.5 B4:.5 C#5:1 -:1',
    ]],
  },
  'bossa-do-baiacu': {
    compasso: 4, tonica: C9, solo: 'violao',
    acordes: [[C9, Am9, Dm9, G9, Em7, Am9, Dm9, G9], [F7M, F7M, Em7, Am9, Dm9, G9, C9, G9]],
    melodias: [[
      '-:.5 E5:1 D5:.5 B4:1 G4:1', 'C5:1 B4:.5 G4:.5 E4:1 -:1',
      'A4:1 C5:.5 E5:1 D5:.5 C5:1', '-:.5 B4:1 A4:.5 G4:1 D4:1',
      'G4:.5 B4:1 D5:.5 E5:1 B4:1', 'C5:1 E5:.5 B4:.5 A4:1 G4:1',
      '-:.5 F4:.5 A4:1 C5:1 E5:.5 D5:.5', 'B4:1 A4:.5 F4:.5 E4:1 -:1',
    ], [
      'A4:1 C5:.5 E5:.5 G5:1 E5:1', 'F5:.5 E5:.5 C5:1 A4:1 -:1',
      'G4:.5 B4:.5 D5:1 F#5:.5 E5:.5 D5:1', 'E5:1 C5:.5 B4:.5 G4:1 A4:1',
      'F4:.5 A4:.5 C5:1 E5:1 D5:.5 C5:.5', 'B4:1 D5:.5 A4:.5 G4:1 F4:1',
      'E4:.5 G4:.5 B4:1 D5:.5 E5:1 -:.5', 'D5:1 B4:.5 A4:.5 G4:1 -:1',
    ]],
  },
  'brega-da-mare': {
    compasso: 4, tonica: Am, solo: 'canto',
    acordes: [[Am, F, C, E7, Am, Dm, F, E7], [F, G, C, Am, Dm, Am, F, E7]],
    melodias: [[
      'E4:1 A4:1 C5:1 B4:.5 A4:.5', 'A4:1 G4:.5 F4:.5 E4:1 -:1',
      'G4:1 E5:1 D5:1 C5:1', 'B4:1 G#4:1 E4:1 -:1',
      'E4:.5 A4:.5 B4:.5 C5:1 E5:1 C5:.5', 'D5:1 A4:1 F4:1 E4:1',
      'A4:1 C5:.5 A4:.5 G4:1 F4:1', 'G#4:1 B4:1 A4:1 -:1',
    ], [
      'C5:1 F5:1 E5:.5 C5:.5 A4:1', 'B4:1 D5:1 G5:1 D5:1',
      'E5:1 D5:.5 C5:.5 G4:1 E4:1', 'A4:1 B4:.5 C5:.5 E5:1 C5:1',
      'D5:1 F5:1 E5:.5 D5:.5 A4:1', 'C5:1 B4:.5 A4:.5 E4:1 -:1',
      'F4:.5 A4:.5 C5:1 A4:1 G4:1', 'G#4:1 B4:1 E5:1 -:1',
    ]],
  },
  'lofi-do-lodo': {
    compasso: 4, tonica: F7M, solo: 'piano',
    acordes: [[F7M, Em7, Am9, C9, F7M, Em7, Dm9, G9], [Dm9, G9, Em7, Am9, F7M, Em7, Dm9, C9]],
    melodias: [[
      '-:.5 A4:.5 C5:1 E5:.5 C5:1 -:.5', 'B4:1 G4:.5 E4:.5 D4:1 -:1',
      '-:1 E5:.5 C5:.5 B4:1 G4:1', 'E4:1 G4:.5 B4:.5 D5:1 -:1',
      'C5:.5 A4:.5 G4:1 E4:.5 F4:1 -:.5', 'G4:1 B4:.5 D5:1 B4:.5 -:1',
      'A4:1 F4:.5 E4:.5 D4:1 -:1', 'B4:.5 A4:.5 F4:1 E4:1 -:1',
    ], [
      'F5:1 E5:.5 C5:.5 A4:1 -:1', 'D5:1 B4:.5 A4:.5 G4:1 -:1',
      '-:.5 G4:.5 B4:1 D5:1 E5:.5 D5:.5', 'C5:1 B4:.5 G4:.5 E4:1 -:1',
      'A4:.5 C5:.5 E5:1 G5:.5 E5:1 -:.5', 'D5:1 B4:1 G4:1 -:1',
      'F4:.5 A4:.5 C5:1 E5:.5 D5:1 -:.5', 'B4:1 G4:.5 E4:1 D4:.5 -:1',
    ]],
  },
  'samba-da-sardinha': {
    compasso: 4, tonica: G, solo: 'cavaquinho',
    acordes: [[G, Em7, Am, D, G, E7, Am, D], [C, C, G, Em7, Am, D, G, D]],
    melodias: [[
      'B4:.5 D5:.5 E5:.5 D5:1 B4:.5 A4:1', 'G4:.5 B4:.5 D5:1 B4:.5 G4:.5 E4:1',
      'A4:.5 C5:.5 E5:1 G5:.5 E5:.5 C5:1', 'F#5:.5 E5:.5 D5:1 A4:1 -:1',
      'D5:.5 B4:.5 G4:1 A4:.5 B4:.5 D5:1', 'E5:.5 D5:.5 B4:1 G#4:.5 B4:.5 E5:1',
      'C5:.5 E5:.5 A5:1 G5:.5 E5:.5 C5:1', 'A4:.5 F#4:.5 D4:1 G4:1 -:1',
    ], [
      'E5:.5 G5:.5 E5:1 D5:.5 C5:.5 G4:1', 'C5:.5 E5:.5 G5:.5 A5:.5 G5:1 E5:1',
      'D5:.5 B4:.5 D5:1 G5:.5 E5:.5 D5:1', 'B4:1 G4:.5 E4:.5 D5:1 B4:1',
      'C5:.5 A4:.5 C5:1 E5:.5 G5:.5 E5:1', 'F#5:1 E5:.5 D5:.5 A4:1 -:1',
      'B4:.5 D5:.5 G5:1 D5:.5 B4:.5 G4:1', 'A4:.5 D5:.5 C5:1 A4:1 -:1',
    ]],
  },
  'valsa-do-polvo': {
    compasso: 3, tonica: C, solo: 'celesta',
    acordes: [[C, C, F, G, Am, Dm, G, C], [Am, Em7, F, C, Dm, Am, G, G]],
    melodias: [[
      'E5:1 G5:.5 E5:.5 D5:1', 'C5:1 E5:1 G5:1', 'A5:1 G5:.5 F5:.5 E5:1', 'D5:1 B4:1 G4:1',
      'C5:.5 E5:.5 A5:1 G5:1', 'F5:1 E5:.5 D5:.5 A4:1', 'B4:.5 D5:.5 G5:1 F5:1', 'E5:1 C5:1 -:1',
    ], [
      'E5:1 A5:1 C6:1', 'B5:1 G5:.5 E5:.5 B4:1', 'A5:.5 G5:.5 F5:1 E5:1', 'G5:1 E5:1 C5:1',
      'D5:.5 F5:.5 A5:1 G5:1', 'E5:1 C5:1 A4:1', 'B4:.5 D5:.5 G5:1 A5:1', 'B5:1 G5:1 -:1',
    ]],
  },
  'shanty-pirata-sem-rumo': {
    compasso: 4, tonica: Dm, solo: 'concertina',
    acordes: [[Dm, Dm, C, Dm, G, Dm, C, Dm], [Bb, C, Dm, Dm, G, C, A7, A7]],
    melodias: [[
      'D4:1 F4:.5 A4:.5 A4:1 G4:1', 'F4:1 E4:.5 D4:.5 -:2',
      'E4:1 G4:.5 C5:.5 B4:1 G4:1', 'A4:1 F4:.5 D4:.5 -:2',
      'G4:1 B4:.5 D5:.5 B4:1 A4:1', 'A4:.5 G4:.5 F4:1 D4:1 -:1',
      'E4:1 G4:.5 E4:.5 C4:1 E4:1', 'F4:.5 E4:.5 D4:2 -:1',
    ], [
      'F4:1 Bb4:.5 D5:.5 C5:1 Bb4:1', 'G4:1 C5:.5 E5:.5 D5:1 C5:1',
      'A4:1 D5:.5 F5:.5 E5:1 D5:1', 'A4:1 F4:1 D4:1 -:1',
      'B4:1 D5:.5 G5:.5 D5:1 B4:1', 'C5:1 G4:.5 E4:.5 C4:1 -:1',
      'E4:1 A4:.5 C#5:.5 B4:1 A4:1', 'G4:1 E4:1 C#4:1 -:1',
    ]],
  },
};

const ALTURAS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(nome: string): number {
  const m = /^([A-G])(#|b)?(\d)$/.exec(nome)!;
  return (Number(m[3]) + 1) * 12 + ALTURAS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// Ruído/variação por endereço, nunca por ordem de execução: buscar no meio não muda o arranjo.
export function acaso(semente: number): number {
  let n = Math.imul(semente ^ 0x9e3779b9, 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}
export function sementeTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h;
}

export interface Partitura { faixa: Faixa; compasso: number; segundosCompasso: number; fimCorpo: number }
export function obterPartitura(id: string): Partitura | null {
  const faixa = FAIXA_POR_ID.get(id), c = COMPOSICOES[id];
  if (!faixa || !c) return null;
  const segundosCompasso = c.compasso * 60 / faixa.bpm;
  return { faixa, compasso: c.compasso, segundosCompasso, fimCorpo: Math.floor(faixa.duracao / segundosCompasso) - 1 };
}

/** Gera somente um compasso. A introdução ocupa dois; o corpo tem A/B/A’ e a coda resolve na tônica. */
export function notasDoCompasso(p: Partitura, barra: number): Nota[] {
  const c = COMPOSICOES[p.faixa.id], id = p.faixa.id, beat = 60 / p.faixa.bpm;
  const inicio = barra * p.segundosCompasso;
  if (barra < 0 || inicio >= p.faixa.duracao) return [];
  const notas: Nota[] = [], seed = sementeTexto(id) + barra * 7919;
  const bloco = Math.max(4, Math.round((p.fimCorpo - 2) / 6) * 2);
  const secao = barra < 2 + bloco ? 0 : barra < 2 + 2 * bloco ? 1 : 2;
  const local = Math.max(0, barra - 2 - (secao === 2 ? 2 * bloco : secao * bloco));
  const intro = barra < 2, fim = barra >= p.fimCorpo;
  const acorde = fim ? c.tonica : c.acordes[secao === 1 ? 1 : 0][(intro ? barra : local) % 8];
  const humanizar = (n: number) => .92 + .16 * acaso(seed + n * 101);
  const por = (instrumento: Instrumento, b: number, dur: number, n: number, vol: number, destino?: number) => {
    const swing = id === 'lofi-do-lodo' && Math.round(b * 2) % 2 === 1 ? .14 : 0;
    const tempo = inicio + (b + swing) * beat;
    if (tempo < p.faixa.duracao - .04) notas.push({ instrumento, tempo, duracao: dur * beat, midi: n,
      volume: vol * humanizar(notas.length) * (intro ? .78 : 1), destino });
  };
  const baixo = (b: number, quinta = false, dur = .65, vol = .66) => por('baixo', b, dur, acorde[0] + (quinta ? 7 : 0), vol);
  const harmonia = (inst: Instrumento, b: number, dur: number, vol: number, arpejo = 0) => {
    acorde.slice(1).forEach((n, i) => por(inst, b + i * arpejo, dur, n, vol / Math.sqrt(acorde.length - 1)));
  };
  const per = (inst: Instrumento, b: number, vol: number, n = 60) => por(inst, b, .1, n, vol);
  if (fim) {
    if (barra === p.fimCorpo) {
      const restante = (p.faixa.duracao - inicio) / beat;
      baixo(0, false, Math.min(2, restante), .7);
      harmonia(id === 'valsa-do-polvo' ? 'celesta' : id === 'lofi-do-lodo' ? 'piano' : 'orgao', 0, restante - .18, .38, .035);
      por(c.solo, .08, Math.min(2.2, restante - .1), c.tonica[1] + 12, .38);
      per('bumbo', 0, .35, 48);
    }
    return notas;
  }
  switch (id) {
    case 'forro-das-ostras':
      [0, 1.5, 2, 3.5].forEach(b => per('bumbo', b, b % 2 === 0 ? .8 : .53, 47));
      for (let s = 0; s < 16; s++) per('triangulo', s / 4, s % 2 ? .17 : .27);
      [0, 1, 2, 3].forEach((b, i) => baixo(b, i % 2 === 1));
      [1, 3].forEach(b => harmonia('sanfona', b, .28, .21));
      break;
    case 'bossa-do-baiacu':
      [0, 1.5, 2.5, 3.5].forEach(b => harmonia('violao', b, .8, .5, .018));
      // Clave de bossa em dois compassos: três ataques, depois dois.
      (barra % 2 === 0 ? [0, 1.5, 3] : [1, 2.5]).forEach(b => per('aro', b, .32));
      [0, 2].forEach((b, i) => baixo(b, !!i, 1.3, .58));
      [0, 1, 2, 3].forEach(b => per('chocalho', b + .5, .09));
      break;
    case 'brega-da-mare':
      [0, 2].forEach(b => { per('bumbo', b, .65, 47); baixo(b, b === 2, 1.4); });
      [1, 3].forEach(b => per('caixa', b, .37));
      for (let s = 0; s < 8; s++) per('chocalho', s / 2, s % 2 ? .14 : .08);
      harmonia('orgao', 0, 3.7, .37);
      break;
    case 'lofi-do-lodo':
      [0, 1.75, 2.5].forEach(b => per('bumbo', b, .67, 46));
      [1, 3].forEach(b => per('caixa', b, .47));
      for (let s = 0; s < 8; s++) per('chocalho', s / 2, s % 2 ? .16 : .1);
      harmonia('piano', 0, 1.65, .54, .025); harmonia('piano', 2.5, 1, .32, .02);
      baixo(0, false, 1.5, .65); baixo(2.5, false, .85, .5);
      for (let s = 0; s < 5; s++) per('poeira', acaso(seed + s) * 4, .08 + .08 * acaso(seed + s + 30));
      break;
    case 'samba-da-sardinha':
      [1, 3].forEach(b => per('bumbo', b, .83, 43));
      [0, .75, 1.5, 2, 2.75, 3.5, 3.75].forEach(b => per('tamborim', b, .31));
      for (let s = 0; s < 16; s++) per('chocalho', s / 4, s % 2 ? .15 : .23);
      [0, .75, 1.5, 2.5, 3.25].forEach(b => harmonia('cavaquinho', b, .35, .38, .012));
      [0, 1.5, 2, 3.5].forEach((b, i) => baixo(b, i % 2 === 1, .55, .59));
      break;
    case 'valsa-do-polvo':
      baixo(0, barra % 2 === 1, .9, .62);
      [1, 2].forEach(b => harmonia('violao', b, .5, .37, .014));
      per('bumbo', 0, .3, 48); [1, 2].forEach(b => per('chocalho', b, .09));
      break;
    case 'shanty-pirata-sem-rumo':
      [0, 1, 2, 3].forEach(b => per('bumbo', b, b % 2 ? .4 : .7, 45));
      [1, 3].forEach(b => per('palma', b, .48));
      por('baixo', 0, 3.6, 38, .6);
      harmonia('concertina', 0, 1.7, .23); harmonia('concertina', 2, 1.6, .2);
      break;
  }
  if (!intro || barra === 1) {
    let b = 0, anterior: number | undefined;
    const frase = c.melodias[secao === 1 ? 1 : 0][(intro ? 7 : local) % 8];
    for (const token of frase.split(' ')) {
      const [nome, tamanho] = token.split(':'), dur = Number(tamanho);
      if (nome !== '-' && (!intro || b >= 2)) {
        const n = midi(nome), slide = id === 'brega-da-mare' ? anterior ?? n - 2 : undefined;
        por(c.solo, b, dur * .86, slide ?? n, id === 'lofi-do-lodo' ? .34 : .49, slide === undefined ? undefined : n);
        // A reprise ganha uma resposta discreta, como alguém assobiando de outra mesa.
        if (secao === 2 && local % 4 === 3 && b < 2 && dur >= 1)
          por(c.solo, b + dur * .65, .22, n + (id === 'valsa-do-polvo' ? 12 : 0), .18);
        anterior = n;
      }
      b += dur;
    }
  }
  // Pequena virada a cada oito compassos; o último tempo respira antes da mudança.
  if (!intro && local % 8 === 7 && id !== 'valsa-do-polvo') {
    per(id === 'samba-da-sardinha' ? 'tamborim' : 'aro', 3.25, .22);
    per('aro', 3.75, .28);
  }
  return notas;
}
