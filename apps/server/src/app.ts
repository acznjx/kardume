import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import type { ClientToServer, ServerToClient } from '@cardume/shared';
import { abrirBanco } from './db';
import { criarAuth, rotasAuth } from './auth';
import { criarSalas } from './rooms';
import { aplicarSeguranca, opcoesDoAmbiente, origemPermitida } from './seguranca';

export async function criarServidor({ caminhoBanco }: { caminhoBanco?: string } = {}) {
  const seg = opcoesDoAmbiente();
  const app = Fastify({
    // corpo pequeno por padrão (login, perfil); só a rota do desenho do peixe aceita mais
    bodyLimit: 32_000,
    // por padrão só avisos e erros; LOG_LEVEL=info mostra cada requisição
    logger: process.env.LOG_LEVEL === 'silent' ? false : { level: process.env.LOG_LEVEL ?? 'warn' },
    // só confie em X-Forwarded-For atrás de um proxy conhecido (ex.: CARDUME_TRUST_PROXY=127.0.0.1 com cloudflared)
    trustProxy: process.env.CARDUME_TRUST_PROXY || false,
  });
  await app.register(cookie);
  // cabeçalhos (CSP, HSTS, nosniff...), checagem de origem e erros sem detalhes internos
  aplicarSeguranca(app, seg);

  const db = abrirBanco(caminhoBanco);
  const auth = criarAuth(db);

  const io = new Server<ClientToServer, ServerToClient>(app.server, {
    path: '/socket.io',
    maxHttpBufferSize: 64_000,
    // sem CORS: o client é sempre da mesma origem (em dev, via proxy do Vite).
    // Antes o dev refletia qualquer origem com credenciais, o que deixava outro site usar a sessão.
    allowRequest: (req, ok) => {
      const encaminhado = process.env.CARDUME_TRUST_PROXY ? req.headers['x-forwarded-host'] : undefined;
      const host = (Array.isArray(encaminhado) ? encaminhado[0] : encaminhado) ?? req.headers.host;
      const fetchSite = req.headers['sec-fetch-site'];
      // bloqueia "cross-site WebSocket hijacking": outro site abrindo socket com o cookie do jogador
      ok(null, origemPermitida(req.headers.origin, host, Array.isArray(fetchSite) ? fetchSite[0] : fetchSite, seg.origensExtras));
    },
  });
  const salas = criarSalas(io, auth);

  rotasAuth(app, auth, {
    aoMudarAparencia: (userId) => salas.aparenciaMudou(userId),
    aoMudarNome: (userId) => salas.nomeMudou(userId),
    aoSair: (token) => salas.desconectarSessao(token),
    aoExcluirConta: (userId) => salas.desconectarConta(userId),
  });
  app.get('/api/online', async () => ({ online: salas.online(), servidor: 'Coral Raso' }));

  // em produção o próprio servidor entrega o client já compilado
  const dist = resolve(import.meta.dirname, '../../client/dist');
  if (existsSync(dist)) {
    await app.register(fastifyStatic, { root: dist, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ erro: 'Rota não encontrada.' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
