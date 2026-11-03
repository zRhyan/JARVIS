// packages/core/test/epistemic-tropical-sort.test.ts

import { describe, expect, it } from 'vitest';
import {
  AIFNodePartition,
  AIFSchemeSubType,
  compileVaultToEpistemicEngine,
  EpistemicAIFEngine,
  MMTUriResolver
} from '../src/index.js';

describe('Sub-etapa 3.4: B-Visit Assimétrico com Álgebra Tropical em TypedArrays', () => {
  it('1. atribui nível 0 aos primitivos locais e nível 1 (sem duplicação +2) à definição direta conjuntiva', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Vértice.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]

Um vértice é o elemento fundamental.`
      },
      {
        relativePath: 'Def - Aresta.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]

Uma aresta conecta dois vértices.`
      },
      {
        relativePath: 'Def - Grafo.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concepts**:
  - [[Def - Vértice]], [[Def - Aresta]]

Um grafo é um par ordenado G = (V, E).`
      }
    ]);

    const result = engine.computeTropicalLevels();

    const vertice = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Vértice')!;
    const aresta = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Aresta')!;
    const grafo = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Grafo')!;

    expect(result.topologicalLevels[vertice.internalId]).toBe(0);
    expect(result.topologicalLevels[aresta.internalId]).toBe(0);
    // Deve ser nível 1 (e NÃO nível 2!)
    expect(result.topologicalLevels[grafo.internalId]).toBe(1);
    expect(result.maxTopologicalLevel).toBe(1);
    expect(result.primitives).toContain(vertice.uri.canonical);
    expect(result.primitives).toContain(aresta.uri.canonical);
    expect(result.layers.get(0)).toHaveLength(2);
    expect(result.layers.get(1)).toEqual([grafo.uri.canonical]);
  });

  it('2. aplica Multiplicação Tropical (max + 1) em S-Nodes conjuntivos com premissas de níveis distintos (1 e 3 -> 4)', () => {
    const engine = new EpistemicAIFEngine();
    const dom = 'Álgebra';

    const addINode = (sym: string) =>
      engine.addNode({
        rawUri: MMTUriResolver.buildNoteUri(sym, dom),
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: `${sym}.md`,
        markdownExcerpt: sym
      });

    const addRANode = (hostSym: string, k: number = 0) =>
      engine.addNode({
        rawUri: MMTUriResolver.buildSchemeUri(MMTUriResolver.buildNoteUri(hostSym, dom), 'ra', k),
        partition: AIFNodePartition.S_NODE,
        schemeSubType: AIFSchemeSubType.RA_DEFINITION,
        physicalFilePath: `${hostSym}.md`,
        markdownExcerpt: `RA ${hostSym}`
      });

    // Cadeia 1: A0 (nível 0) -> S_P1 -> P1 (nível 1)
    const a0 = addINode('Axiom - A0');
    const p1 = addINode('Def - P1');
    const sP1 = addRANode('Def - P1');
    engine.addBipartiteEdge(a0.internalId, sP1.internalId);
    engine.addBipartiteEdge(sP1.internalId, p1.internalId);

    // Cadeia 2: B0 (0) -> B1 (1) -> B2 (2) -> P2 (3)
    const b0 = addINode('Axiom - B0');
    const b1 = addINode('Def - B1');
    const sB1 = addRANode('Def - B1');
    engine.addBipartiteEdge(b0.internalId, sB1.internalId);
    engine.addBipartiteEdge(sB1.internalId, b1.internalId);

    const b2 = addINode('Def - B2');
    const sB2 = addRANode('Def - B2');
    engine.addBipartiteEdge(b1.internalId, sB2.internalId);
    engine.addBipartiteEdge(sB2.internalId, b2.internalId);

    const p2 = addINode('Def - P2');
    const sP2 = addRANode('Def - P2');
    engine.addBipartiteEdge(b2.internalId, sP2.internalId);
    engine.addBipartiteEdge(sP2.internalId, p2.internalId);

    // Teorema T depende conjuntamente de {P1 (nível 1), P2 (nível 3)} no mesmo RA-Node -> nível max(1, 3) + 1 = 4
    const theo = addINode('Theo - T');
    const sTheo = addRANode('Theo - T');
    engine.addBipartiteEdge(p1.internalId, sTheo.internalId);
    engine.addBipartiteEdge(p2.internalId, sTheo.internalId);
    engine.addBipartiteEdge(sTheo.internalId, theo.internalId);

    const result = engine.computeTropicalLevels();

    expect(result.topologicalLevels[p1.internalId]).toBe(1);
    expect(result.topologicalLevels[p2.internalId]).toBe(3);
    expect(result.topologicalLevels[sTheo.internalId]).toBe(4);
    expect(result.topologicalLevels[theo.internalId]).toBe(4);
    expect(result.maxTopologicalLevel).toBe(4);
  });

  it('3. aplica Adição Tropical (min + 0) em I-Nodes com múltiplos RA-Nodes alternativos (Caminho A: 2, Caminho B: 5 -> nível 2)', () => {
    const engine = new EpistemicAIFEngine();
    const dom = 'Análise';

    const addINode = (sym: string) =>
      engine.addNode({
        rawUri: MMTUriResolver.buildNoteUri(sym, dom),
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: `${sym}.md`,
        markdownExcerpt: sym
      });

    const addRANode = (hostSym: string, k: number = 0) =>
      engine.addNode({
        rawUri: MMTUriResolver.buildSchemeUri(MMTUriResolver.buildNoteUri(hostSym, dom), 'ra', k),
        partition: AIFNodePartition.S_NODE,
        schemeSubType: AIFSchemeSubType.RA_DEFINITION,
        physicalFilePath: `${hostSym}.md`,
        markdownExcerpt: `RA ${hostSym}#${k}`
      });

    // Caminho A: A0 (0) -> A1 (1) -> RA_0 (2) -> Target
    const a0 = addINode('Axiom - A0');
    const a1 = addINode('Def - A1');
    const sA1 = addRANode('Def - A1');
    engine.addBipartiteEdge(a0.internalId, sA1.internalId);
    engine.addBipartiteEdge(sA1.internalId, a1.internalId);

    // Caminho B: B0 (0) -> B1 (1) -> B2 (2) -> B3 (3) -> B4 (4) -> RA_1 (5) -> Target
    let prev = addINode('Axiom - B0');
    for (let step = 1; step <= 4; step++) {
      const next = addINode(`Def - B${step}`);
      const sNext = addRANode(`Def - B${step}`);
      engine.addBipartiteEdge(prev.internalId, sNext.internalId);
      engine.addBipartiteEdge(sNext.internalId, next.internalId);
      prev = next;
    }

    const target = addINode('Theo - Convergência');
    const raViaCurta = addRANode('Theo - Convergência', 0);
    const raViaLonga = addRANode('Theo - Convergência', 1);

    // Via 0 (curta): A1 (1) -> raViaCurta (2) -> target
    engine.addBipartiteEdge(a1.internalId, raViaCurta.internalId);
    engine.addBipartiteEdge(raViaCurta.internalId, target.internalId);

    // Via 1 (longa): B4 (4) -> raViaLonga (5) -> target
    engine.addBipartiteEdge(prev.internalId, raViaLonga.internalId);
    engine.addBipartiteEdge(raViaLonga.internalId, target.internalId);

    const result = engine.computeTropicalLevels();

    expect(result.topologicalLevels[raViaCurta.internalId]).toBe(2);
    expect(result.topologicalLevels[raViaLonga.internalId]).toBe(5);
    // Adição Tropical (min): min(2, 5) = 2
    expect(result.topologicalLevels[target.internalId]).toBe(2);
  });

  it('4. integra quebra de ciclos Eades + B-Visit Tropical em buildAcyclicProjection sem deixar vértices órfãos', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Caminho.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concepts**:
  - [[Def - Componente Conexo]]`
      },
      {
        relativePath: 'Def - Componente Conexo.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concepts**:
  - [[Def - Caminho]]`
      }
    ]);

    const projection = engine.buildAcyclicProjection();
    expect(projection.nonTrivialSccCount).toBe(1);
    expect(projection.feedbackArcSet.length).toBe(1);
    expect(projection.linearOrdering.length).toBe(engine.getNodeCount());

    const caminho = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Caminho')!;
    const comp = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Componente Conexo')!;

    // Um dos conceitos torna-se raiz acíclica (nível 0) e o outro derivado (nível 1)
    const levels = [
      projection.topologicalLevels[caminho.internalId],
      projection.topologicalLevels[comp.internalId]
    ].sort((a, b) => a! - b!);

    expect(levels).toEqual([0, 1]);
  });

  it('5. executa B-Visit Tropical em grafo de grande escala (8.000 nós) em menos de 10ms (tipicamente < 3ms)', () => {
    const engine = new EpistemicAIFEngine();
    const dom = 'Benchmark';
    const numLayers = 40;
    const iNodesPerLayer = 100; // 4.000 I-Nodes + 3.900 S-Nodes = 7.900 nós totais

    const layerNodeIds: number[][] = [];

    for (let l = 0; l < numLayers; l++) {
      const currentLayer: number[] = [];
      for (let i = 0; i < iNodesPerLayer; i++) {
        const sym = `Def - Node_${l}_${i}`;
        const iNode = engine.addNode({
          rawUri: MMTUriResolver.buildNoteUri(sym, dom),
          partition: AIFNodePartition.I_NODE,
          physicalFilePath: `${sym}.md`,
          markdownExcerpt: ''
        });
        currentLayer.push(iNode.internalId);

        if (l > 0) {
          const prevLayer = layerNodeIds[l - 1]!;
          const p1 = prevLayer[i % iNodesPerLayer]!;
          const p2 = prevLayer[(i + 1) % iNodesPerLayer]!;

          const raNode = engine.addNode({
            rawUri: MMTUriResolver.buildSchemeUri(iNode.uri, 'ra', 0),
            partition: AIFNodePartition.S_NODE,
            schemeSubType: AIFSchemeSubType.RA_DEFINITION,
            physicalFilePath: `${sym}.md`,
            markdownExcerpt: ''
          });

          engine.addBipartiteEdge(p1, raNode.internalId);
          engine.addBipartiteEdge(p2, raNode.internalId);
          engine.addBipartiteEdge(raNode.internalId, iNode.internalId);
        }
      }
      layerNodeIds.push(currentLayer);
    }

    // Warmup do JIT e estabilização de GC após alocar os 7.900 nós do grafo
    for (let w = 0; w < 3; w++) {
      engine.computeTropicalLevels();
    }

    let minElapsedMs = Infinity;
    let result = engine.computeTropicalLevels();
    for (let run = 0; run < 5; run++) {
      const t0 = performance.now();
      result = engine.computeTropicalLevels();
      const elapsed = performance.now() - t0;
      if (elapsed < minElapsedMs) {
        minElapsedMs = elapsed;
      }
    }

    expect(engine.getNodeCount()).toBe(7900);
    expect(result.maxTopologicalLevel).toBe(numLayers - 1);
    expect(result.primitives.length).toBe(iNodesPerLayer);
    expect(minElapsedMs).toBeLessThan(10);
  });
});
