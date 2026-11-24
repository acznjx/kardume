import type { UsuarioMe } from '@cardume/shared';

async function req<T>(metodo: string, url: string, corpo?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: metodo,
    credentials: 'include',
    headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((dados as { erro?: string }).erro ?? `Erro ${r.status}`);
  return dados as T;
}

export const api = {
  me: () => req<UsuarioMe>('GET', '/api/me'),
  login: (username: string, senha: string, lembrar: boolean) =>
    req<UsuarioMe>('POST', '/api/login', { username, senha, lembrar }),
  registrar: (username: string, senha: string, lembrar: boolean, maior18: boolean) =>
    req<UsuarioMe>('POST', '/api/register', { username, senha, lembrar, maior18 }),
  logout: () => req<{ ok: true }>('POST', '/api/logout'),
  online: () => req<{ online: number; servidor: string }>('GET', '/api/online'),
  salvarDesenho: (png: string, contorno: [number, number][]) =>
    req<UsuarioMe>('PUT', '/api/me/fish', { tipo: 'desenho', png, contorno }),
  salvarModelo: (modelo: string) => req<UsuarioMe>('PUT', '/api/me/fish', { tipo: 'modelo', modelo }),
};
