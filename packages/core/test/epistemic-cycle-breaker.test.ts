// packages/core/test/epistemic-cycle-breaker.test.ts

import { describe, it, expect } from 'vitest';
import {
  AIFEdgeType,
  AIFNodePartition,
  EpistemicEdgeRole,
  EpistemicAIFEngine,
  breakCyclesEadesBipartite,
  computeNonTrivialSCCs,
  compileVaultToEpistemicEngine
} from '../src/index.js';

describe('Sub-etapa 3.3: Tarjan SCC & Heurística de Eades Bipartida (Invariante S -> I)', () => {
  it('detecta e quebra ciclo simples (I1 -> S1 -> I2 -> S2 -> I1) cortando exclusivamente aresta S -> I', () => {
    const engine = new EpistemicAIFEngine();

    const i1 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Caminho',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - Caminho.md',
      markdownExcerpt: 'Sequência de vértices.'
    });
    const i2 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Conectividade',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - Conectividade.md',
      markdownExcerpt: 'Existência de caminho.'
    });

    const s1 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Conectividade/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - Conectividade.md',
      markdownExcerpt: 'Caminho -> Conectividade'
    });
    const s2 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Caminho/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - Caminho.md',
      markdownExcerpt: 'Conectividade -> Caminho'
    });

    engine.addBipartiteEdge(i1.internalId, s1.internalId);
    engine.addBipartiteEdge(s1.internalId, i2.internalId);
    engine.addBipartiteEdge(i2.internalId, s2.internalId);
    engine.addBipartiteEdge(s2.internalId, i1.internalId);

    const result = breakCyclesEadesBipartite(engine);

    expect(result.nonTrivialSccCount).toBe(1);
    expect(result.feedbackArcSet).toHaveLength(1);

    const cutEdge = result.feedbackArcSet[0]!;
    expect(cutEdge.edgeType).toBe(AIFEdgeType.CONCLUSION_S_TO_I);
    expect(cutEdge.epistemicRole).toBe(EpistemicEdgeRole.ASSOCIATIVE_FEEDBACK);

    // O grafo residual G_DAG deve ser estritamente acíclico (0 SCCs não-triviais)
    expect(computeNonTrivialSCCs(engine)).toHaveLength(0);

    // Alerta diagnóstico estruturado emitido
    expect(result.cycleWarnings).toHaveLength(1);
    expect(result.cycleWarnings[0]!.involvedConceptNames).toEqual(
      expect.arrayContaining(['Def - Caminho', 'Def - Conectividade'])
    );
  });

  it('preserva hiperarcos conjuntivos intactos em I1, I2 -> S1 -> I3 -> S2 -> I1 (rebaixa S2 -> I1)', () => {
    const engine = new EpistemicAIFEngine();

    const i1 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Vértice',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - Vértice.md',
      markdownExcerpt: 'Vértice'
    });
    const i2 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Aresta',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - Aresta.md',
      markdownExcerpt: 'Aresta'
    });
    const i3 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Grafo',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - Grafo.md',
      markdownExcerpt: 'Grafo'
    });

    const s1 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Grafo/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - Grafo.md',
      markdownExcerpt: '{Vértice, Aresta} -> Grafo'
    });
    const s2 = engine.addNode({
      rawUri: 'jarvis://vault?Grafos?Def - Vértice/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - Vértice.md',
      markdownExcerpt: 'Grafo -> Vértice (ciclo acidental)'
    });

    const ePrem1 = engine.addBipartiteEdge(i1.internalId, s1.internalId);
    const ePrem2 = engine.addBipartiteEdge(i2.internalId, s1.internalId);
    const eConc1 = engine.addBipartiteEdge(s1.internalId, i3.internalId);
    const ePrem3 = engine.addBipartiteEdge(i3.internalId, s2.internalId);
    const eConc2 = engine.addBipartiteEdge(s2.internalId, i1.internalId);

    const result = engine.breakCycles();

    expect(result.nonTrivialSccCount).toBe(1);
    expect(result.feedbackArcSet).toHaveLength(1);

    // Ambas as premissas da conjunção {I1, I2} -> S1 permanecem STRICT_DEDUCTIVE!
    expect(ePrem1.epistemicRole).toBe(EpistemicEdgeRole.STRICT_DEDUCTIVE);
    expect(ePrem2.epistemicRole).toBe(EpistemicEdgeRole.STRICT_DEDUCTIVE);
    expect(ePrem3.epistemicRole).toBe(EpistemicEdgeRole.STRICT_DEDUCTIVE);

    // A aresta rebaixada é estritamente S2 -> I1 (conclusão)
    expect(result.feedbackArcSet[0]!.edgeId).toBe(eConc2.edgeId);
    expect(eConc2.epistemicRole).toBe(EpistemicEdgeRole.ASSOCIATIVE_FEEDBACK);
    expect(eConc1.epistemicRole).toBe(EpistemicEdgeRole.STRICT_DEDUCTIVE);

    // O grafo projetado G_DAG está 100% livre de ciclos
    expect(computeNonTrivialSCCs(engine)).toHaveLength(0);
  });

  it('garante corte exclusivo S -> I mesmo sob assimetria adversa de graus (delta(S) > delta(I))', () => {
    const engine = new EpistemicAIFEngine();

    // Construímos um SCC onde todos os I-nodes têm delta <= 0 ou onde I1 tem 2 entradas no SCC (delta = -1)
    // enquanto S1 tem 1 entrada no SCC e 1 saída no SCC (delta = 0).
    const i1 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - A',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - A.md',
      markdownExcerpt: 'A'
    });
    const iExt = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Axiom - Base',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Axiom - Base.md',
      markdownExcerpt: 'Base externa ao SCC'
    });
    const i2 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - B',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - B.md',
      markdownExcerpt: 'B'
    });
    const i3 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - C',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Def - C.md',
      markdownExcerpt: 'C'
    });

    const s1 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - B/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - B.md',
      markdownExcerpt: '{A, Base} -> B'
    });
    const s2 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - C/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - C.md',
      markdownExcerpt: 'B -> C'
    });
    const sBack1 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - A/$ra_0',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - A.md',
      markdownExcerpt: 'B -> A'
    });
    const sBack2 = engine.addNode({
      rawUri: 'jarvis://vault?Logica?Def - A/$ra_1',
      partition: AIFNodePartition.S_NODE,
      physicalFilePath: 'Def - A.md',
      markdownExcerpt: 'C -> A'
    });

    // Conjunção {i1, iExt} -> s1 -> i2
    engine.addBipartiteEdge(i1.internalId, s1.internalId);
    engine.addBipartiteEdge(iExt.internalId, s1.internalId);
    engine.addBipartiteEdge(s1.internalId, i2.internalId);

    // i2 -> s2 -> i3
    engine.addBipartiteEdge(i2.internalId, s2.internalId);
    engine.addBipartiteEdge(s2.internalId, i3.internalId);

    // Dois caminhos voltando para i1 (fazendo d^-_SCC(i1) = 2, d^+_SCC(i1) = 1 => delta(i1) = -1)
    engine.addBipartiteEdge(i2.internalId, sBack1.internalId);
    engine.addBipartiteEdge(sBack1.internalId, i1.internalId);

    engine.addBipartiteEdge(i3.internalId, sBack2.internalId);
    engine.addBipartiteEdge(sBack2.internalId, i1.internalId);

    const result = engine.breakCycles();

    expect(result.nonTrivialSccCount).toBe(1);
    expect(result.feedbackArcSet.length).toBeGreaterThan(0);

    // INVARIANTE ABSOLUTA: 100% das arestas em feedbackArcSet são CONCLUSION_S_TO_I (nunca I -> S!)
    for (const edge of result.feedbackArcSet) {
      expect(edge.edgeType).toBe(AIFEdgeType.CONCLUSION_S_TO_I);
    }

    // E todas as arestas DATA_SUPPLYING_I_TO_S do grafo continuam STRICT_DEDUCTIVE
    for (const edge of engine.getAllEdges()) {
      if (edge.edgeType === AIFEdgeType.DATA_SUPPLYING_I_TO_S) {
        expect(edge.epistemicRole).toBe(EpistemicEdgeRole.STRICT_DEDUCTIVE);
      }
    }

    // E o grafo residual é 100% acíclico!
    expect(computeNonTrivialSCCs(engine)).toHaveLength(0);
  });

  it('não gera falsos positivos de ciclo em grafos acíclicos ou com objeções dialéticas (Obj -)', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Tese - Livre Arbítrio.md',
        content: `
## Map of Content / Tags:
- **Domain Fields**: [[Metafísica]]
---
---
A vontade humana é autodeterminada.
`
      },
      {
        relativePath: 'Obj - Determinismo Físico.md',
        content: `
## Map of Content / Tags:
- **Domain Fields**: [[Metafísica]]
- **Presupposed Concept**: [[Tese - Livre Arbítrio]]
- **Coordinate Concepts**: [[Tese - Livre Arbítrio]]
---
---
Fechamento causal do mundo físico.
`
      }
    ]);

    const result = engine.breakCycles();
    expect(result.nonTrivialSccCount).toBe(0);
    expect(result.feedbackArcSet).toHaveLength(0);
    expect(result.cycleWarnings).toHaveLength(0);
  });
});
