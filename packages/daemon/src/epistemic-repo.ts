// packages/daemon/src/epistemic-repo.ts

import { createHash } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  AIFNodePartition,
  AIFRuleModality,
  AIFSchemeSubType,
  EpistemicAIFEngine,
  type CanonicalNoteType
} from '@jarvis/core';
import type { JarvisDB } from './db.js';

interface RawNodeRow {
  id: Buffer;
  canonical_uri: string;
  partition: number;
  scheme_type: number;
  rule_modality: number;
  canonical_note_type: string;
  domain_field: string;
  physical_path: string;
  is_placeholder: number;
  payload_excerpt: string | null;
}

interface RawEdgeRow {
  source_id: Buffer;
  target_id: Buffer;
  edge_type: number;
  weight: number;
}

/**
 * Gera um hash binário determinístico de 16 bytes (128 bits) a partir do URI canônico MMT
 * para indexação compacta em árvores B+ WITHOUT ROWID no SQLite.
 */
export function computeUriBlobId(canonicalUri: string): Buffer {
  return createHash('md5').update(canonicalUri, 'utf8').digest();
}

/**
 * Repositório de persistência relacional do Grafo Bipartido AIF no SQLite (`jarvis.db`),
 * com isolamento estrito por `profile_id` e leituras sub-milissegundo via `WITHOUT ROWID`.
 */
export class EpistemicRepository {
  private deleteNodesByProfileStmt: Database.Statement;
  private deleteEdgesByProfileStmt: Database.Statement;
  private insertNodeStmt: Database.Statement;
  private insertEdgeStmt: Database.Statement;
  private selectNodesByProfileStmt: Database.Statement;
  private selectEdgesByProfileStmt: Database.Statement;

  constructor(private db: JarvisDB) {
    this.deleteNodesByProfileStmt = this.db.prepare(
      'DELETE FROM epistemic_nodes WHERE profile_id = ?'
    );
    this.deleteEdgesByProfileStmt = this.db.prepare(
      'DELETE FROM epistemic_edges WHERE profile_id = ?'
    );

    this.insertNodeStmt = this.db.prepare(`
      INSERT INTO epistemic_nodes (
        profile_id,
        id,
        canonical_uri,
        partition,
        scheme_type,
        rule_modality,
        canonical_note_type,
        domain_field,
        physical_path,
        is_placeholder,
        payload_excerpt,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.insertEdgeStmt = this.db.prepare(`
      INSERT INTO epistemic_edges (
        profile_id,
        source_id,
        target_id,
        edge_type,
        weight
      ) VALUES (?, ?, ?, ?, ?)
    `);

    this.selectNodesByProfileStmt = this.db.prepare(`
      SELECT
        id,
        canonical_uri,
        partition,
        scheme_type,
        rule_modality,
        canonical_note_type,
        domain_field,
        physical_path,
        is_placeholder,
        payload_excerpt
      FROM epistemic_nodes
      WHERE profile_id = ?
    `);

    this.selectEdgesByProfileStmt = this.db.prepare(`
      SELECT
        source_id,
        target_id,
        edge_type,
        weight
      FROM epistemic_edges
      WHERE profile_id = ?
    `);
  }

  /**
   * Persiste atomicamente todo o estado de um `EpistemicAIFEngine` para o `profileId` informado.
   */
  public saveEngineSnapshot(profileId: string, engine: EpistemicAIFEngine): void {
    const nodes = engine.getAllNodes();
    const edges = engine.getAllEdges();
    const now = Date.now();

    const internalIdToBlob = new Array<Buffer>(nodes.length);

    const tx = this.db.transaction(() => {
      this.deleteEdgesByProfileStmt.run(profileId);
      this.deleteNodesByProfileStmt.run(profileId);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!;
        const blobId = computeUriBlobId(node.uri.canonical);
        internalIdToBlob[node.internalId] = blobId;

        this.insertNodeStmt.run(
          profileId,
          blobId,
          node.uri.canonical,
          node.partition,
          node.schemeSubType,
          node.ruleModality,
          node.canonicalNoteType,
          node.uri.mod,
          node.physicalFilePath,
          node.isPlaceholder ? 1 : 0,
          node.markdownExcerpt,
          now
        );
      }

      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i]!;
        const srcBlob = internalIdToBlob[edge.sourceId]!;
        const dstBlob = internalIdToBlob[edge.targetId]!;

        this.insertEdgeStmt.run(
          profileId,
          srcBlob,
          dstBlob,
          edge.edgeType,
          edge.weight
        );
      }
    });

    tx();
  }

  /**
   * Carrega instantaneamente (< 1ms para subgrafos típicos) um `EpistemicAIFEngine`
   * a partir das tabelas indexadas do SQLite para o `profileId` informado.
   */
  public loadEngineSnapshot(profileId: string): EpistemicAIFEngine {
    const engine = new EpistemicAIFEngine();
    const rawNodes = this.selectNodesByProfileStmt.all(profileId) as RawNodeRow[];
    const rawEdges = this.selectEdgesByProfileStmt.all(profileId) as RawEdgeRow[];

    const blobHexToInternalId = new Map<string, number>();

    for (let i = 0; i < rawNodes.length; i++) {
      const row = rawNodes[i]!;
      const descriptor = engine.addNode({
        rawUri: row.canonical_uri,
        partition: row.partition as AIFNodePartition,
        schemeSubType: row.scheme_type as AIFSchemeSubType,
        ruleModality: row.rule_modality as AIFRuleModality,
        canonicalNoteType: (row.canonical_note_type || 'generic') as CanonicalNoteType,
        physicalFilePath: row.physical_path,
        markdownExcerpt: row.payload_excerpt ?? '',
        isPlaceholder: row.is_placeholder === 1
      });
      blobHexToInternalId.set(row.id.toString('hex'), descriptor.internalId);
    }

    for (let i = 0; i < rawEdges.length; i++) {
      const edgeRow = rawEdges[i]!;
      const u = blobHexToInternalId.get(edgeRow.source_id.toString('hex'));
      const v = blobHexToInternalId.get(edgeRow.target_id.toString('hex'));
      if (u !== undefined && v !== undefined) {
        engine.addBipartiteEdge(u, v, edgeRow.weight);
      }
    }

    return engine;
  }

  /**
   * Remove todos os nós e arestas epistêmicos de um perfil.
   */
  public clearProfileSnapshot(profileId: string): void {
    const tx = this.db.transaction(() => {
      this.deleteEdgesByProfileStmt.run(profileId);
      this.deleteNodesByProfileStmt.run(profileId);
    });
    tx();
  }
}
