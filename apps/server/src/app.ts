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

export async function criarServidor({ caminhoBanco }: { caminhoBanco?: string } = {}) {
  const app = Fastify({
    // por padrão só avisos e erros; LOG_LEVEL=info mostra cada requisição
    logger: process.env.LOG_LEVEL === 'silent' ? false : { level: process.env.LOG_LEVEL ?? 'warn' },
    // só confie em X-Forwarded-For atrás de um proxy conhecido (ex.: CARDUME_TRUST_PROXY=127.0.0.1 com cloudflared)
    trustProxy: process.env.CARDUME_TRUST_PROXY || false,
  });
  await app.register(cookie);

  const db = abrirBanco(caminhoBanco);
  const auth = criarAuth(db);

  const io = new Server<ClientToServer, ServerToClient>(app.server, {
    path: '/socket.io',
    maxHttpBufferSize: 64_000,
    cors: process.env.NODE_ENV === 'production' ? undefined : { origin: true, credentials: true },
  });
  const salas = criarSalas(io, auth);

  rotasAuth(app, auth, {
    aoMudarAparencia: (userId) => salas.aparenciaMudou(userId),
    aoSair: (token) => salas.desconectarSessao(token),
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
