import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type DB = DatabaseSync;

export function abrirBanco(caminho = process.env.CARDUME_DB ?? resolve(import.meta.dirname, '../../../data/cardume.db')) {
  if (caminho !== ':memory:') mkdirSync(dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      senha_hash    TEXT NOT NULL,
      fish_png      TEXT,
      fish_contorno TEXT,
      fish_modelo   TEXT,
      fish_versao   INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  `);

  // migrações de colunas novas (bancos antigos não têm)
  const colunas = new Set((db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name));
  if (!colunas.has('email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  if (!colunas.has('roupa')) db.exec('ALTER TABLE users ADD COLUMN roupa TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email COLLATE NOCASE) WHERE email IS NOT NULL');
  return db;
}

export interface UserRow {
  id: number;
  username: string;
  senha_hash: string;
  fish_png: string | null;
  fish_contorno: string | null;
  fish_modelo: string | null;
  fish_versao: number;
  created_at: number;
  email: string | null;
  roupa: string | null;
}
