// packages/core/test/epistemic-bipartite.test.ts

import { describe, it, expect } from 'vitest';
import {
  AIFEdgeType,
  AIFNodePartition,
  AIFRuleModality,
  AIFSchemeSubType,
  EpistemicEdgeRole,
  EpistemicAIFEngine,
  compileVaultToEpistemicEngine,
  extractCleanBodyExcerpt,
  inferCanonicalNoteType
} from '../src/index.js';

describe('Sub-etapa 3.2: Grafo Bipartido AIF em Memória & Compilador do Cofre', () => {
  describe('extractCleanBodyExcerpt', () => {
    it('descarta o preâmbulo (#tags, SR, Status) e o bloco Map of Content / Tags extraindo apenas o enunciado limpo', () => {
      const markdown = `
#review #difficulty
<!--SR:2026-10-31,3,250-->
2026-10-28 09:00

Status: #evergreen

---

## Map of Content / Tags:

- **Domain Fields**: [[Teoria dos Grafos]]
- Concept Taxonomy:
	- **Presupposed Concept**: [[Def - Vértice]], [[Def - Aresta]]
	- **Derived Concepts**: [[Def - Grafo Conexo]]

---
---

## Definição Formal
<!-- SLOT:FORMAL_DEFINITION -->
Um grafo é uma estrutura matemática ordenada G = (V, E) constituída por um conjunto de vértices V e um conjunto de arestas E.
`.trim();

      const excerpt = extractCleanBodyExcerpt(markdown);
      expect(excerpt).toBe(
        'Um grafo é uma estrutura matemática ordenada G = (V, E) constituída por um conjunto de vértices V e um conjunto de arestas E.'
      );
      expect(excerpt).not.toContain('Map of Content');
      expect(excerpt).not.toContain('#review');
      expect(excerpt).not.toContain('SLOT:');
    });
  });

  describe('inferCanonicalNoteType', () => {
    it('classifica os 11 tipos canônicos e suas modalidades ASPIC+', () => {
      expect(inferCanonicalNoteType('Axiom - Extensionalidade')).toEqual({
        canonicalNoteType: 'axiom',
        ruleModality: AIFRuleModality.INVIOLABLE_PREMISE_K_N
      });
      expect(inferCanonicalNoteType('Def - Grafo')).toEqual({
        canonicalNoteType: 'definition',
        ruleModality: AIFRuleModality.STRICT_R_S
      });
      expect(inferCanonicalNoteType('Theo - Euler')).toEqual({
        canonicalNoteType: 'theorem',
        ruleModality: AIFRuleModality.STRICT_R_S
      });
      expect(inferCanonicalNoteType('Conj - Goldbach')).toEqual({
        canonicalNoteType: 'conjecture',
        ruleModality: AIFRuleModality.DEFEASIBLE_R_D
      });
      expect(inferCanonicalNoteType('Obs - Radiação de Fundo')).toEqual({
        canonicalNoteType: 'observation',
        ruleModality: AIFRuleModality.EMPIRICAL_PREMISE_K_P
      });
      expect(inferCanonicalNoteType('Law - Gravitação Universal')).toEqual({
        canonicalNoteType: 'law',
        ruleModality: AIFRuleModality.DEFEASIBLE_R_D
      });
      expect(inferCanonicalNoteType('Hyp - Matéria Escura')).toEqual({
        canonicalNoteType: 'hypothesis',
        ruleModality: AIFRuleModality.DEFEASIBLE_R_D
      });
      expect(inferCanonicalNoteType('Tese - Realismo Moderado')).toEqual({
        canonicalNoteType: 'thesis',
        ruleModality: AIFRuleModality.DEFEASIBLE_R_D
      });
      expect(inferCanonicalNoteType('Obj - Problema do Mal')).toEqual({
        canonicalNoteType: 'objection',
        ruleModality: AIFRuleModality.CONFLICT_ATTACK
      });
      expect(inferCanonicalNoteType('Quest - Nominalismo vs Realismo')).toEqual({
        canonicalNoteType: 'quaestio',
        ruleModality: AIFRuleModality.INQUIRY_SYNTHESIS
      });
      expect(inferCanonicalNoteType('Prat - Busca em Largura')).toEqual({
        canonicalNoteType: 'practical',
        ruleModality: AIFRuleModality.PROCEDURAL
      });
    });
  });

  describe('EpistemicAIFEngine (Invariantes Bipartidas e Contadores O(1))', () => {
    it('proíbe categoricamente arestas diretas I-to-I e S-to-S', () => {
      const engine = new EpistemicAIFEngine();

      const vNode = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Vértice',
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: 'Def - Vértice.md',
        markdownExcerpt: 'Elemento fundamental.'
      });

      const gNode = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Grafo',
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: 'Def - Grafo.md',
        markdownExcerpt: 'Par ordenado (V, E).'
      });

      expect(() =>
        engine.addBipartiteEdge(vNode.internalId, gNode.internalId)
      ).toThrow(/Violação Ontológica AIF/);

      const s1 = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ra_0',
        partition: AIFNodePartition.S_NODE,
        physicalFilePath: 'Def - Grafo.md',
        markdownExcerpt: 'RA 0'
      });

      const s2 = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ra_1',
        partition: AIFNodePartition.S_NODE,
        physicalFilePath: 'Def - Grafo.md',
        markdownExcerpt: 'RA 1'
      });

      expect(() => engine.addBipartiteEdge(s1.internalId, s2.internalId)).toThrow(
        /Violação Bipartida AIF/
      );
    });

    it('insere hiperarcos conjuntivos (I1, I2 -> S -> I3) e atualiza contadores intra/inter-domínio em O(1)', () => {
      const engine = new EpistemicAIFEngine();

      // Premissa externa (Teoria dos Conjuntos)
      const conjunto = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Conjuntos?Def - Conjunto',
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: 'Def - Conjunto.md',
        markdownExcerpt: 'Coleção de objetos.'
      });

      // Premissa interna (Teoria dos Grafos)
      const vertice = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Vértice',
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: 'Def - Vértice.md',
        markdownExcerpt: 'Nó de incidência.'
      });

      // S-Node no domínio Teoria dos Grafos
      const raGrafo = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ra_0',
        partition: AIFNodePartition.S_NODE,
        schemeSubType: AIFSchemeSubType.RA_DEFINITION,
        physicalFilePath: 'Def - Grafo.md',
        markdownExcerpt: 'Conjunção de Conjunto e Vértice'
      });

      // Conclusão em Teoria dos Grafos
      const grafo = engine.addNode({
        rawUri: 'jarvis://vault?Teoria dos Grafos?Def - Grafo',
        partition: AIFNodePartition.I_NODE,
        physicalFilePath: 'Def - Grafo.md',
        markdownExcerpt: 'Estrutura G = (V, E).'
      });

      const e1 = engine.addBipartiteEdge(conjunto.internalId, raGrafo.internalId);
      const e2 = engine.addBipartiteEdge(vertice.internalId, raGrafo.internalId);
      const e3 = engine.addBipartiteEdge(raGrafo.internalId, grafo.internalId);

      expect(e1.edgeType).toBe(AIFEdgeType.DATA_SUPPLYING_I_TO_S);
      expect(e2.edgeType).toBe(AIFEdgeType.DATA_SUPPLYING_I_TO_S);
      expect(e3.edgeType).toBe(AIFEdgeType.CONCLUSION_S_TO_I);

      // Verifica contadores de raGrafo: 1 entrada inter-domínio (Conjunto) e 1 entrada intra-domínio (Vértice)
      const raDeg = engine.getNodeDegrees(raGrafo.internalId);
      expect(raDeg.interInDeg).toBe(1);
      expect(raDeg.intraInDeg).toBe(1);
      expect(raDeg.intraOutDeg).toBe(1);
      expect(raDeg.interOutDeg).toBe(0);

      // Verifica contador de Conjunto: 1 saída inter-domínio
      const conjDeg = engine.getNodeDegrees(conjunto.internalId);
      expect(conjDeg.interOutDeg).toBe(1);
      expect(conjDeg.intraOutDeg).toBe(0);

      // Verifica boundaryCutIndex entre Teoria dos Conjuntos -> Teoria dos Grafos
      const cutEdges = engine.getBoundaryCutEdgeIds(conjunto.domainId, raGrafo.domainId);
      expect(cutEdges).toEqual([e1.edgeId]);
    });
  });

  describe('compileVaultToEpistemicEngine (Prevenção de Curto-Circuito Derived e Isolamento CA)', () => {
    it('não cria RA-Node paralelo a partir de Derived Concepts quando a nota filha já possui Presupposed Concept conjuntivo', () => {
      const notes = [
        {
          relativePath: 'Def - Vértice.md',
          content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Grafos]]
- **Derived Concepts**: [[Def - Grafo]]
---
---
Elemento fundamental.
`
        },
        {
          relativePath: 'Def - Aresta.md',
          content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Grafos]]
---
---
Par de vértices.
`
        },
        {
          relativePath: 'Def - Grafo.md',
          content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Grafos]]
- **Presupposed Concept**: [[Def - Vértice]], [[Def - Aresta]]
---
---
Tupla G = (V, E).
`
        }
      ];

      const engine = compileVaultToEpistemicEngine(notes);
      const grafoNode = engine.getNodeByUri('jarvis://vault?Teoria dos Grafos?Def - Grafo')!;
      expect(grafoNode).toBeDefined();

      // Def - Grafo deve ter EXATAMENTE 1 S-Node de entrada ($ra_0 com 2 premissas: Vértice e Aresta),
      // e NÃO um segundo S-Node unário vindo do Derived Concepts de Def - Vértice!
      const incomingEdgeIds = engine.getInEdgeIds(grafoNode.internalId);
      expect(incomingEdgeIds).toHaveLength(1);

      const raNodeId = engine.getAllEdges()[incomingEdgeIds[0]!]!.sourceId;
      const raInEdges = engine.getInEdgeIds(raNodeId);
      expect(raInEdges).toHaveLength(2);
    });

    it('isola CA-Nodes de notas Obj - com papel DIALECTICAL_CONFLICT sem incrementar o grau dedutivo do alvo', () => {
      const notes = [
        {
          relativePath: 'Tese - Determinismo Clássico.md',
          content: `
## Map of Content / Tags:
- **Domain Fields**: [[Filosofia da Física]]
---
---
Todo estado futuro é unicamente determinado.
`
        },
        {
          relativePath: 'Obj - Incerteza de Heisenberg.md',
          content: `
## Map of Content / Tags:
- **Domain Fields**: [[Filosofia da Física]]
- **Presupposed Concept**: [[Tese - Determinismo Clássico]]
- **Coordinate Concepts**: [[Tese - Determinismo Clássico]]
---
---
Impossibilidade de determinar simultaneamente posição e momento.
`
        }
      ];

      const engine = compileVaultToEpistemicEngine(notes);
      const teseNode = engine.getNodeByUri(
        'jarvis://vault?Filosofia da Física?Tese - Determinismo Clássico'
      )!;
      expect(teseNode).toBeDefined();

      // A tese atacada deve manter grau de entrada dedutivo ZERO (continua sendo raiz dedutiva!)
      const teseDeg = engine.getNodeDegrees(teseNode.internalId);
      expect(teseDeg.intraInDeg).toBe(0);
      expect(teseDeg.interInDeg).toBe(0);

      // Mas a aresta de conflito CA deve existir com papel DIALECTICAL_CONFLICT
      const teseInEdges = engine
        .getInEdgeIds(teseNode.internalId)
        .map(id => engine.getAllEdges()[id]!);
      expect(teseInEdges).toHaveLength(1);
      expect(teseInEdges[0]!.edgeType).toBe(AIFEdgeType.CONFLICT_ATTACK);
      expect(teseInEdges[0]!.epistemicRole).toBe(EpistemicEdgeRole.DIALECTICAL_CONFLICT);
    });
  });
});
