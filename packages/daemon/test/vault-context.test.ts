import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { initVaultContext } from '../src/vault-context.js';


describe('VaultContext Initialization', () => {
  const TEST_PATH = resolve(__dirname, 'fixtures', 'temp-vault-context');

  beforeEach(() => {
    if (existsSync(TEST_PATH)) rmSync(TEST_PATH, { recursive: true, force: true });
  });

  afterEach(() => {
    if (existsSync(TEST_PATH)) rmSync(TEST_PATH, { recursive: true, force: true });
  });

  it('Deve inicializar o cofre, construir o grafo e carregar as convenções de VAULT.md', async () => {
    const ctx = await initVaultContext(TEST_PATH);

    expect(ctx.vaultPath).toBe(TEST_PATH);
    expect(ctx.sandbox).toBeDefined();
    expect(ctx.graph).toBeDefined();
    expect(ctx.vaultConventions).toBeDefined();
    expect(ctx.vaultConventions).toContain('Diretrizes e Governança do Cofre');

    // Verifica se as notas foram indexadas no Grafo
    const allNodes = ctx.graph.getAllNodes();
    expect(allNodes.length).toBeGreaterThan(0);

    const forcaNode = ctx.graph.getNote('conceitos/forca.md');
    expect(forcaNode).toBeDefined();
    expect(forcaNode?.taxonomy.presupposedConcepts).toContain('Massa');
  });
});
