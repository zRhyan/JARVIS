// packages/core/test/graph-index.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { rm, mkdir } from 'node:fs/promises';
import { GraphIndex } from '../src/graph-index.js';
import { VaultFSSandbox } from '../src/vault-fs.js';

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

  it('Deve retornar outlinks classificados por tipo semântico (getOutlinks)', () => {
    const note = `
## Map of Content / Tags: #conceito
- Concept Taxonomy:
	- **Presupposed Concept**: [[Massa]]
	- **Derived Concepts**: [[Energia]]

Texto livre citando um link genérico para [[Albert Einstein]] em outro contexto.
    `;

    graph.addNote('conceitos/forca.md', note);
    const outlinks = graph.getOutlinks('conceitos/forca.md');

    expect(outlinks).toHaveLength(3);
    expect(outlinks).toContainEqual({ targetPath: 'Massa', semanticType: 'presupposed_concept' });
    expect(outlinks).toContainEqual({ targetPath: 'Energia', semanticType: 'derived_concept' });
    expect(outlinks).toContainEqual({ targetPath: 'Albert Einstein', semanticType: 'generic' });
  });

  it('Deve mapear e recuperar backlinks com flexibilidade de extensão e caminho (getBacklinks)', () => {
    const noteA = `- **Presupposed Concept**: [[Massa|Massa Inercial]]`;
    const noteB = `- **Broader Fields**: [[Massa]]`;
    const noteC = `- Texto sem links`;

    graph.addNote('conceitos/forca.md', noteA);
    graph.addNote('cinematica.md', noteB);
    graph.addNote('outra.md', noteC);

    // Consulta por nome puro
    const backlinksNome = graph.getBacklinks('Massa');
    expect(backlinksNome).toHaveLength(2);
    expect(backlinksNome).toContain('conceitos/forca.md');
    expect(backlinksNome).toContain('cinematica.md');

    // Consulta por nome com .md
    const backlinksMd = graph.getBacklinks('Massa.md');
    expect(backlinksMd).toEqual(backlinksNome);

    // Consulta por subcaminho
    const backlinksPath = graph.getBacklinks('conceitos/Massa.md');
    expect(backlinksPath).toEqual(backlinksNome);

    // Nota que ninguém referencia
    expect(graph.getBacklinks('outra.md')).toEqual([]);
  });

  it('Deve atualizar backlinks corretamente se uma nota for re-indexada com novo conteúdo', () => {
    graph.addNote('nota1.md', 'Link para [[AlvoAntigo]]');
    expect(graph.getBacklinks('AlvoAntigo')).toEqual(['nota1.md']);

    // Reindexa alterando o link
    graph.addNote('nota1.md', 'Link para [[AlvoNovo]]');
    expect(graph.getBacklinks('AlvoAntigo')).toEqual([]);
    expect(graph.getBacklinks('AlvoNovo')).toEqual(['nota1.md']);
  });

  describe('Integração com VaultFSSandbox (buildIndex)', () => {
    const TEST_VAULT = resolve(__dirname, 'fixtures', 'graph-vault');
    let sandbox: VaultFSSandbox;

    beforeEach(async () => {
      await rm(TEST_VAULT, { recursive: true, force: true });
      await mkdir(TEST_VAULT, { recursive: true });
      sandbox = new VaultFSSandbox(TEST_VAULT);
    });

    afterEach(async () => {
      await rm(TEST_VAULT, { recursive: true, force: true });
    });

    it('Deve varrer e indexar todas as notas do cofre automaticamente', async () => {
      await sandbox.writeAtomic('fisica.md', '## Map of Content\n- **Broader Fields**: [[Ciência]]');
      await sandbox.writeAtomic('conceitos/massa.md', '## Map of Content\n- **Domain Fields**: [[fisica]]');

      await graph.buildIndex(sandbox);

      const allNodes = graph.getAllNodes();
      expect(allNodes).toHaveLength(2);

      const fisicaBacklinks = graph.getBacklinks('fisica');
      expect(fisicaBacklinks).toContain('conceitos/massa.md');

      const cienciaBacklinks = graph.getBacklinks('Ciência');
      expect(cienciaBacklinks).toContain('fisica.md');
    });
  });
});