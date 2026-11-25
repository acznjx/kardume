import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { deflateSync } from 'node:zlib';
import { criarServidor } from './app';

/** Gera um PNG RGBA transparente de w x h (para testes). */
function pngVazio(w: number, h: number) {
  const crcTabela = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTabela[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const bloco = (tipo: string, dados: Buffer) => {
    const t = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(dados.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(t));
    return Buffer.concat([len, t, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const cru = Buffer.alloc((w * 4 + 1) * h);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(cru)),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

process.env.LOG_LEVEL = 'silent';

let app: FastifyInstance;
beforeAll(async () => {
  app = await criarServidor({ caminhoBanco: ':memory:' });
  await app.ready();
});
afterAll(() => app.close());

const cookieDe = (res: { headers: Record<string, unknown> }) => {
  const c = res.headers['set-cookie'];
  return String(Array.isArray(c) ? c[0] : c).split(';')[0];
};

describe('contas', () => {
  it('recusa cadastro sem confirmar maioridade', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/register', payload: { username: 'tito', senha: 'senha123' } });
    expect(r.statusCode).toBe(400);
  });

  it('cadastra, mantém a sessão e faz login/logout', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: { username: 'tito', senha: 'senha123', maior18: true, lembrar: true },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ username: 'tito', aparencia: null });
    const cookie = cookieDe(r);

    const me = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } });
    expect(me.json().username).toBe('tito');

    const dup = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: { username: 'TITO', senha: 'outrasenha', maior18: true },
    });
    expect(dup.statusCode).toBe(409);

    const errado = await app.inject({ method: 'POST', url: '/api/login', payload: { username: 'tito', senha: 'errada1' } });
    expect(errado.statusCode).toBe(401);

    const ok = await app.inject({ method: 'POST', url: '/api/login', payload: { username: 'tito', senha: 'senha123' } });
    expect(ok.statusCode).toBe(200);

    await app.inject({ method: 'POST', url: '/api/logout', headers: { cookie } });
    const depois = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } });
    expect(depois.statusCode).toBe(401);
  });

  it('salva modelo pronto e valida desenho', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: { username: 'luna', senha: 'senha123', maior18: true },
    });
    const cookie = cookieDe(r);

    const modelo = await app.inject({ method: 'PUT', url: '/api/me/fish', headers: { cookie }, payload: { tipo: 'modelo', modelo: 'luna' } });
    expect(modelo.json().aparencia).toMatchObject({ tipo: 'modelo', modelo: 'luna' });

    const invalido = await app.inject({
      method: 'PUT',
      url: '/api/me/fish',
      headers: { cookie },
      payload: { tipo: 'desenho', png: 'data:image/png;base64,AAAA', contorno: [[0, 0]] },
    });
    expect(invalido.statusCode).toBe(400);

    // PNG 1x1 é recusado (só aceita o tamanho do editor, 512x256)
    const pequeno =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const recusado = await app.inject({
      method: 'PUT',
      url: '/api/me/fish',
      headers: { cookie },
      payload: { tipo: 'desenho', png: pequeno, contorno: [[0.1, 0.1], [0.9, 0.2], [0.5, 0.9]] },
    });
    expect(recusado.statusCode).toBe(400);

    const png = 'data:image/png;base64,' + pngVazio(512, 256).toString('base64');
    const contorno = [
      [0.1, 0.1],
      [0.9, 0.2],
      [0.5, 0.9],
    ];
    const desenho = await app.inject({ method: 'PUT', url: '/api/me/fish', headers: { cookie }, payload: { tipo: 'desenho', png, contorno } });
    expect(desenho.statusCode).toBe(200);
    const ap = desenho.json().aparencia;
    expect(ap.tipo).toBe('desenho');
    const img = await app.inject({ method: 'GET', url: ap.png });
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toBe('image/png');
  });

  it('roupeiro: salva a roupa e ela vai junto na aparência', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.2', payload: { username: 'bia', senha: 'senha123', maior18: true } });
    const cookie = cookieDe(r);
    expect(r.json().roupa).toMatchObject({ chapeu: 'nenhum', tenis: 'creme' });
    await app.inject({ method: 'PUT', url: '/api/me/fish', headers: { cookie }, payload: { tipo: 'modelo', modelo: 'bia' } });

    const roupa = { chapeu: 'cartola', corChapeu: 'vinho', oculos: 'coracao', pescoco: 'cachecol', corPescoco: 'teal', tenis: 'preto' };
    const salvo = await app.inject({ method: 'PUT', url: '/api/me/roupa', headers: { cookie }, payload: { roupa } });
    expect(salvo.statusCode).toBe(200);
    expect(salvo.json().roupa).toEqual(roupa);
    expect(salvo.json().aparencia.roupa).toEqual(roupa);

    // peça desconhecida vira o padrão em vez de quebrar
    const estranho = await app.inject({ method: 'PUT', url: '/api/me/roupa', headers: { cookie }, payload: { roupa: { chapeu: 'capacete-nasa' } } });
    expect(estranho.json().roupa.chapeu).toBe('nenhum');
    const ruim = await app.inject({ method: 'PUT', url: '/api/me/roupa', headers: { cookie }, payload: { roupa: 'cartola' } });
    expect(ruim.statusCode).toBe(400);
  });

  it('perfil: troca nome e e-mail, sem repetir de outra conta', async () => {
    const a = cookieDe(await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.3', payload: { username: 'nico', senha: 'senha123', maior18: true } }));
    const b = cookieDe(await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.3', payload: { username: 'roxo', senha: 'senha123', maior18: true } }));

    const ok = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: a }, payload: { username: 'nico.novo', email: 'Nico@Exemplo.com' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ username: 'nico.novo', email: 'nico@exemplo.com' });

    const nomeTomado = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: b }, payload: { username: 'NICO.NOVO' } });
    expect(nomeTomado.statusCode).toBe(409);
    const emailTomado = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: b }, payload: { email: 'nico@exemplo.com' } });
    expect(emailTomado.statusCode).toBe(409);
    const emailRuim = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: b }, payload: { email: 'nao-e-email' } });
    expect(emailRuim.statusCode).toBe(400);

    const semEmail = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: a }, payload: { email: '' } });
    expect(semEmail.json().email).toBeNull();

    const login = await app.inject({ method: 'POST', url: '/api/login', remoteAddress: '10.0.0.3', payload: { username: 'nico.novo', senha: 'senha123' } });
    expect(login.statusCode).toBe(200);
  });

  it('senha: exige a atual e derruba as outras sessões', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.4', payload: { username: 'oculos', senha: 'senha123', maior18: true } });
    const esta = cookieDe(r);
    const outra = cookieDe(await app.inject({ method: 'POST', url: '/api/login', remoteAddress: '10.0.0.4', payload: { username: 'oculos', senha: 'senha123' } }));

    const errada = await app.inject({ method: 'PUT', url: '/api/me/senha', headers: { cookie: esta }, payload: { atual: 'errada1', nova: 'novasenha' } });
    expect(errada.statusCode).toBe(401);

    const ok = await app.inject({ method: 'PUT', url: '/api/me/senha', headers: { cookie: esta }, payload: { atual: 'senha123', nova: 'novasenha' } });
    expect(ok.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: esta } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: outra } })).statusCode).toBe(401);

    const nova = await app.inject({ method: 'POST', url: '/api/login', remoteAddress: '10.0.0.4', payload: { username: 'oculos', senha: 'novasenha' } });
    expect(nova.statusCode).toBe(200);
  });
});

