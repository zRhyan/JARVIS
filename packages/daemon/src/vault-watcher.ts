// packages/daemon/src/vault-watcher.ts

import chokidar, { type FSWatcher } from 'chokidar';
import { relative, resolve } from 'node:path';
import type { VaultContext } from './vault-context.js';

export interface VaultWatcherStats {
  indexedNotes: number;
  lastSyncAt: string | null;
}

export interface VaultWatcherOptions {
  stabilityThreshold?: number;
  pollInterval?: number;
  onSync?: (stats: VaultWatcherStats) => void;
}

export class VaultWatcherService {
  private watcher: FSWatcher | null = null;
  private lastSyncAt: string | null = null;
  private isClosed = false;

  constructor(
    private ctx: VaultContext,
    private options: VaultWatcherOptions = {}
  ) {}

  /**
   * Inicia a observação de alterações no sistema de arquivos do cofre ativo.
   */
  public async start(): Promise<void> {
    if (this.watcher || this.isClosed) return;

    const threshold = this.options.stabilityThreshold ?? 200;
    const pollInterval = this.options.pollInterval ?? 50;

    return new Promise<void>((resolvePromise) => {
      this.watcher = chokidar.watch(this.ctx.vaultPath, {
        ignored: [
          /(^|[/\\])\.(git|obsidian|jarvis|jarvis-tmp)($|[/\\])/,
          /(^|[/\\])node_modules($|[/\\])/
        ],
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: threshold,
          pollInterval
        }
      });

      this.watcher.on('add', (absPath) => this.handleFileUpsert(absPath));
      this.watcher.on('change', (absPath) => this.handleFileUpsert(absPath));
      this.watcher.on('unlink', (absPath) => this.handleFileDelete(absPath));
      this.watcher.on('ready', () => resolvePromise());
      this.watcher.on('error', () => resolvePromise());
    });
  }

  /**
   * Trata a criação ou alteração de uma nota Markdown.
   */
  private async handleFileUpsert(absPath: string, isRetry = false): Promise<void> {
    if (!absPath.endsWith('.md')) return;

    const relPath = relative(this.ctx.vaultPath, resolve(absPath)).replace(/\\/g, '/');

    try {
      const readResult = await this.ctx.sandbox.readNote(relPath);
      this.ctx.graph.addNote(readResult.relativePath, readResult.content);

      // Se for o arquivo de governança raiz, atualiza as convenções em memória
      if (relPath === 'VAULT.md') {
        this.ctx.vaultConventions = readResult.content;
      }

      this.recordSync();
    } catch {
      // Retentativa defensiva para capturar flush em disco do editor
      if (!isRetry) {
        setTimeout(() => {
          this.handleFileUpsert(absPath, true).catch(() => {});
        }, 50);
      }
    }
  }

  /**
   * Trata a exclusão de uma nota Markdown.
   */
  private handleFileDelete(absPath: string): void {
    if (!absPath.endsWith('.md')) return;

    const relPath = relative(this.ctx.vaultPath, resolve(absPath)).replace(/\\/g, '/');
    const wasRemoved = this.ctx.graph.removeNote(relPath);

    if (relPath === 'VAULT.md') {
      this.ctx.vaultConventions = undefined;
    }

    if (wasRemoved || relPath === 'VAULT.md') {
      this.recordSync();
    }
  }

  private recordSync(): void {
    this.lastSyncAt = new Date().toISOString();
    if (this.options.onSync) {
      this.options.onSync(this.getStats());
    }
  }

  /**
   * Retorna as métricas atuais de sincronização do cofre.
   */
  public getStats(): VaultWatcherStats {
    return {
      indexedNotes: this.ctx.graph.getAllNodes().length,
      lastSyncAt: this.lastSyncAt
    };
  }

  /**
   * Encerra o watcher liberando todos os descritores de arquivos abertos.
   */
  public async close(): Promise<void> {
    this.isClosed = true;
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}
