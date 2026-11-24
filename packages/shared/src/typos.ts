/**
 * Embaralha um texto conforme o nível de bebida (0 a 5).
 * Nível 0 devolve o texto intacto. Quanto maior o nível, mais erros:
 * troca de letras vizinhas, tecla vizinha no teclado, letra arrastada, letra engolida
 * e pontuação exagerada. Ex.: "bora pro navio, galera?" -> "bora pro nvaio, galrea?"
 */

const VIZINHAS: Record<string, string> = {
  q: 'wa', w: 'qes', e: 'wrd', r: 'etf', t: 'ryg', y: 'tuh', u: 'yij', i: 'uok', o: 'ipl', p: 'ol',
  a: 'qsz', s: 'adw', d: 'sfe', f: 'dgr', g: 'fht', h: 'gjy', j: 'hku', k: 'jli', l: 'kop',
  z: 'asx', x: 'zcs', c: 'xvd', v: 'cbf', b: 'vng', n: 'bmh', m: 'nj',
};

export type Aleatorio = () => number;

/** PRNG determinístico (mulberry32), útil para testes. */
export function criarAleatorio(semente: number): Aleatorio {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ehLetra = (c: string | undefined): c is string => !!c && /\p{L}/u.test(c);

function manterCaixa(original: string, nova: string) {
  return original === original.toUpperCase() && original !== original.toLowerCase() ? nova.toUpperCase() : nova;
}

const TAXAS = [0, 0.06, 0.11, 0.17, 0.24, 0.32];

export function embaralharTexto(texto: string, nivel: number, rnd: Aleatorio = Math.random): string {
  const n = Math.max(0, Math.min(5, Math.floor(nivel)));
  if (n === 0 || !texto) return texto;

  const taxa = TAXAS[n];
  const chars = [...texto];
  const out: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const prox = chars[i + 1];
    if (!ehLetra(c) || rnd() >= taxa) {
      out.push(c);
      continue;
    }
    const sorte = rnd();
    if (sorte < 0.45 && ehLetra(prox)) {
      // troca com a próxima letra: "navio" -> "nvaio"
      out.push(prox, c);
      i++;
    } else if (sorte < 0.65) {
      const viz = VIZINHAS[c.toLowerCase()];
      out.push(viz ? manterCaixa(c, viz[Math.floor(rnd() * viz.length)]) : c);
    } else if (sorte < 0.85) {
      // fala arrastada
      out.push(c, c);
      if (n >= 4 && rnd() < 0.5) out.push(c);
    } else if (n < 2) {
      out.push(c);
    }
    // senão: letra engolida
  }

  let resultado = out.join('');
  if (n >= 3) resultado = resultado.replace(/[?!]/g, (m) => m.repeat(1 + Math.floor(rnd() * 3)));
  if (n >= 4 && rnd() < 0.5) resultado += ' *hic*';
  return resultado;
}
