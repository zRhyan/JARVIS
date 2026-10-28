// packages/core/test/template-engine.test.ts

import { describe, it, expect } from 'vitest';
import {
  expandTemplateMacros,
  extractTemplateSlots,
  fillTemplateSlots,
  formatDateLocal,
  formatTimeLocal,
  addDaysFormatLocal
} from '../src/template-engine.js';

describe('template-engine', () => {
  const fixedDate = new Date('2026-10-27T10:30:00');

  describe('Date Helpers', () => {
    it('formata data local em YYYY-MM-DD', () => {
      expect(formatDateLocal(fixedDate)).toBe('2026-10-27');
    });

    it('formata hora local em HH:mm', () => {
      expect(formatTimeLocal(fixedDate)).toBe('10:30');
    });

    it('adiciona dias e formata corretamente para Spaced Repetition (D+3)', () => {
      expect(addDaysFormatLocal(fixedDate, 3)).toBe('2026-10-30');
    });
  });

  describe('expandTemplateMacros', () => {
    it('expande macros básicas {{date}}, {{time}}, {{title}} e {{domain_fields}}', () => {
      const template = `
#review
{{date}} {{time}}
Title: {{title}}
Fields: {{domain_fields}}
`.trim();

      const expanded = expandTemplateMacros(template, {
        now: fixedDate,
        title: 'Def - Grafo Conexo',
        domainFields: ['Teoria dos Grafos', 'Lógica']
      });

      expect(expanded).toContain('2026-10-27 10:30');
      expect(expanded).toContain('Title: Def - Grafo Conexo');
      expect(expanded).toContain('Fields: [[Teoria dos Grafos]], [[Lógica]]');
    });

    it('expande macros do Templater e Spaced Repetition (SR)', () => {
      const template = `<!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250-->`;
      const expanded = expandTemplateMacros(template, { now: fixedDate });
      expect(expanded).toBe('<!--SR:2026-10-30,3,250-->');
    });

    it('expande {{date_plus_X}} para agendamentos personalizados', () => {
      const template = `Review Date: {{date_plus_7}}`;
      const expanded = expandTemplateMacros(template, { now: fixedDate });
      expect(expanded).toBe('Review Date: 2026-11-03');
    });
  });

  describe('extractTemplateSlots', () => {
    it('extrai corretamente todos os marcadores invisíveis de slot', () => {
      const template = `
- **Presupposed Concept**: <!-- SLOT:PRESUPPOSED -->
## Definição Formal
<!-- SLOT:FORMAL_DEFINITION -->
## Elucidação & Intuição
<!-- SLOT:ELUCIDATION -->
## Corolários
<!-- SLOT:COROLLARIES -->
`;

      const slots = extractTemplateSlots(template);
      expect(slots).toEqual(['PRESUPPOSED', 'FORMAL_DEFINITION', 'ELUCIDATION', 'COROLLARIES']);
    });

    it('retorna array vazio quando não há slots demarcados', () => {
      expect(extractTemplateSlots('Template sem slots')).toEqual([]);
    });
  });

  describe('fillTemplateSlots', () => {
    const template = `
---
## Map of Content / Tags:
- **Domain Fields**: [[Logic]]
- Concept Taxonomy:
	- **Presupposed Concept**: <!-- SLOT:PRESUPPOSED -->
	- **Coordinate Concepts**: <!-- SLOT:COORDINATE -->
	- **Derived Concepts**: <!-- SLOT:DERIVED -->
---
## Definição Formal
<!-- SLOT:FORMAL_DEFINITION -->

## Elucidação & Intuição
<!-- SLOT:ELUCIDATION -->

## Corolários Opcionais
<!-- SLOT:COROLLARIES -->
`.trim();

    it('injeta valores nos slots com match insensível a maiúsculas/minúsculas', () => {
      const payload = {
        presupposed: '- [[Def - Vértice]], [[Def - Aresta]]',
        formal_definition: '$$G = (V, E)$$ onde V é um conjunto não-vazio.',
        elucidation: 'Intuitivamente, uma rede de nós ligados por arestas.'
      };

      const filled = fillTemplateSlots(template, payload, { cleanUnfilledSlots: true });

      expect(filled).toContain('- **Presupposed Concept**: - [[Def - Vértice]], [[Def - Aresta]]');
      expect(filled).toContain('$$G = (V, E)$$ onde V é um conjunto não-vazio.');
      expect(filled).toContain('Intuitivamente, uma rede de nós ligados por arestas.');
      // O slot opcional não preenchido foi limpo
      expect(filled).not.toContain('<!-- SLOT:COROLLARIES -->');
      expect(filled).not.toContain('<!-- SLOT:COORDINATE -->');
    });

    it('preserva marcadores não preenchidos quando cleanUnfilledSlots é false', () => {
      const payload = {
        formal_definition: 'Texto da definição'
      };

      const filled = fillTemplateSlots(template, payload, { cleanUnfilledSlots: false });

      expect(filled).toContain('Texto da definição');
      expect(filled).toContain('<!-- SLOT:PRESUPPOSED -->');
      expect(filled).toContain('<!-- SLOT:COROLLARIES -->');
    });

    it('aceita arrays de strings unindo por quebra de linha', () => {
      const payload = {
        presupposed: ['- [[Def - Vértice]]', '- [[Def - Aresta]]']
      };

      const filled = fillTemplateSlots(template, payload);
      expect(filled).toContain('- [[Def - Vértice]]\n- [[Def - Aresta]]');
    });
  });

  describe('Integração de Ponta a Ponta: Template Real do Cofre', () => {
    it('executa o ciclo completo estilo QuickAdd: compilação de macros + injeção de slots sem corrupção estrutural', () => {
      const rawVaultTemplate = `
#review #difficulty
<!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250-->
{{date}} {{time}}

Status: #teenager

---

## Map of Content / Tags:

- **Domain Fields**: {{domain_fields}}

- Concept Taxonomy:
	- **Presupposed Concept**: <!-- SLOT:PRESUPPOSED -->
	- **Coordinate Concepts**: <!-- SLOT:COORDINATE -->
	- **Derived Concepts**: <!-- SLOT:DERIVED -->

- **Related**: <!-- SLOT:RELATED -->

---
---

## Questão Central
<!-- SLOT:CENTRAL_QUESTION -->

## Análise Comparativa & Quebra de Invariantes
<!-- SLOT:COMPARATIVE_ANALYSIS -->

## Síntese de Decisão & Trade-offs
<!-- SLOT:TRADEOFF_SYNTHESIS -->
`.trim();

      // Passo 1: Expansão determinística de macros
      const expandedSkeleton = expandTemplateMacros(rawVaultTemplate, {
        now: fixedDate,
        title: 'Quest - FIFO vs Min-Heap no Menor Caminho',
        domainFields: ['Teoria dos Grafos', 'Análise de Algoritmos']
      });

      expect(expandedSkeleton).toContain('<!--SR:2026-10-30,3,250-->');
      expect(expandedSkeleton).toContain('2026-10-27 10:30');
      expect(expandedSkeleton).toContain('- **Domain Fields**: [[Teoria dos Grafos]], [[Análise de Algoritmos]]');

      // Passo 2: Injeção dos slots com payload da LLM
      const llmPayload = {
        presupposed: '- [[Def - Busca em Largura]]\n- [[Def - Algoritmo de Dijkstra]]',
        central_question: 'Por que a política FIFO resolve o caminho mínimo em tempo linear em pesos unitários, mas falha em pesos heterogêneos?',
        comparative_analysis: 'A fila FIFO preserva monotonicidade em pesos unitários. Pesos desiguais quebram a ordem de visitação por camadas.',
        tradeoff_synthesis: 'Se pesos unitários -> FIFO O(V+E). Se pesos heterogêneos -> Min-Heap O((V+E) log V).'
      };

      const finalNote = fillTemplateSlots(expandedSkeleton, llmPayload);

      // Verificação de integridade estrutural absoluta
      expect(finalNote).toContain('Status: #teenager');
      expect(finalNote).toContain('Por que a política FIFO resolve o caminho mínimo');
      expect(finalNote).toContain('A fila FIFO preserva monotonicidade');
      expect(finalNote).toContain('Se pesos unitários -> FIFO O(V+E)');
      // Estrutura markdown intacta
      expect(finalNote).toContain('## Map of Content / Tags:');
      expect(finalNote).toContain('## Questão Central');
      expect(finalNote).toContain('## Análise Comparativa & Quebra de Invariantes');
      expect(finalNote).toContain('## Síntese de Decisão & Trade-offs');
    });
  });
});
