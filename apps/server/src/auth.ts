import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  LIMITES,
  MODELOS_PEIXE,
  USERNAME_REGEX,
  type Aparencia,
  type ModeloPeixe,
  type UsuarioMe,
} from '@cardume/shared';
import type { DB, UserRow } from './db';

const DESENHO_W = 512;
const DESENHO_H = 256;

export const COOKIE = 'cardume_sessao';
const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
const UM_DIA = 24 * 60 * 60 * 1000;

const HASH_FALSO = bcrypt.hashSync('peixe-que-nao-existe', 10);
const hashToken =(t: string) => createHash('sha256').update(t).digest('hex');

export function aparenciaDe(u: Pick<UserRow, 'id' | 'fish_png' | 'fish_contorno' | 'fish_modelo' | 'fish_versao'>): Aparencia | null {
  if (u.fish_png && u.fish_contorno) {
    return { tipo: 'desenho', png: `/api/peixe/${u.id}.png?v=${u.fish_versao}`, contorno: JSON.parse(u.fish_contorno) };
  }
  if (u.fish_modelo && (MODELOS_PEIXE as readonly string[]).includes(u.fish_modelo)) {
    return { tipo: 'modelo', modelo: u.fish_modelo as ModeloPeixe };
  }
  return null;
}

/** Limitador simples em memória: no máximo `max` eventos por `janelaMs` por chave. */
export function criarLimitador(max: number, janelaMs: number) {
  const mapa = new Map<string, number[]>();
  return (chave: string) => {
    const agora = Date.now();
    const lista = (mapa.get(chave) ?? []).filter((t) => agora - t < janelaMs);
    if (lista.length >= max) {
      mapa.set(chave, lista);
      return false;
    }
    lista.push(agora);
    mapa.set(chave, lista);
    if (mapa.size > 5000) mapa.clear();
    return true;
  };
}

export function criarAuth(db: DB) {
  const stmts = {
    porNome: db.prepare('SELECT * FROM users WHERE username = ?'),
    porId: db.prepare('SELECT * FROM users WHERE id = ?'),
    inserir: db.prepare('INSERT INTO users (username, senha_hash, created_at) VALUES (?, ?, ?)'),
    criarSessao: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
    sessao: db.prepare(
      'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?',
    ),
    apagarSessao: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    limparSessoes: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    salvarDesenho: db.prepare(
      'UPDATE users SET fish_png = ?, fish_contorno = ?, fish_modelo = NULL, fish_versao = fish_versao + 1 WHERE id = ?',
    ),
    salvarModelo: db.prepare(
      'UPDATE users SET fish_png = NULL, fish_contorno = NULL, fish_modelo = ?, fish_versao = fish_versao + 1 WHERE id = ?',
    ),
  };

  function validarCredenciais(username: unknown, senha: unknown): string | null {
    if (typeof username !== 'string' || typeof senha !== 'string') return 'Preencha usuário e senha.';
    if (username.length < LIMITES.usernameMin || username.length > LIMITES.usernameMax)
      return `O nome do peixe precisa ter de ${LIMITES.usernameMin} a ${LIMITES.usernameMax} caracteres.`;
    if (!USERNAME_REGEX.test(username)) return 'Use só letras, números, ponto, hífen ou _ no nome.';
    if (senha.length < LIMITES.senhaMin) return `A senha precisa ter pelo menos ${LIMITES.senhaMin} caracteres.`;
    if (senha.length > 200) return 'Senha longa demais.';
    return null;
  }

  async function registrar(username: string, senha: string): Promise<UserRow> {
    const hash = await bcrypt.hash(senha, 10);
    const r = stmts.inserir.run(username, hash, Date.now());
    return stmts.porId.get(Number(r.lastInsertRowid)) as unknown as UserRow;
  }

  async function verificar(username: string, senha: string): Promise<UserRow | null> {
    const u = stmts.porNome.get(username) as unknown as UserRow | undefined;
    if (!u) {
      await bcrypt.compare(senha, HASH_FALSO); // mesmo tempo de resposta com ou sem usuário
      return null;
    }
    return (await bcrypt.compare(senha, u.senha_hash)) ? u : null;
  }

  function criarSessao(userId: number, lembrar: boolean) {
    const token = randomBytes(32).toString('hex');
    const expira = Date.now() + (lembrar ? TRINTA_DIAS : UM_DIA);
    stmts.criarSessao.run(hashToken(token), userId, expira);
    return { token, expira };
  }

  function usuarioDoToken(token: string | undefined): UserRow | null {
    if (!token) return null;
    return (stmts.sessao.get(hashToken(token), Date.now()) as unknown as UserRow | undefined) ?? null;
  }

  function encerrarSessao(token: string) {
    stmts.apagarSessao.run(hashToken(token));
  }

  function me(u: UserRow): UsuarioMe {
    return { id: u.id, username: u.username, aparencia: aparenciaDe(u) };
  }

  function porId(id: number) {
    return (stmts.porId.get(id) as unknown as UserRow | undefined) ?? null;
  }

  setInterval(() => stmts.limparSessoes.run(Date.now()), 60 * 60 * 1000).unref();

  return { validarCredenciais, registrar, verificar, criarSessao, usuarioDoToken, encerrarSessao, me, porId, stmts };
}

export type Auth = ReturnType<typeof criarAuth>;

const ASSINATURA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Confere assinatura e cabeçalho IHDR: só aceita PNG com as dimensões exatas do canvas do editor
 * (evita "bombas" de PNG pequeno que descomprime em imagem gigante nos outros clientes).
 */
