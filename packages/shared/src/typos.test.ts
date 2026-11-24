import { describe, expect, it } from 'vitest';
import { criarAleatorio, embaralharTexto } from './typos';
import { criarFiltro } from './filtro';

describe('embaralharTexto', () => {
  it('não mexe no texto de quem está sóbrio', () => {
    expect(embaralharTexto('bora pro navio, galera?', 0)).toBe('bora pro navio, galera?');
  });

  it('é determinístico com semente', () => {
    const a = embaralharTexto('bora pro navio, galera?', 3, criarAleatorio(42));
    const b = embaralharTexto('bora pro navio, galera?', 3, criarAleatorio(42));
    expect(a).toBe(b);
  });

  it('erra mais quanto mais bebe', () => {
    const texto = 'o peixe que bebe demais acaba digitando tudo errado no chat do cardume';
    const erros = (nivel: number) => {
      let total = 0;
      for (let s = 0; s < 200; s++) {
        const r = embaralharTexto(texto, nivel, criarAleatorio(s));
        total += Math.abs(r.length - texto.length);
        for (let i = 0; i < Math.min(r.length, texto.length); i++) if (r[i] !== texto[i]) total++;
      }
      return total;
    };
    expect(erros(1)).toBeLessThan(erros(3));
    expect(erros(3)).toBeLessThan(erros(5));
  });

  it('limita o nível entre 0 e 5', () => {
    expect(embaralharTexto('oi', -3)).toBe('oi');
    expect(() => embaralharTexto('oi', 99, criarAleatorio(1))).not.toThrow();
  });
});

describe('criarFiltro', () => {
  it('troca palavras bloqueadas, inclusive com acento e leetspeak', () => {
    const f = criarFiltro(['bagre']);
    expect(f('seu b4gre!')).toBe('seu 🐟🐟🐟!');
    expect(f('oi, tudo bem?')).toBe('oi, tudo bem?');
  });
});
