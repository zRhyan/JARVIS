// packages/daemon/src/db.ts

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { chmodSync, existsSync } from 'node:fs';
import { ensureDataDir } from './paths.js';

export type JarvisDB = Database.Database;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vault_path TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT,
    tool_call_id TEXT,
    token_usage_prompt INTEGER DEFAULT 0,
    token_usage_completion INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, seq);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    message_id TEXT,
    note_path TEXT NOT NULL,
    base_hash TEXT NOT NULL,
    search_block TEXT NOT NULL,
    replace_block TEXT NOT NULL,
    unified_diff TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'APPLIED', 'REJECTED', 'STALE')) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`;

/**
 * Abre (ou cria) o banco. Use ':memory:' como dataDir-file para testes em memória.
 */
export function openDatabase(dataDir: string, inMemory = false): JarvisDB {
  let db: JarvisDB;
  if (inMemory) {
    db = new Database(':memory:');
  } else {
    ensureDataDir(dataDir);
    const file = join(dataDir, 'jarvis.db');
    const existed = existsSync(file);
    db = new Database(file);
    if (!existed && process.platform !== 'win32') chmodSync(file, 0o600);
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  // Migração defensiva: adiciona message_id em bases existentes
  const columns = db.prepare("PRAGMA table_info(proposals)").all() as Array<{ name: string }>;
  if (columns.length > 0 && !columns.some((c) => c.name === 'message_id')) {
    db.exec("ALTER TABLE proposals ADD COLUMN message_id TEXT;");
  }

  // Normalização defensiva: se uma proposta tem message_id apontando para uma mensagem sem conteúdo de texto (ex: tool call),
  // remapeia para a mensagem de texto do assistente seguinte na mesma sessão
  try {
    db.exec(`
      UPDATE proposals
      SET message_id = (
        SELECT m2.id
        FROM messages m1
        JOIN messages m2 ON m2.session_id = m1.session_id AND m2.seq > m1.seq AND m2.role = 'assistant' AND LENGTH(TRIM(m2.content)) > 0
        WHERE m1.id = proposals.message_id AND LENGTH(TRIM(m1.content)) = 0
        ORDER BY m2.seq ASC
        LIMIT 1
      )
      WHERE message_id IN (
        SELECT id FROM messages WHERE LENGTH(TRIM(content)) = 0
      ) AND EXISTS (
        SELECT 1
        FROM messages m1
        JOIN messages m2 ON m2.session_id = m1.session_id AND m2.seq > m1.seq AND m2.role = 'assistant' AND LENGTH(TRIM(m2.content)) > 0
        WHERE m1.id = proposals.message_id
      );
    `);
  } catch {
    // Silencioso se o schema não suportar
  }

  return db;
}