export function pngNoTamanhoDoEditor(b: Buffer) {
  if (b.length < 33 || !b.subarray(0, 8).equals(ASSINATURA_PNG)) return false;
  if (b.subarray(12, 16).toString('ascii') !== 'IHDR') return false;
  return b.readUInt32BE(16) === DESENHO_W && b.readUInt32BE(20) === DESENHO_H;
}

function validarContorno(c: unknown): c is [number, number][] {
  return (
    Array.isArray(c) &&
    c.length >= 3 &&
    c.length <= LIMITES.fishContornoMaxPontos &&
    c.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= -0.01 && n <= 1.01),
    )
  );
}

export function rotasAuth(
  app: FastifyInstance,
  auth: Auth,
  eventos: { aoMudarAparencia: (userId: number) => void; aoSair: (token: string) => void },
) {
  const limiteLogin = criarLimitador(10, 60_000);
  const limiteLoginGlobal = criarLimitador(120, 60_000);
  const limiteAparencia = criarLimitador(6, 60_000);
  const producao = process.env.NODE_ENV === 'production';

  const definirCookie = (reply: FastifyReply, token: string, expira: number, lembrar: boolean) => {
    reply.setCookie(COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: producao && process.env.CARDUME_HTTPS === '1',
      ...(lembrar ? { expires: new Date(expira) } : {}),
    });
  };

  const exigirUsuario = (req: FastifyRequest, reply: FastifyReply) => {
    const u = auth.usuarioDoToken(req.cookies[COOKIE]);
    if (!u) reply.code(401).send({ erro: 'Você não está logado.' });
    return u;
  };

  app.post('/api/register', async (req, reply) => {
    if (!limiteLogin(req.ip) || !limiteLoginGlobal('*')) return reply.code(429).send({ erro: 'Calma, peixe! Tente de novo em um minuto.' });
    const { username, senha, maior18, lembrar } = (req.body ?? {}) as Record<string, unknown>;
    const erro = auth.validarCredenciais(username, senha);
    if (erro) return reply.code(400).send({ erro });
    if (maior18 !== true) return reply.code(400).send({ erro: 'O Kardume é só para maiores de 18 anos.' });
    if (auth.stmts.porNome.get(username as string))
      return reply.code(409).send({ erro: 'Já existe um peixe com esse nome.' });
    const u = await auth.registrar(username as string, senha as string);
    const s = auth.criarSessao(u.id, lembrar === true);
    definirCookie(reply, s.token, s.expira, lembrar === true);
    return auth.me(u);
  });

  app.post('/api/login', async (req, reply) => {
    if (!limiteLogin(req.ip) || !limiteLoginGlobal('*')) return reply.code(429).send({ erro: 'Calma, peixe! Tente de novo em um minuto.' });
    const { username, senha, lembrar } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof username !== 'string' || typeof senha !== 'string' || !username || !senha)
      return reply.code(400).send({ erro: 'Preencha usuário e senha.' });
    const u = await auth.verificar(username.trim(), senha);
    if (!u) return reply.code(401).send({ erro: 'Usuário ou senha não conferem.' });
    const s = auth.criarSessao(u.id, lembrar === true);
    definirCookie(reply, s.token, s.expira, lembrar === true);
    return auth.me(u);
  });

  app.post('/api/logout', async (req, reply) => {
    const token = req.cookies[COOKIE];
    if (token) {
      auth.encerrarSessao(token);
      eventos.aoSair(token);
    }
    reply.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/me', async (req, reply) => {
    const u = exigirUsuario(req, reply);
    if (!u) return;
    return auth.me(u);
  });

  app.put('/api/me/fish', { bodyLimit: 600_000 }, async (req, reply) => {
    const u = exigirUsuario(req, reply);
    if (!u) return;
    if (!limiteAparencia(String(u.id))) return reply.code(429).send({ erro: 'Muitas trocas de peixe. Espere um minutinho.' });
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.tipo === 'modelo') {
      if (typeof body.modelo !== 'string' || !(MODELOS_PEIXE as readonly string[]).includes(body.modelo))
        return reply.code(400).send({ erro: 'Modelo de peixe desconhecido.' });
      auth.stmts.salvarModelo.run(body.modelo, u.id);
    } else if (body.tipo === 'desenho') {
      const png = body.png;
      if (typeof png !== 'string' || !png.startsWith('data:image/png;base64,'))
        return reply.code(400).send({ erro: 'Desenho inválido.' });
      const bytes = Buffer.from(png.slice(22), 'base64');
      if (bytes.length > LIMITES.fishPngMaxBytes || !pngNoTamanhoDoEditor(bytes))
        return reply.code(400).send({ erro: 'Desenho inválido ou grande demais.' });
      if (!validarContorno(body.contorno)) return reply.code(400).send({ erro: 'Contorno do peixe inválido.' });
      auth.stmts.salvarDesenho.run(bytes.toString('base64'), JSON.stringify(body.contorno), u.id);
    } else {
      return reply.code(400).send({ erro: 'Formato inválido.' });
    }
    eventos.aoMudarAparencia(u.id);
    return auth.me(auth.porId(u.id)!);
  });

  app.get('/api/peixe/:arquivo', async (req, reply) => {
    const { arquivo } = req.params as { arquivo: string };
    const id = Number(/^(\d+)\.png$/.exec(arquivo)?.[1]);
    const u = id ? auth.porId(id) : null;
    if (!u?.fish_png) return reply.code(404).send({ erro: 'Peixe não encontrado.' });
    reply.header('Content-Type', 'image/png').header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.send(Buffer.from(u.fish_png, 'base64'));
  });
}
