/**
 * Filtro de palavras bloqueadas, aplicado ao texto ORIGINAL antes de embaralhar,
 * para que os erros de digitação da bebida não sirvam de disfarce para ofensas.
 * A lista base é curta de propósito; a gerência amplia em data/bloqueadas.txt (uma por linha).
 */
const BASE = ['viado', 'macaco', 'crioulo', 'retardado', 'traveco', 'nazista', 'hitler'];

function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's');
}

export function criarFiltro(extras: string[] = []) {
  const lista = [...BASE, ...extras].map(normalizar).filter(Boolean);
  return (texto: string): string =>
    texto.replace(/[\p{L}\p{N}@$]+/gu, (palavra) => {
      const n = normalizar(palavra);
      return lista.some((b) => n === b || (b.length >= 5 && n.includes(b))) ? '🐟🐟🐟' : palavra;
    });
}
