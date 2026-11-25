import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { AddressInfo } from 'node:net';
import { io as conectar, type Socket } from 'socket.io-client';
import { ASSENTO_POR_ID, FAIXAS, INTERACAO_POR_ID, PORTAS, type ClientToServer, type EstadoJogador, type ServerToClient } from '@cardume/shared';
import { criarServidor } from './app';

process.env.LOG_LEVEL = 'silent';

type Cli = Socket<ServerToClient, ClientToServer>;
let app: FastifyInstance;
let url: string;
const abertos: Cli[] = [];

beforeAll(async () => {
  app = await criarServidor({ caminhoBanco: ':memory:' });
  await app.listen({ port: 0, host: '127.0.0.1' });
  url = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  abertos.forEach((s) => s.disconnect());
  await app.close();
});

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function jogador(nome: string) {
  const r = await app.inject({ method: 'POST', url: '/api/register', payload: { username: nome, senha: 'senha123', maior18: true } });
  const c = r.headers['set-cookie'];
  const cookie = String(Array.isArray(c) ? c[0] : c).split(';')[0];
  const s: Cli = conectar(url, { extraHeaders: { cookie }, transports: ['websocket'], forceNew: true });
  abertos.push(s);
  const boas = await new Promise<Parameters<ServerToClient['boas_vindas']>[0]>((ok) => s.once('boas_vindas', ok));
  return { s, id: boas.voce, estado: boas.estado };
}

/** Nada até o alvo respeitando o limite de velocidade do servidor. */
async function nadarAte(j: { s: Cli; estado: EstadoJogador }, alvo: readonly number[], modo: 'empe' | 'nadando' = 'empe') {
  const p = [...j.estado.p] as [number, number, number];
  for (let i = 0; i < 200; i++) {
    const d = [alvo[0] - p[0], alvo[1] - p[1], alvo[2] - p[2]];
    const dist = Math.hypot(...d);
    if (dist < 0.05) break;
    const passo = Math.min(dist, 1.2);
    for (let k = 0; k < 3; k++) p[k] += (d[k] / dist) * passo;
    j.s.emit('estado', { p: [...p] as [number, number, number], r: 0, m: modo, v: true });
    await espera(90);
  }
  j.s.emit('estado', { p: [...p] as [number, number, number], r: 0, m: modo, v: false });
  await espera(90);
  j.estado = { p, r: 0, m: modo, v: false };
}

describe('ações sociais', () => {
  it('sentar, lugar ocupado, levantar e brinde coletivo', async () => {
    const a = await jogador('ana_teste');
    const b = await jogador('bia_teste');
    const assento = ASSENTO_POR_ID.get('praca-0')!;

    // longe demais
    const longe = await new Promise<[boolean, string?]>((ok) => a.s.emit('sentar', assento.id, (...r) => ok(r)));
    if (Math.hypot(a.estado.p[0] - assento.pos[0], a.estado.p[2] - assento.pos[2]) > 4.2) expect(longe[0]).toBe(false);

    await nadarAte(a, [assento.pos[0], 1.1, assento.pos[2]]);
    const viuAcao = new Promise<Parameters<ServerToClient['acao']>[0]>((ok) => b.s.once('acao', ok));
    const sentou = await new Promise<[boolean, string?]>((ok) => a.s.emit('sentar', assento.id, (...r) => ok(r)));
    expect(sentou[0]).toBe(true);
    expect((await viuAcao).acao).toEqual({ tipo: 'sentado', assento: assento.id });

    // B tenta o mesmo lugar
    await nadarAte(b, [assento.pos[0] + 1, 1.1, assento.pos[2]]);
    const ocupado = await new Promise<[boolean, string?]>((ok) => b.s.emit('sentar', assento.id, (...r) => ok(r)));
    expect(ocupado).toEqual([false, 'Esse lugar já está ocupado.']);

    // A levanta: o lugar fica livre
    const levantou = new Promise<Parameters<ServerToClient['acao']>[0]>((ok) => b.s.once('acao', ok));
    a.s.emit('levantar');
    expect((await levantou).acao).toBeNull();
    const agora = await new Promise<[boolean, string?]>((ok) => b.s.emit('sentar', assento.id, (...r) => ok(r)));
    expect(agora[0]).toBe(true);

    // brinde coletivo: os dois brindam juntos e perto
    const brinde = new Promise<Parameters<ServerToClient['brinde']>[0]>((ok) => a.s.once('brinde', ok));
    a.s.emit('emote', 'brinde');
    await espera(50);
    b.s.emit('emote', 'brinde');
    const { ids } = await brinde;
    expect(ids.sort()).toEqual([a.id, b.id].sort());
  }, 30_000);

  it('dança começa e para quando o peixe anda', async () => {
    const c = await jogador('caio_teste');
    const d = await jogador('duda_teste');
    const comecou = new Promise<Parameters<ServerToClient['acao']>[0]>((ok) => d.s.once('acao', ok));
    c.s.emit('dancar', 'giro');
    const ev = await comecou;
    expect(ev.id).toBe(c.id);
    expect(ev.acao).toMatchObject({ tipo: 'danca', estilo: 'giro' });

    const parou = new Promise<Parameters<ServerToClient['acao']>[0]>((ok) => d.s.once('acao', ok));
    await espera(100);
    c.s.emit('estado', { p: [c.estado.p[0] + 0.5, c.estado.p[1], c.estado.p[2]], r: 0, m: 'nadando', v: true });
    expect((await parou).acao).toBeNull();
  }, 15_000);

  it('não serve dose fora do balcão', async () => {
    const e = await jogador('edu_teste');
    const nivel = await new Promise<number>((ok) => e.s.emit('pedir_dose', 'dose-0', ok));
    expect(nivel).toBe(0);
  });
});

