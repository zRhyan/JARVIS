// packages/daemon/src/proposal-manager.ts

import { randomUUID } from 'node:crypto';
import { PatchEngine } from '@jarvis/core';
import type { JarvisDB } from './db.js';
import type { VaultContext } from './vault-context.js';

export type ProposalStatus = 'PENDING' | 'APPLIED' | 'REJECTED' | 'STALE';

export interface Proposal {
  id: string;
  sessionId: string;
  notePath: string;
  baseHash: string;
  searchBlock: string;
  replaceBlock: string;
  unifiedDiff: string;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface NewProposal {
  sessionId: string;
  notePath: string;
  baseHash: string;
  searchBlock: string;
  replaceBlock: string;
  unifiedDiff: string;
}

export class ProposalStateError extends Error {
  constructor(message: string, public readonly status: ProposalStatus) {
    super(message);
    this.name = 'ProposalStateError';
  }
}

const toProposal = (r: any): Proposal => ({
  id: r.id,
  sessionId: r.session_id,
  notePath: r.note_path,
  baseHash: r.base_hash,
  searchBlock: r.search_block,
  replaceBlock: r.replace_block,
  unifiedDiff: r.unified_diff,
  status: r.status,
  createdAt: r.created_at,
  resolvedAt: r.resolved_at
});

/**
 * Máquina de estados: PENDING -> APPLIED | REJECTED | STALE.
 * A aprovação só grava em disco se o hash atual da nota == base_hash.
 */
export class ProposalStateManager {
  private patchEngine = new PatchEngine();

  constructor(private db: JarvisDB) {}

  create(input: NewProposal): Proposal {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO proposals (id, session_id, note_path, base_hash, search_block, replace_block, unified_diff)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.sessionId, input.notePath, input.baseHash, input.searchBlock, input.replaceBlock, input.unifiedDiff);
    return this.get(id)!;
  }

  get(id: string): Proposal | undefined {
    const r = this.db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
    return r ? toProposal(r) : undefined;
  }

  list(filter: { status?: ProposalStatus; sessionId?: string; profileId?: string } = {}): Proposal[] {
    const where: string[] = [];
    const params: any[] = [];
    if (filter.status) { where.push('p.status = ?'); params.push(filter.status); }
    if (filter.sessionId) { where.push('p.session_id = ?'); params.push(filter.sessionId); }
    if (filter.profileId) { where.push('s.profile_id = ?'); params.push(filter.profileId); }
    const sql = `SELECT p.* FROM proposals p JOIN sessions s ON s.id = p.session_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.created_at DESC, p.rowid DESC`;
    return this.db.prepare(sql).all(...params).map(toProposal);
  }

  private setStatus(id: string, status: ProposalStatus): Proposal {
    this.db.prepare('UPDATE proposals SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return this.get(id)!;
  }

  reject(id: string): Proposal {
    const p = this.requirePending(id);
    return this.setStatus(p.id, 'REJECTED');
  }

  /**
   * Aprova: valida integridade (hash), grava atomicamente e atualiza o grafo.
   * Retorna a proposta resultante (APPLIED ou STALE).
   */
  async approve(id: string, ctx: VaultContext): Promise<Proposal> {
    const p = this.requirePending(id);

    let current;
    try {
      current = await ctx.sandbox.readNote(p.notePath);
    } catch {
      return this.setStatus(p.id, 'STALE');
    }

    if (current.contentHash !== p.baseHash) {
      return this.setStatus(p.id, 'STALE');
    }

    const result = this.patchEngine.applySearchAndReplace(current.content, p.searchBlock, p.replaceBlock, p.notePath);
    if (!result.isSuccess || result.patchedContent === undefined) {
      return this.setStatus(p.id, 'STALE');
    }

    const written = await ctx.sandbox.writeAtomic(p.notePath, result.patchedContent);
    ctx.graph.addNote(written.relativePath, written.content);
    return this.setStatus(p.id, 'APPLIED');
  }

  private requirePending(id: string): Proposal {
    const p = this.get(id);
    if (!p) throw new ProposalStateError(`Proposta "${id}" não encontrada.`, 'STALE');
    if (p.status !== 'PENDING') {
      throw new ProposalStateError(`Proposta já resolvida (${p.status}).`, p.status);
    }
    return p;
  }
}
