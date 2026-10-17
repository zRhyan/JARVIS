// packages/daemon/test/tool-executor.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { initVaultContext } from '../src/vault-context.js';
import { ToolExecutor } from '../src/tool-executor.js';

describe('ToolExecutor - 6 Primitivas do Marco 2', () => {
  const TEST_VAULT = resolve(__dirname, 'fixtures', 'executor-vault');
  let executor: ToolExecutor;
  let ctx: any;

  beforeEach(async () => {
    if (existsSync(TEST_VAULT)) rmSync(TEST_VAULT, { recursive: true, force: true });
    ctx = await initVaultContext(TEST_VAULT);
    executor = new ToolExecutor(ctx);
  });

  afterEach(() => {
    if (existsSync(TEST_VAULT)) rmSync(TEST_VAULT, { recursive: true, force: true });
  });

  it('1. list_notes: Deve listar as notas do cofre', async () => {
    const res = await executor.execute('list_notes', {});
    expect(res.isSuccess).toBe(true);
    expect(res.data.notes).toContain('areas/fisica.md');
    expect(res.data.notes).toContain('conceitos/forca.md');
  });

  it('2. read_note: Deve ler nota e retornar hash', async () => {
    const res = await executor.execute('read_note', { path: 'areas/fisica.md' });
    expect(res.isSuccess).toBe(true);
    expect(res.data.content).toContain('Map of Content');
    expect(res.data.contentHash).toBeDefined();
    expect(res.data.sizeBytes).toBeGreaterThan(0);
  });

  it('3. get_graph_neighborhood: Deve retornar conexões semânticas e backlinks', async () => {
    const res = await executor.execute('get_graph_neighborhood', { path: 'conceitos/forca.md' });
    expect(res.isSuccess).toBe(true);
    expect(res.data.isIndexed).toBe(true);
    expect(res.data.taxonomy.presupposedConcepts).toContain('Massa');
    expect(res.data.outlinks.length).toBeGreaterThan(0);
  });

  it('4. search_notes: Deve encontrar termos e snippets nas notas', async () => {
    const res = await executor.execute('search_notes', { query: 'Termodinâmica' });
    expect(res.isSuccess).toBe(true);
    expect(res.data.totalMatches).toBeGreaterThan(0);
    expect(res.data.matches[0].snippet).toContain('Termodinâmica');
  });

  it('4.1 search_notes: Deve encontrar notas pelo nome do arquivo/caminho mesmo se o conteúdo não contiver o termo exato', async () => {
    const res = await executor.execute('search_notes', { query: 'fisica' });
    expect(res.isSuccess).toBe(true);
    expect(res.data.totalMatches).toBeGreaterThan(0);
    const matchedPaths = res.data.matches.map((m: any) => m.path);
    expect(matchedPaths).toContain('areas/fisica.md');
  });

  it('5. propose_block_replace: Deve gerar proposta com Unified Diff', async () => {
    const res = await executor.execute('propose_block_replace', {
      path: 'conceitos/mecanica.md',
      search_block: '**Derived Concepts**: [[forca]]',
      replace_block: '**Derived Concepts**: [[forca]], [[energia]]'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.status).toBe('PENDING');
    expect(res.data.unifiedDiff).toContain('[[forca]], [[energia]]');
    expect(res.data.unifiedDiff).toContain('--- conceitos/mecanica.md');
    expect(res.data.baseHash).toBeDefined();
  });

  it('5.1 propose_block_replace: Deve suportar inserção no final do arquivo com $END ou block_id=end', async () => {
    const res = await executor.execute('propose_block_replace', {
      path: 'conceitos/mecanica.md',
      search_block: '$END',
      replace_block: '## 4. Outros links\n- [[Link Exemplo]]'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.unifiedDiff).toContain('+## 4. Outros links');
    expect(res.data.patchedContent).toContain('## 4. Outros links');
  });

  it('5.2 propose_block_replace: Deve aplicar em disco quando aprovado (status: APPLIED)', async () => {
    const ctx = await initVaultContext(TEST_VAULT);
    const approvingExecutor = new ToolExecutor(ctx, async () => true);

    const res = await approvingExecutor.execute('propose_block_replace', {
      path: 'conceitos/mecanica.md',
      search_block: '$END',
      replace_block: '## 4. Outros links'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.status).toBe('APPLIED');

    // Confirma que foi gravado de verdade no disco
    const updated = await ctx.sandbox.readNote('conceitos/mecanica.md');
    expect(updated.content).toContain('## 4. Outros links');
  });

  it('5.3 propose_block_replace: Não deve modificar o disco quando rejeitado (status: REJECTED)', async () => {
    const ctx = await initVaultContext(TEST_VAULT);
    const rejectingExecutor = new ToolExecutor(ctx, async () => false);

    const res = await rejectingExecutor.execute('propose_block_replace', {
      path: 'conceitos/mecanica.md',
      search_block: '$END',
      replace_block: '## Conteúdo Cancelado'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.status).toBe('REJECTED');

    // Confirma que o disco permaneceu intacto
    const unchanged = await ctx.sandbox.readNote('conceitos/mecanica.md');
    expect(unchanged.content).not.toContain('## Conteúdo Cancelado');
  });



  it('6. propose_create: Deve criar nota atomicamente e indexar no grafo', async () => {
    const res = await executor.execute('propose_create', {
      path: 'conceitos/entropia.md',
      content: '## Map of Content / Tags: #conceito\n- **Domain Fields**: [[fisica]]'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.path).toBe('conceitos/entropia.md');

    // Tentar criar novamente deve falhar
    const duplicateRes = await executor.execute('propose_create', {
      path: 'conceitos/entropia.md',
      content: 'Novo conteúdo'
    });
    expect(duplicateRes.isSuccess).toBe(false);
    expect(duplicateRes.error).toContain('já existe');
  });

  it('7. resolveNotePath: Deve resolver nota informada sem pasta ou com pasta incorreta', async () => {
    // Cria uma nota em subpasta estruturada
    await ctx.sandbox.writeAtomic(
      '1 - Fields/Field - Operational Systems OS.md',
      '## Map of Content\n- **Broader Fields**: [[Computing]]'
    );
    ctx.graph.addNote(
      '1 - Fields/Field - Operational Systems OS.md',
      '## Map of Content\n- **Broader Fields**: [[Computing]]'
    );

    // 1. read_note com caminho correto
    const resExact = await executor.execute('read_note', {
      path: '1 - Fields/Field - Operational Systems OS.md'
    });
    expect(resExact.isSuccess).toBe(true);

    // 2. read_note apenas com o nome da nota (sem .md e sem pasta)
    const resClean = await executor.execute('read_note', {
      path: 'Field - Operational Systems OS'
    });
    expect(resClean.isSuccess).toBe(true);
    expect(resClean.data.relativePath).toBe('1 - Fields/Field - Operational Systems OS.md');

    // 3. read_note com pasta inventada/incorreta ("Areas/Field - Operational Systems OS.md")
    const resGuessed = await executor.execute('read_note', {
      path: 'Areas/Field - Operational Systems OS.md'
    });
    expect(resGuessed.isSuccess).toBe(true);
    expect(resGuessed.data.relativePath).toBe('1 - Fields/Field - Operational Systems OS.md');

    // 4. get_graph_neighborhood usando apenas o nome
    const resGraph = await executor.execute('get_graph_neighborhood', {
      path: 'Field - Operational Systems OS'
    });
    expect(resGraph.isSuccess).toBe(true);
    expect(resGraph.data.isIndexed).toBe(true);
  });
});
