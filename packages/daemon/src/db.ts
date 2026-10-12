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
  return db;
}
