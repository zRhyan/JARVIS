// packages/core/test/epistemic-header-parser.test.ts

import { describe, it, expect } from 'vitest';
import {
  parseEpistemicHeader,
  extractCanonicalWikilink,
  extractWikilinksFromLine,
  extractTagsFromText
} from '../src/epistemic-header-parser.js';

describe('epistemic-header-parser', () => {
  describe('extractCanonicalWikilink', () => {
    it('extrai link limpo sem colchetes', () => {
      expect(extractCanonicalWikilink('[[Def - Grafo]]')).toBe('Def - Grafo');
    });

    it('extrai alvo canônico descartando alias', () => {
      expect(extractCanonicalWikilink('[[Def - Grafo|Grafo]]')).toBe('Def - Grafo');
      expect(extractCanonicalWikilink('[[Matemática/Grafos/Def - Grafo|Meu Grafo]]')).toBe('Matemática/Grafos/Def - Grafo');
    });

    it('remove extensão .md se fornecida', () => {
      expect(extractCanonicalWikilink('[[Def - Grafo.md]]')).toBe('Def - Grafo');
      expect(extractCanonicalWikilink('[[Def - Grafo.md|Grafo]]')).toBe('Def - Grafo');
    });
  });

  describe('extractWikilinksFromLine', () => {
    it('extrai múltiplos wikilinks em uma única linha', () => {
      const line = '- **Domain Fields**: [[Logic]], [[Scholasticism|Escolástica]], [[Math.md]]';
      expect(extractWikilinksFromLine(line)).toEqual(['Logic', 'Scholasticism', 'Math']);
    });

    it('retorna array vazio quando não há wikilinks', () => {
      expect(extractWikilinksFromLine('- **Domain Fields**: ')).toEqual([]);
    });
  });

  describe('extractTagsFromText', () => {
    it('extrai tags no padrão Obsidian', () => {
      const text = '#review #difficulty #teenager #field/logic\nTexto com #conceito';
      expect(extractTagsFromText(text)).toEqual(['review', 'difficulty', 'teenager', 'field/logic', 'conceito']);
    });

    it('não confunde cabeçalhos Markdown (# Título) com tags', () => {
      const text = '# Título Principal\n## Subtítulo\n#review';
      expect(extractTagsFromText(text)).toEqual(['review']);
    });
  });

  describe('parseEpistemicHeader', () => {
    it('parseia corretamente o header canônico do usuário com conjunção em linha única', () => {
      const noteContent = `
#review #difficulty
<!--SR:2026-10-10,3,250-->
2026-10-07 08:45

Status: #teenager 

---

## Map of Content / Tags:

- **Domain Fields**: [[Logic]], [[Scholasticism]]

- Concept Taxonomy:
	- **Presupposed Concept**: [[Def - Vértice]], [[Def - Aresta]]
	- **Coordinate Concepts**: [[Def - Grafo Dirigido]]
	- **Derived Concepts**: [[Def - Grafo Conexo]]

- **Related**: [[Prat - Algoritmos de Grafos]]

---
---

## Definição Formal
Conteúdo da definição...
`.trim();

      const parsed = parseEpistemicHeader(noteContent);

      expect(parsed.hasHeader).toBe(true);
      expect(parsed.tags).toContain('review');
      expect(parsed.tags).toContain('difficulty');
      expect(parsed.status).toBe('teenager');
      expect(parsed.domainFields).toEqual(['Logic', 'Scholasticism']);
      
      // Conjunção em linha única
      expect(parsed.presupposedPaths).toHaveLength(1);
      expect(parsed.presupposedPaths[0]!.isConjunction).toBe(true);
      expect(parsed.presupposedPaths[0]!.prerequisites).toEqual(['Def - Vértice', 'Def - Aresta']);

      expect(parsed.coordinate).toEqual(['Def - Grafo Dirigido']);
      expect(parsed.derived).toEqual(['Def - Grafo Conexo']);
      expect(parsed.related).toEqual(['Prat - Algoritmos de Grafos']);
    });

    it('parseia múltiplos caminhos alternativos disjuntivos (OU) em sub-itens indentados', () => {
      const noteContent = `
Status: #evergreen

---

## Map of Content / Tags:

- **Domain Fields**: [[Teoria dos Grafos]]

- Concept Taxonomy:
	- **Presupposed Concept**:
		- [[Def - Vértice]], [[Def - Aresta]]
		- [[Def - Matriz de Adjacência]]
	- **Coordinate Concepts**: [[Def - Grafo Não-Orientado]]
	- **Derived Concepts**:

- **Related**:

---
---
`.trim();

      const parsed = parseEpistemicHeader(noteContent);

      expect(parsed.hasHeader).toBe(true);
      expect(parsed.status).toBe('evergreen');
      expect(parsed.domainFields).toEqual(['Teoria dos Grafos']);

      // Dois caminhos alternativos
      expect(parsed.presupposedPaths).toHaveLength(2);
      
      // Caminho 1: conjunção Vértice e Aresta
      expect(parsed.presupposedPaths[0]!.isConjunction).toBe(true);
      expect(parsed.presupposedPaths[0]!.prerequisites).toEqual(['Def - Vértice', 'Def - Aresta']);

      // Caminho 2: alternativa Matriz de Adjacência
      expect(parsed.presupposedPaths[1]!.isConjunction).toBe(false);
      expect(parsed.presupposedPaths[1]!.prerequisites).toEqual(['Def - Matriz de Adjacência']);

      expect(parsed.coordinate).toEqual(['Def - Grafo Não-Orientado']);
      expect(parsed.derived).toEqual([]);
    });

    it('lida graciosamente com notas sem cabeçalho epistêmico sem lançar erro', () => {
      const simpleNote = '# Uma nota qualquer sem header\nConteúdo simples sem taxonomia.';
      const parsed = parseEpistemicHeader(simpleNote);

      expect(parsed.hasHeader).toBe(false);
      expect(parsed.domainFields).toEqual([]);
      expect(parsed.presupposedPaths).toEqual([]);
      expect(parsed.coordinate).toEqual([]);
      expect(parsed.derived).toEqual([]);
      expect(parsed.related).toEqual([]);
    });

    it('tolera variações de asterisco e hífen e espaços vazios', () => {
      const noteContent = `
## Map of Content / Tags:
* **Domain Fields**: [[Física Clássica]]
* **Presupposed Concept**:
  * [[Def - Posição]]
  * [[Def - Tempo]]
* **Coordinate Concepts**:
* **Derived Concepts**: [[Def - Velocidade]]
---
---
`.trim();

      const parsed = parseEpistemicHeader(noteContent);
      expect(parsed.hasHeader).toBe(true);
      expect(parsed.domainFields).toEqual(['Física Clássica']);
      expect(parsed.presupposedPaths).toHaveLength(2);
      expect(parsed.presupposedPaths[0]!.prerequisites).toEqual(['Def - Posição']);
      expect(parsed.presupposedPaths[1]!.prerequisites).toEqual(['Def - Tempo']);
      expect(parsed.derived).toEqual(['Def - Velocidade']);
    });

    it('tolera variações entre singular e plural nos rótulos de seção (s?)', () => {
      const noteContent = `
## Map of Content / Tags:
- **Domain Field**: [[Álgebra Linear]]
- **Presupposed Concepts**: [[Def - Corpo]], [[Def - Grupo Abeliano]]
- **Coordinate Concept**: [[Def - Módulo]]
- **Derived Concept**: [[Def - Transformação Linear]]
- **Related Concepts**: [[Prat - Matrizes]]
---
---
`.trim();

      const parsed = parseEpistemicHeader(noteContent);
      expect(parsed.hasHeader).toBe(true);
      expect(parsed.domainFields).toEqual(['Álgebra Linear']);
      expect(parsed.presupposedPaths).toEqual([
        { isConjunction: true, prerequisites: ['Def - Corpo', 'Def - Grupo Abeliano'] }
      ]);
      expect(parsed.coordinate).toEqual(['Def - Módulo']);
      expect(parsed.derived).toEqual(['Def - Transformação Linear']);
      expect(parsed.related).toEqual(['Prat - Matrizes']);
    });
  });
});
