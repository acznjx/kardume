import { DatabaseSync } from 'node:sqlite';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type DB = DatabaseSync;

export function abrirBanco(caminho = process.env.CARDUME_DB ?? resolve(import.meta.dirname, '../../../data/cardume.db')) {
  if (caminho !== ':memory:') mkdirSync(dirname(caminho), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(caminho);
  // o banco tem hashes de senha e e-mails: só o usuário do sistema que roda o servidor lê
  // (no Windows o chmod quase não tem efeito; lá vale a permissão da pasta)
  if (caminho !== ':memory:' && existsSync(caminho)) {
    try {
      chmodSync(caminho, 0o600);
    } catch {
      /* sistema de arquivos sem permissões POSIX */
    }
  }
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    -- funções/visões do schema não rodam com privilégio extra (defesa contra banco adulterado)
    PRAGMA trusted_schema = OFF;
    -- dados apagados (sessões, contas excluídas) são zerados no arquivo, não só marcados como livres
    PRAGMA secure_delete = ON;

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
  // um e-mail por conta, sem diferenciar maiúsculas
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email COLLATE NOCASE) WHERE email IS NOT NULL');
  aplicarRestricoes(db);
  return db;
}

/**
 * Limites validados TAMBÉM no banco, não só nas rotas: se um bug ou um script esquecer
 * de validar, o SQLite recusa o dado. Como o SQLite não deixa adicionar CHECK em tabela
 * existente, as regras são triggers recriadas a cada início (idempotente: rodar duas
 * vezes dá o mesmo resultado, e mudar um limite aqui vale para bancos antigos).
 */
function aplicarRestricoes(db: DB) {
  const regrasUsuario = `
    SELECT CASE
      WHEN length(NEW.username) NOT BETWEEN 3 AND 20 THEN RAISE(ABORT, 'users.username: tamanho')
      WHEN NEW.username GLOB '*[^A-Za-z0-9._-]*' THEN RAISE(ABORT, 'users.username: caracteres')
      WHEN length(NEW.senha_hash) NOT BETWEEN 50 AND 100 THEN RAISE(ABORT, 'users.senha_hash: formato')
      WHEN NEW.email IS NOT NULL AND (length(NEW.email) > 254 OR NEW.email NOT LIKE '%_@_%') THEN RAISE(ABORT, 'users.email: formato')
      WHEN NEW.fish_png IS NOT NULL AND length(NEW.fish_png) > 470000 THEN RAISE(ABORT, 'users.fish_png: tamanho')
      WHEN NEW.fish_contorno IS NOT NULL AND length(NEW.fish_contorno) > 8000 THEN RAISE(ABORT, 'users.fish_contorno: tamanho')
      WHEN NEW.fish_modelo IS NOT NULL AND length(NEW.fish_modelo) > 32 THEN RAISE(ABORT, 'users.fish_modelo: tamanho')
      WHEN NEW.roupa IS NOT NULL AND length(NEW.roupa) > 500 THEN RAISE(ABORT, 'users.roupa: tamanho')
      WHEN NEW.fish_versao < 0 OR NEW.created_at <= 0 THEN RAISE(ABORT, 'users: valores')
    END;`;
  const regrasSessao = `
    SELECT CASE
      WHEN length(NEW.token_hash) != 64 OR NEW.token_hash GLOB '*[^0-9a-f]*' THEN RAISE(ABORT, 'sessions.token_hash: formato')
      WHEN NEW.expires_at <= 0 THEN RAISE(ABORT, 'sessions.expires_at: valor')
    END;`;
  db.exec(`
    DROP TRIGGER IF EXISTS users_valida_insert;
    DROP TRIGGER IF EXISTS users_valida_update;
    DROP TRIGGER IF EXISTS sessions_valida_insert;
    CREATE TRIGGER users_valida_insert BEFORE INSERT ON users BEGIN ${regrasUsuario} END;
    CREATE TRIGGER users_valida_update BEFORE UPDATE ON users BEGIN ${regrasUsuario} END;
    CREATE TRIGGER sessions_valida_insert BEFORE INSERT ON sessions BEGIN ${regrasSessao} END;
  `);
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
