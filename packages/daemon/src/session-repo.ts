// packages/daemon/src/session-repo.ts

import { randomUUID } from 'node:crypto';
import type { JarvisDB } from './db.js';

export interface SessionRow {
  id: string;
  profileId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRow {
  id: string;
  sessionId: string;
  seq: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls: any[] | null;
  toolCallId: string | null;
  createdAt: string;
}

export interface NewMessage {
  role: MessageRow['role'];
  content: string;
  toolCalls?: any[] | null;
  toolCallId?: string | null;
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
}

const toSession = (r: any): SessionRow => ({
  id: r.id,
  profileId: r.profile_id,
  title: r.title,
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

const toMessage = (r: any): MessageRow => ({
  id: r.id,
  sessionId: r.session_id,
  seq: r.seq,
  role: r.role,
  content: r.content,
  toolCalls: r.tool_calls ? JSON.parse(r.tool_calls) : null,
  toolCallId: r.tool_call_id,
  createdAt: r.created_at
});

export class SessionRepository {
  constructor(private db: JarvisDB) {}

  create(profileId: string, title = 'Nova conversa'): SessionRow {
    const id = randomUUID();
    this.db.prepare('INSERT INTO sessions (id, profile_id, title) VALUES (?, ?, ?)').run(id, profileId, title);
    return this.get(id)!;
  }

  get(id: string): SessionRow | undefined {
    const r = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    return r ? toSession(r) : undefined;
  }

  listByProfile(profileId: string, limit = 50, offset = 0): SessionRow[] {
    return this.db
      .prepare('SELECT * FROM sessions WHERE profile_id = ? ORDER BY updated_at DESC, rowid DESC LIMIT ? OFFSET ?')
      .all(profileId, limit, offset)
      .map(toSession);
  }

  rename(id: string, title: string): void {
    this.db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, id);
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id).changes > 0;
  }

  getMessages(sessionId: string): MessageRow[] {
    return this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY seq').all(sessionId).map(toMessage);
  }

  appendMessages(sessionId: string, msgs: NewMessage[]): void {
    const nextSeq = (this.db.prepare('SELECT COALESCE(MAX(seq), -1) + 1 AS n FROM messages WHERE session_id = ?').get(sessionId) as any).n as number;
    const ins = this.db.prepare(
      `INSERT INTO messages (id, session_id, seq, role, content, tool_calls, tool_call_id, token_usage_prompt, token_usage_completion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = this.db.transaction(() => {
      msgs.forEach((m, i) => {
        ins.run(
          randomUUID(),
          sessionId,
          nextSeq + i,
          m.role,
          m.content ?? '',
          m.toolCalls && m.toolCalls.length ? JSON.stringify(m.toolCalls) : null,
          m.toolCallId ?? null,
          m.tokenUsagePrompt ?? 0,
          m.tokenUsageCompletion ?? 0
        );
      });
      this.db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
    });
    tx();
  }
}
