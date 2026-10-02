// packages/core/test/graph-index.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GraphIndex } from '../src/graph-index.js';

describe('GraphIndex', () => {
  let graph: GraphIndex;

  beforeEach(() => {
    graph = new GraphIndex();
  });

  it('Deve extrair taxonomia corretamente de uma Nota de Área', () => {
    const areaNote = `
## Map of Content / Tags: #area #fisica

- Field Taxonomy:
	- **Broader Fields**: [[Ciência da Natureza]], [[Matemática Aplicada]]
	- **Coordinate Fields**: [[Química]]
	- **Narrower Fields**: [[Mecânica Clássica]], [[Termodinâmica]]

- Related
	- **Core Object**: [[Matéria]]
	- **Machinery**:
    `;

    graph.addNote('fisica.md', areaNote);
    const node = graph.getNote('fisica.md')!;

    expect(node.tags).toContain('area');
    expect(node.tags).toContain('fisica');
    expect(node.taxonomy.broaderFields).toEqual(['Ciência da Natureza', 'Matemática Aplicada']);
    expect(node.taxonomy.coordinateFields).toEqual(['Química']);
    expect(node.taxonomy.narrowerFields).toEqual(['Mecânica Clássica', 'Termodinâmica']);
    expect(node.taxonomy.coreObject).toEqual(['Matéria']);
    expect(node.taxonomy.machinery).toEqual([]);
    expect(node.outlinks.length).toBe(6); // Todos os links somados
  });

  it('Deve extrair taxonomia corretamente de uma Nota de Conceito', () => {
    const conceptNote = `
## Map of Content / Tags: #conceito

- **Domain Fields**: [[Mecânica Clássica]]

- Concept Taxonomy:
	- **Presupposed Concept**: [[Massa|Massa Inercial]], [[Aceleração]]
	- **Coordinate Concepts**: [[Impulso]]
	- **Derived Concepts**: [[Trabalho]], [[Energia Cinética]]
    `;

    graph.addNote('forca.md', conceptNote);
    const node = graph.getNote('forca.md')!;

    // Testa se lidou bem com o Alias do Obsidian [[Arquivo|Alias]]
    expect(node.taxonomy.presupposedConcepts).toEqual(['Massa', 'Aceleração']);
    expect(node.taxonomy.domainFields).toEqual(['Mecânica Clássica']);
    expect(node.taxonomy.derivedConcepts).toEqual(['Trabalho', 'Energia Cinética']);
  });
});