// packages/daemon/test/vault-watcher.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { rm, mkdir, writeFile, unlink } from 'node:fs/promises';
import { VaultFSSandbox, GraphIndex } from '@jarvis/core';
import { VaultWatcherService } from '../src/vault-watcher.js';
import type { VaultContext } from '../src/vault-context.js';

describe('VaultWatcherService', () => {
  const TEST_DIR = resolve(__dirname, 'fixtures', 'watcher-vault');
  let ctx: VaultContext;
  let watcher: VaultWatcherService;

  beforeEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await mkdir(TEST_DIR, { recursive: true });

    const sandbox = new VaultFSSandbox(TEST_DIR);
    const graph = new GraphIndex();
    ctx = {
      vaultPath: TEST_DIR,
      sandbox,
      graph
    };
  });

  afterEach(async () => {
    if (watcher) {
      await watcher.close();
    }
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('Deve detectar nova nota criada e indexar no grafo automaticamente', async () => {
    watcher = new VaultWatcherService(ctx, { stabilityThreshold: 50, pollInterval: 20 });
    await watcher.start();

    // Cria a nota fisica.md no disco
    const filePath = join(TEST_DIR, 'fisica.md');
    await writeFile(filePath, '## Map of Content\n- **Broader Fields**: [[Ciência]]', 'utf-8');

    // Aguarda o chokidar processar com debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    const node = ctx.graph.getNote('fisica.md');
    expect(node).toBeDefined();
    expect(ctx.graph.getBacklinks('Ciência')).toContain('fisica.md');

    const stats = watcher.getStats();
    expect(stats.indexedNotes).toBe(1);
    expect(stats.lastSyncAt).not.toBeNull();
  });

  it('Deve detectar alteração em nota existente e atualizar conexões do grafo', async () => {
    watcher = new VaultWatcherService(ctx, { stabilityThreshold: 50, pollInterval: 20 });
    await watcher.start();

    const filePath = join(TEST_DIR, 'nota.md');
    await writeFile(filePath, 'Link para [[AlvoAntigo]]', 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.graph.getBacklinks('AlvoAntigo')).toEqual(['nota.md']);

    // Modifica a nota substituindo o link
    await writeFile(filePath, 'Link para [[AlvoNovo]]', 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.graph.getBacklinks('AlvoAntigo')).toEqual([]);
    expect(ctx.graph.getBacklinks('AlvoNovo')).toEqual(['nota.md']);
  });

  it('Deve detectar exclusão de nota e desindexar do grafo', async () => {
    watcher = new VaultWatcherService(ctx, { stabilityThreshold: 50, pollInterval: 20 });
    await watcher.start();

    const filePath = join(TEST_DIR, 'excluir.md');
    await writeFile(filePath, 'Link para [[Alvo]]', 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.graph.getNote('excluir.md')).toBeDefined();
    expect(ctx.graph.getBacklinks('Alvo')).toEqual(['excluir.md']);

    // Remove o arquivo
    await unlink(filePath);
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.graph.getNote('excluir.md')).toBeUndefined();
    expect(ctx.graph.getBacklinks('Alvo')).toEqual([]);
    expect(watcher.getStats().indexedNotes).toBe(0);
  });

  it('Deve atualizar vaultConventions ao modificar VAULT.md', async () => {
    watcher = new VaultWatcherService(ctx, { stabilityThreshold: 50, pollInterval: 20 });
    await watcher.start();

    const vaultMdPath = join(TEST_DIR, 'VAULT.md');
    await writeFile(vaultMdPath, '# Diretrizes Iniciais', 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.vaultConventions).toBe('# Diretrizes Iniciais');

    await writeFile(vaultMdPath, '# Diretrizes Atualizadas da Equipe', 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(ctx.vaultConventions).toBe('# Diretrizes Atualizadas da Equipe');
  });
});