/** Leva o jogador até a porta da adega (em pé) e entra. */
async function entrarNaAdega(j: { s: Cli; estado: EstadoJogador }) {
  const porta = PORTAS.navio.pos;
  await nadarAte(j, [porta[0], 1.1, porta[2] + 1]);
  const boas = new Promise<Parameters<ServerToClient['boas_vindas']>[0]>((ok) => j.s.once('boas_vindas', ok));
  const r = await new Promise<[boolean, string?]>((ok) => j.s.emit('trocar_sala', 'adega', (...x) => ok(x)));
  expect(r[0]).toBe(true);
  j.estado = (await boas).estado;
}

describe('Javas: dardos e radiola', () => {
  it('um jogador por alvo, três dardos, recorde no placar', async () => {
    const a = await jogador('dardo_ana');
    const b = await jogador('dardo_bia');
    await entrarNaAdega(a);
    await entrarNaAdega(b);
    const linha = INTERACAO_POR_ID.get('dardo-0')!.pos;
    await nadarAte(a, [linha[0], 1.1, linha[2]]);
    await nadarAte(b, [linha[0], 1.1, linha[2] + 0.8]);

    const entrou = await new Promise<[boolean, string?]>((ok) => a.s.emit('dardos_entrar', 0, (...x) => ok(x)));
    expect(entrou[0]).toBe(true);
    const ocupado = await new Promise<[boolean, string?]>((ok) => b.s.emit('dardos_entrar', 0, (...x) => ok(x)));
    expect(ocupado[0]).toBe(false);
    expect(ocupado[1]).toContain('dardo_ana');

    const dardos: Parameters<ServerToClient['dardo']>[0][] = [];
    b.s.on('dardo', (d) => dardos.push(d));
    const placar = new Promise<Parameters<ServerToClient['dardos_placar']>[0]>((ok) => b.s.once('dardos_placar', ok));
    await espera(1000); // contagem regressiva
    for (let i = 0; i < 3; i++) {
      a.s.emit('dardos_arremessar', 1.1 + i * 0.5);
      await espera(520);
    }
    await espera(200);
    expect(dardos.length).toBe(3);
    expect(dardos[2].restam).toBe(0);
    const total = dardos.reduce((s, d) => s + d.acerto.pontos, 0);
    expect(dardos[2].total).toBe(total);
    const p = await placar;
    expect(p.recordes[0]).toEqual({ nome: 'dardo_ana', pontos: total });
  }, 40_000);

  it('votos na radiola chegam a todos', async () => {
    const c = await jogador('radio_caio');
    await entrarNaAdega(c);
    const faixa = FAIXAS[2].id;
    const ev = new Promise<Parameters<ServerToClient['radiola']>[0]>((ok) => {
      c.s.on('radiola', (e) => {
        if (e.votos[faixa]) ok(e);
      });
    });
    c.s.emit('radiola_votar', faixa);
    expect((await ev).votos[faixa]).toBe(1);
  }, 30_000);
});
