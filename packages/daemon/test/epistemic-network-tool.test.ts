// packages/daemon/test/epistemic-network-tool.test.ts

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initVaultContext } from '../src/vault-context.js';
import { ToolExecutor } from '../src/tool-executor.js';
import { jarvisTools } from '../src/tool-registry.js';

describe('Sub-etapa 3.6: Tool get_epistemic_network (Modo Conceito & Modo Campo) & Injeção XML', () => {
  let tempVaultDir: string;

  beforeEach(() => {
    tempVaultDir = mkdtempSync(join(tmpdir(), 'jarvis-epistemic-tool-'));
    mkdirSync(join(tempVaultDir, 'conceitos'), { recursive: true });

    // Domínio externo: Teoria dos Conjuntos
    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Conjunto.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Conjuntos]]

---
---
Um conjunto é uma coleção bem-definida de objetos distintos.`,
      'utf-8'
    );

    // Domínio principal: Teoria dos Grafos
    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Vértice.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Conjunto]]

---
---
Um vértice é o elemento fundamental de incidência em estruturas discretas.`,
      'utf-8'
    );

    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Aresta.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]

---
---
Uma aresta é o par de vértices que estabelece relação de adjacência.`,
      'utf-8'
    );

    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Grafo.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concepts**:
  - [[Def - Vértice]], [[Def - Aresta]]

---
---
Um grafo é uma tupla ordenada G = (V, E) composta por um conjunto de vértices e arestas.`,
      'utf-8'
    );

    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Grafo Conexo.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Grafo]]

---
---
Um grafo é conexo se existe pelo menos um caminho entre qualquer par de vértices distintos.`,
      'utf-8'
    );
  });

  afterEach(() => {
    rmSync(tempVaultDir, { recursive: true, force: true });
  });

  it('1. registra get_epistemic_network no catálogo jarvisTools preservando get_graph_neighborhood', () => {
    const names = jarvisTools.map(t => t.function.name);
    expect(names).toContain('get_epistemic_network');
    expect(names).toContain('get_graph_neighborhood');
  });

  it('2. Modo Conceito: retorna o cone reverso estratificado (0 -> 1 -> 2), isola âncoras externas (Lazy Flattening) e gera XML válido', async () => {
    const ctx = await initVaultContext(tempVaultDir);
    const executor = new ToolExecutor(ctx);

    const res = await executor.execute('get_epistemic_network', {
      targetNote: 'Def - Grafo Conexo'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.mode).toBe('concept');
    expect(res.data.domainField).toBe('Teoria dos Grafos');
    expect(res.data.targetExists).toBe(true);
    expect(res.data.maxTopologicalLevel).toBe(3);

    const byName = new Map(
      res.data.stratifiedConcepts.map((c: any) => [c.symbolName, c.topologicalLevel])
    );
    expect(byName.get('Def - Aresta')).toBe(0);
    expect(byName.get('Def - Vértice')).toBe(1); // fundamentado externamente em Def - Conjunto (0) -> nível 1
    expect(byName.get('Def - Grafo')).toBe(2); // max(Vértice=1, Aresta=0) + 1 = 2
    expect(byName.get('Def - Grafo Conexo')).toBe(3);

    // Lazy Flattening: Def - Conjunto NÃO entra em stratifiedConcepts de Teoria dos Grafos, mas entra em externalBoundaryAnchors!
    expect(byName.has('Def - Conjunto')).toBe(false);
    expect(res.data.externalBoundaryAnchors).toHaveLength(1);
    expect(res.data.externalBoundaryAnchors[0].uri).toBe(
      'jarvis://vault?Teoria dos Conjuntos?Def - Conjunto'
    );

    expect(res.data.llmContextXml).toContain('<contexto_epistemico_modular');
    expect(res.data.llmContextXml).toContain('<hierarquia_fundacional_dag>');
    expect(res.data.llmContextXml).toContain('<ancoras_de_fronteira_externa>');
    expect(res.data.llmContextXml).toContain(
      'uri="jarvis://vault?Teoria dos Conjuntos?Def - Conjunto"'
    );
  });

  it('3. Modo Campo (caso de uso /create): não lança erro quando targetNote ainda não existe em disco e retorna toda a árvore estratificada do domainField', async () => {
    const ctx = await initVaultContext(tempVaultDir);
    const executor = new ToolExecutor(ctx);

    const res = await executor.execute('get_epistemic_network', {
      targetNote: 'Theo - Árvore Geradora Mínima', // Nota que ainda será criada pelo comando /create!
      domainField: 'Teoria dos Grafos'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.mode).toBe('domain');
    expect(res.data.targetExists).toBe(false);
    expect(res.data.domainField).toBe('Teoria dos Grafos');

    const symbols = res.data.stratifiedConcepts.map((c: any) => c.symbolName);
    expect(symbols).toContain('Def - Vértice');
    expect(symbols).toContain('Def - Aresta');
    expect(symbols).toContain('Def - Grafo');
    expect(symbols).toContain('Def - Grafo Conexo');
    expect(res.data.llmContextXml).toContain('mode="domain"');
    expect(res.data.llmContextXml).toContain('target_exists="false"');
  });

  it('4. Quebra de ciclo não-destrutiva: retorna cycleWarnings no JSON e gera <referencias_associativas_ciclo_quebrado> no XML', async () => {
    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Caminho.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Componente Conexo]]

Sequência de vértices adjacentes.`,
      'utf-8'
    );

    writeFileSync(
      join(tempVaultDir, 'conceitos', 'Def - Componente Conexo.md'),
      `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Caminho]]

Subgrafo conexo maximal.`,
      'utf-8'
    );

    const ctx = await initVaultContext(tempVaultDir);
    const executor = new ToolExecutor(ctx);

    const res = await executor.execute('get_epistemic_network', {
      domainField: 'Teoria dos Grafos'
    });

    expect(res.isSuccess).toBe(true);
    expect(res.data.cycleWarnings.length).toBeGreaterThanOrEqual(1);
    expect(res.data.llmContextXml).toContain('<referencias_associativas_ciclo_quebrado>');
    expect(res.data.llmContextXml).toContain(
      'motivo="Dependência circular rebaixada em memória (S->I) para preservar a aciclicidade da dedução"'
    );
  });

  it('5. Sincronização reativa: após propose_create, a nova nota aparece imediatamente na próxima consulta get_epistemic_network', async () => {
    const ctx = await initVaultContext(tempVaultDir);
    const executor = new ToolExecutor(ctx);

    const createRes = await executor.execute('propose_create', {
      path: 'conceitos/Theo - Soma dos Graus.md',
      content: `## Map of Content / Tags: #conceito
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Grafo]]

---
---
A soma dos graus de todos os vértices é igual ao dobro do número de arestas.`
    });

    expect(createRes.isSuccess).toBe(true);

    const queryRes = await executor.execute('get_epistemic_network', {
      targetNote: 'Theo - Soma dos Graus'
    });

    expect(queryRes.isSuccess).toBe(true);
    expect(queryRes.data.mode).toBe('concept');
    expect(queryRes.data.targetExists).toBe(true);
    expect(queryRes.data.llmContextXml).toContain(
      'A soma dos graus de todos os vértices é igual ao dobro do número de arestas.'
    );
  });
});