describe('segurança', () => {
  it('manda os cabeçalhos de segurança em toda resposta', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/online' });
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['content-security-policy']).toContain("object-src 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(r.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.headers['x-powered-by']).toBeUndefined();
    // fora de produção com HTTPS não pode haver HSTS
    expect(r.headers['strict-transport-security']).toBeUndefined();
    const nf = await app.inject({ method: 'GET', url: '/api/nao-existe' });
    expect(nf.headers['x-content-type-options']).toBe('nosniff');
  });

  it('recusa POST vindo de outro site (CSRF)', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/login',
      remoteAddress: '10.0.0.5',
      headers: { origin: 'https://malvado.example', host: 'localhost:3000' },
      payload: { username: 'tito', senha: 'senha123' },
    });
    expect(r.statusCode).toBe(403);
    const ok = await app.inject({
      method: 'POST',
      url: '/api/login',
      remoteAddress: '10.0.0.5',
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
      payload: { username: 'tito', senha: 'senha123' },
    });
    expect(ok.statusCode).toBe(200);
  });

  it('recusa senha acima de 72 bytes (limite do bcrypt)', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/register',
      remoteAddress: '10.0.0.6',
      payload: { username: 'longa', senha: 'x'.repeat(73), maior18: true },
    });
    expect(r.statusCode).toBe(400);
  });

  it('não devolve detalhes internos em JSON malformado', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/login',
      remoteAddress: '10.0.0.7',
      headers: { 'content-type': 'application/json' },
      payload: '{"username": ',
    });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toEqual({ erro: 'Requisição inválida.' });
  });

  it('isola as contas: cada sessão só vê e altera os próprios dados', async () => {
    const a = cookieDe(await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.8', payload: { username: 'dono.a', senha: 'senha123', maior18: true } }));
    const b = cookieDe(await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.8', payload: { username: 'dono.b', senha: 'senha123', maior18: true } }));
    const idB = (await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: b } })).json().id;
    // mesmo mandando o id de B no corpo, A só altera a si mesmo
    const r = await app.inject({ method: 'PATCH', url: '/api/me/perfil', headers: { cookie: a }, payload: { id: idB, username: 'invadido' } });
    expect(r.json().username).toBe('invadido');
    expect((await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: b } })).json().username).toBe('dono.b');
    // exportação traz só a conta da sessão
    const dados = (await app.inject({ method: 'GET', url: '/api/me/dados', headers: { cookie: b } })).json();
    expect(dados.conta.nome).toBe('dono.b');
    expect(JSON.stringify(dados)).not.toContain('senha_hash');
    // sem sessão, nada
    expect((await app.inject({ method: 'GET', url: '/api/me/dados' })).statusCode).toBe(401);
  });

  it('exclui a conta só com a senha e derruba a sessão', async () => {
    const c = cookieDe(await app.inject({ method: 'POST', url: '/api/register', remoteAddress: '10.0.0.9', payload: { username: 'tchau', senha: 'senha123', maior18: true } }));
    expect((await app.inject({ method: 'DELETE', url: '/api/me', headers: { cookie: c }, payload: { senha: 'errada99' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'DELETE', url: '/api/me', headers: { cookie: c }, payload: { senha: 'senha123' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: c } })).statusCode).toBe(401);
    const login = await app.inject({ method: 'POST', url: '/api/login', remoteAddress: '10.0.0.9', payload: { username: 'tchau', senha: 'senha123' } });
    expect(login.statusCode).toBe(401);
  });

  it('trava a conta depois de muitas senhas erradas, com a mesma resposta para conta inexistente', async () => {
    const tentar = (username: string, senha: string, ip: string) =>
      app.inject({ method: 'POST', url: '/api/login', remoteAddress: ip, payload: { username, senha } });
    // IPs diferentes para não cair no limite por IP (simula ataque distribuído)
    for (let i = 0; i < 10; i++) expect((await tentar('tito', 'errada99', `10.1.0.${i}`)).statusCode).toBe(401);
    expect((await tentar('tito', 'senha123', '10.1.0.50')).statusCode).toBe(429);
    for (let i = 0; i < 10; i++) await tentar('ninguem', 'errada99', `10.2.0.${i}`);
    expect((await tentar('ninguem', 'errada99', '10.2.0.50')).statusCode).toBe(429);
  });
});
