import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { abrirBanco } from './db';

const pasta = mkdtempSync(join(tmpdir(), 'kardume-db-'));
afterAll(() => rmSync(pasta, { recursive: true, force: true }));
const HASH = '$2a$10$' + 'a'.repeat(53);

describe('schema do banco', () => {
  it('pode ser aplicado várias vezes sem erro', () => {
    const arquivo = join(pasta, 'x.db');
    abrirBanco(arquivo).close();
    abrirBanco(arquivo).close();
    const db = abrirBanco(arquivo);
    expect(db.prepare('SELECT count(*) AS n FROM users').get()).toEqual({ n: 0 });
    db.close();
  });

  it('o próprio banco recusa dados fora dos limites', () => {
    const db = abrirBanco(':memory:');
    const inserir = db.prepare('INSERT INTO users (username, senha_hash, created_at, email) VALUES (?, ?, ?, ?)');
    inserir.run('tito', HASH, Date.now(), 'a@b.com');
    expect(() => inserir.run('ab', HASH, Date.now(), null)).toThrow(/username/);
    expect(() => inserir.run('<b>oi', HASH, Date.now(), null)).toThrow(/username/);
    expect(() => inserir.run('luna', HASH, Date.now(), 'A@B.COM')).toThrow(/UNIQUE/); // e-mail repetido
    expect(() => inserir.run('TITO', HASH, Date.now(), null)).toThrow(/UNIQUE/); // nome repetido
    expect(() => inserir.run('luna', 'senha-em-texto', Date.now(), null)).toThrow(/senha_hash/);
    expect(() => db.prepare('UPDATE users SET roupa = ? WHERE id = 1').run('x'.repeat(600))).toThrow(/roupa/);
    expect(() => db.prepare('INSERT INTO sessions VALUES (?, 1, ?)').run('token-cru', Date.now())).toThrow(/token_hash/);
    db.close();
  });

  it('excluir a conta apaga as sessões junto', () => {
    const db = abrirBanco(':memory:');
    db.prepare('INSERT INTO users (username, senha_hash, created_at) VALUES (?, ?, ?)').run('tito', HASH, Date.now());
    db.prepare('INSERT INTO sessions VALUES (?, 1, ?)').run('a'.repeat(64), Date.now() + 1000);
    db.prepare('DELETE FROM users WHERE id = 1').run();
    expect(db.prepare('SELECT count(*) AS n FROM sessions').get()).toEqual({ n: 0 });
    db.close();
  });
});
