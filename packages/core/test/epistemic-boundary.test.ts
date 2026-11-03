// packages/core/test/epistemic-boundary.test.ts

import { describe, expect, it } from 'vitest';
import {
  compileVaultToEpistemicEngine,
  extractInclusionMorphism,
  inspectDomainBoundary,
  listIncomingInclusionMorphisms
} from '../src/index.js';

describe('Sub-etapa 3.5: Inspeção Modular de Fronteiras MMT e Morfismos de Inclusão', () => {
  it('1. domínio isolado: classifica conceitos sem dependência como absoluteLocalPrimitives e mantém listas de fronteira vazias', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Axiom - Extensionalidade.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Conjuntos]]

Dois conjuntos são iguais se possuem os mesmos elementos.`
      },
      {
        relativePath: 'Def - Conjunto Vazio.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Conjuntos]]
- **Presupposed Concept**:
  - [[Axiom - Extensionalidade]]

O conjunto vazio não possui elementos.`
      }
    ]);

    const report = inspectDomainBoundary(engine, 'Teoria dos Conjuntos');

    expect(report.theoryUri).toBe('jarvis://vault?Teoria dos Conjuntos');
    expect(report.absoluteLocalPrimitives.map(n => n.uri.sym)).toEqual([
      'Axiom - Extensionalidade'
    ]);
    expect(report.externallyGroundedPrimitives).toHaveLength(0);
    expect(report.exportedBoundaryAnchors).toHaveLength(0);
    expect(report.importedBoundaryAnchors).toHaveLength(0);
    expect(report.externalPremiseNodes).toHaveLength(0);
  });

  it('2. domínio com importação inter-domínio: identifica externallyGroundedPrimitives, importedBoundaryAnchors, externalPremiseNodes e exportedBoundaryAnchors', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Conjunto.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Conjuntos]]

Noção primitiva de coleção de objetos.`
      },
      {
        relativePath: 'Def - Par Ordenado.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Conjuntos]]
- **Presupposed Concept**:
  - [[Def - Conjunto]]

Par ordenado de Kuratowski.`
      },
      {
        relativePath: 'Def - Vértice.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Conjunto]]

Elemento fundamental do conjunto de vértices.`
      },
      {
        relativePath: 'Def - Aresta.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]

Conexão entre dois vértices (primitivo local absoluto em Grafos).`
      },
      {
        relativePath: 'Def - Grafo Dirigido.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concepts**:
  - [[Def - Vértice]], [[Def - Aresta]], [[Def - Par Ordenado]]

Um grafo dirigido usa pares ordenados de vértices.`
      }
    ]);

    const setsReport = engine.inspectDomainBoundary('Teoria dos Conjuntos');
    const graphsReport = engine.inspectDomainBoundary('Teoria dos Grafos');

    // Em Teoria dos Conjuntos:
    // - Def - Conjunto é primitivo local absoluto
    // - Def - Conjunto e Def - Par Ordenado são exportados para Teoria dos Grafos
    expect(setsReport.absoluteLocalPrimitives.map(n => n.uri.sym)).toEqual(['Def - Conjunto']);
    expect(setsReport.exportedBoundaryAnchors.map(n => n.uri.sym).sort()).toEqual([
      'Def - Conjunto',
      'Def - Par Ordenado'
    ]);

    // Em Teoria dos Grafos:
    // - Def - Aresta não tem nenhuma dependência (nem interna nem externa) -> absoluteLocalPrimitives
    // - Def - Vértice não depende de nada interno a Grafos, mas depende de Def - Conjunto -> externallyGroundedPrimitives
    // - Def - Grafo Dirigido depende de Vértice/Aresta (internos) E de Par Ordenado (externo) -> importedBoundaryAnchors (mas não primitivo)
    // - externalPremiseNodes em Grafos deve listar [Def - Conjunto, Def - Par Ordenado]
    expect(graphsReport.absoluteLocalPrimitives.map(n => n.uri.sym)).toEqual(['Def - Aresta']);
    expect(graphsReport.externallyGroundedPrimitives.map(n => n.uri.sym)).toEqual([
      'Def - Vértice'
    ]);
    expect(graphsReport.importedBoundaryAnchors.map(n => n.uri.sym).sort()).toEqual([
      'Def - Grafo Dirigido',
      'Def - Vértice'
    ]);
    expect(graphsReport.externalPremiseNodes.map(n => n.uri.sym).sort()).toEqual([
      'Def - Conjunto',
      'Def - Par Ordenado'
    ]);
  });

  it('3. extração cirúrgica de Morfismo de Inclusão (Σ_Conjuntos ↪ Σ_Grafos) retorna apenas as pontes de fronteira', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Conjunto.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Conjuntos]]`
      },
      {
        relativePath: 'Def - Vértice.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Conjunto]]`
      },
      {
        relativePath: 'Def - Grafo.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Teoria dos Grafos]]
- **Presupposed Concept**:
  - [[Def - Vértice]]`
      }
    ]);

    const morphism = extractInclusionMorphism(
      engine,
      'Teoria dos Conjuntos',
      'Teoria dos Grafos'
    );

    expect(morphism.sourceTheoryUri).toBe('jarvis://vault?Teoria dos Conjuntos');
    expect(morphism.targetTheoryUri).toBe('jarvis://vault?Teoria dos Grafos');
    expect(morphism.frontierBridges).toHaveLength(1);

    const bridge = morphism.frontierBridges[0]!;
    expect(bridge.exportedNode.uri.canonical).toBe(
      'jarvis://vault?Teoria dos Conjuntos?Def - Conjunto'
    );
    expect(bridge.mediatingOrTargetNode.uri.canonical).toBe(
      'jarvis://vault?Teoria dos Grafos?Def - Vértice/$ra_0'
    );
    expect(bridge.targetConceptNode?.uri.canonical).toBe(
      'jarvis://vault?Teoria dos Grafos?Def - Vértice'
    );

    // Verifica listIncomingInclusionMorphisms
    const incoming = listIncomingInclusionMorphisms(engine, 'Teoria dos Grafos');
    expect(incoming).toHaveLength(1);
    expect(incoming[0]!.sourceTheoryUri).toBe('jarvis://vault?Teoria dos Conjuntos');
  });

  it('4. multihoming: nota compartilhada em dois domínios resolve como intra-domínio sem criar falsa âncora externa', () => {
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Entropia.md',
        content: `## Map of Content / Tags:
- **Domain Fields**: [[Termodinâmica]], [[Teoria da Informação]]`
      },
      {
        relativePath: 'Theo - Segunda Lei.md',
        content: `## Map of Content / Tags:
- **Domain Field**: [[Termodinâmica]]
- **Presupposed Concept**:
  - [[Def - Entropia]]`
      }
    ]);

    const thermoReport = engine.inspectDomainBoundary('Termodinâmica');
    expect(thermoReport.externalPremiseNodes).toHaveLength(0);
    expect(thermoReport.importedBoundaryAnchors).toHaveLength(0);
    expect(thermoReport.absoluteLocalPrimitives.map(n => n.uri.sym)).toEqual([
      'Def - Entropia'
    ]);
  });
});
