// packages/core/test/slot-contracts-and-sanitizer.test.ts

import { describe, expect, it } from 'vitest';
import {
  ALL_CANONICAL_NOTE_ARCHETYPES,
  buildSingleNoteContractPrompt,
  compileVaultToEpistemicEngine,
  DEFAULT_VAULT_CONVENTIONS,
  expandTemplateMacros,
  extractTemplateSlots,
  fillTemplateSlots,
  getSlotContract,
  getTemplateRelativePath,
  inferCanonicalNoteType,
  parseEpistemicHeader,
  resolveNoteTypeConfig,
  resolveVaultConventions,
  sanitizeSlotPayload,
  type CanonicalNoteArchetype
} from '../src/index.js';

/**
 * Mapa exato dos slots físicos declarados nos 12 templates canônicos em `7 - Templates/*.md`
 * (extraídos diretamente dos arquivos aprovados no cofre).
 */
const EXPECTED_PHYSICAL_SLOTS_BY_ARCHETYPE: Readonly<Record<CanonicalNoteArchetype, ReadonlyArray<string>>> = {
  definition: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'CONCEITO_NOME',
    'DEFINICAO_ENUNCIADO',
    'DECOMPOSICAO_ANALITICA',
    'TAXONOMIA_HIPERONIMO',
    'TAXONOMIA_PARAMETROS_LIVRES',
    'TAXONOMIA_HIPONIMOS',
    'TAXONOMIA_FRONTEIRA_COORDENADA',
    'TAXONOMIA_MERMAID',
    'INSTANCIACAO_EXEMPLAR',
    'INSTANCIACAO_NAO_EXEMPLO',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  axiom: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_SISTEMA',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'AXIOMA_NOME',
    'AXIOMA_ENUNCIADO',
    'DECOMPOSICAO_FORMAL',
    'TAXONOMIA_PRIMITIVOS',
    'TAXONOMIA_INDEPENDENCIA',
    'TAXONOMIA_SISTEMAS_ALTERNATIVOS',
    'TAXONOMIA_FRONTEIRA_COORDENADA',
    'TAXONOMIA_MERMAID',
    'JUSTIFICACAO_CRITERIO',
    'JUSTIFICACAO_MODELO',
    'JUSTIFICACAO_PATOLOGIA',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  theorem: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_SISTEMA',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'TEOREMA_NOME',
    'TEOREMA_ENUNCIADO',
    'DECOMPOSICAO_SEQUENTE',
    'PROVA_METODO',
    'PROVA_ESTRATEGIA',
    'PROVA_CORPO',
    'ESCOPO_MINIMALIDADE_HIPOTESES',
    'ESCOPO_RECIPROCA',
    'ESCOPO_FRONTEIRA_COORDENADA',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  conjecture: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_SISTEMA',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'CONJECTURA_NOME',
    'CONJECTURA_ENUNCIADO',
    'DECOMPOSICAO_LOGICA',
    'EVIDENCIA_SUPORTE',
    'CASOS_DEMONSTRADOS',
    'OBSTACULO_DEDUTIVO',
    'CONSEQUENCIAS_CONDICIONAIS',
    'EQUIVALENCIAS_COORDENADAS',
    'CRITERIO_FALSIFICACAO',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  observation: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_CONTEXTO',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'OBS_NOME',
    'OBS_ENUNCIADO',
    'DECOMPOSICAO_PROTOCOLAR',
    'METODOLOGIA_PRIMITIVOS',
    'METODOLOGIA_CONTROLES',
    'METODOLOGIA_CONFIABILIDADE',
    'METODOLOGIA_VIESES',
    'IMPACTO_CORROBORACAO',
    'IMPACTO_REFUTACAO',
    'IMPACTO_SUBDETERMINACAO',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  law: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_REGIME',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'LEI_NOME',
    'LEI_ENUNCIADO',
    'DECOMPOSICAO_FUNCIONAL',
    'REGIME_CONDICOES',
    'REGIME_QUEBRA',
    'REGIME_FRONTEIRA_COORDENADA',
    'FUNDAMENTO_EMPIRICO',
    'FUNDAMENTO_REDUCAO',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  hypothesis: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_EXPLANANDUM',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'HIPOTESE_NOME',
    'HIPOTESE_ENUNCIADO',
    'DECOMPOSICAO_CAUSAL',
    'PODER_EXPLICATIVO',
    'PREDICOES_TESTAVEIS',
    'CRITERIO_FALSIFICABILIDADE',
    'BALANCO_FAVORAVEL',
    'BALANCO_ANOMALIAS',
    'COMPETICAO_RIVAIS',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  thesis: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_QUAESTIO',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'TESE_NOME',
    'TESE_ENUNCIADO',
    'DECOMPOSICAO_TESES',
    'ARGUMENTO_ESQUEMA',
    'ARGUMENTO_NUCLEO',
    'ARGUMENTO_CORPO',
    'DIALETICA_ANTITESES',
    'DIALETICA_OBJECOES',
    'DIALETICA_CUSTOS',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  objection: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_ALVO',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'OBJECAO_NOME',
    'OBJECAO_ENUNCIADO',
    'DECOMPOSICAO_CONFLITO',
    'ATAQUE_PONTO_IMPACTO',
    'ATAQUE_ESTRATEGIA',
    'ATAQUE_CORPO',
    'DIALETICA_REPLICAS',
    'DIALETICA_TREPLICA',
    'IMPACTO_RECONSTRUTIVO',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  quaestio: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_APORIA',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'QUEST_NOME',
    'QUEST_ENUNCIADO',
    'DECOMPOSICAO_QUESTAO',
    'DISPUTA_EIXOS',
    'DISPUTA_CRITERIOS',
    'DISPUTA_MATRIZ_POSICOES',
    'SINTESE_DECISORIA',
    'SINTESE_FALSOS_DILEMAS',
    'SINTESE_SUBQUESTOES',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  practical: [
    'STATUS',
    'MOC_DOMAIN_FIELDS',
    'MOC_PRESUPPOSED',
    'MOC_COORDINATE',
    'MOC_DERIVED',
    'MOC_RELATED',
    'META_DOMINIO',
    'META_OBJETIVO',
    'META_TIPO',
    'META_CUSTO',
    'META_DISTINGUO',
    'PRAC_NOME',
    'PRAC_ENUNCIADO',
    'DECOMPOSICAO_CONTRATO',
    'FUNDAMENTO_TEORICO',
    'FUNDAMENTO_INVARIANTE',
    'PROCEDIMENTO_CORPO',
    'FALHAS_EDGE_CASES',
    'FALHAS_ANTIPADROES',
    'TRADEOFFS_COORDENADOS',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ],
  field: [
    'STATUS',
    'MOC_BROADER_FIELDS',
    'MOC_COORDINATE_FIELDS',
    'MOC_NARROWER_FIELDS',
    'MOC_CORE_OBJECT',
    'MOC_MACHINERY',
    'META_DOMINIO',
    'META_TIPO',
    'META_STATUS',
    'META_DISTINGUO',
    'FIELD_NOME',
    'FIELD_ENUNCIADO',
    'DECOMPOSICAO_CAMPO',
    'FUNDACAO_DEFINICOES',
    'FUNDACAO_AXIOMAS_LEIS',
    'FUNDACAO_PROBLEMAS',
    'SUMARIO_TEMATICO',
    'TAXONOMIA_MERMAID',
    'REF_SOURCES',
    'REF_MAIN_NOTES',
    'REF_INVESTIGATIONS'
  ]
};

describe('Etapa 4: Os 12 Contratos Modulares Autossuficientes de Slots & Sanitizador Pós-LLM', () => {
  it('verifica paridade 1:1 de slots entre os 12 contratos modulares e os 12 templates físicos canônicos', () => {
    expect(ALL_CANONICAL_NOTE_ARCHETYPES).toHaveLength(12);

    for (const archetype of ALL_CANONICAL_NOTE_ARCHETYPES) {
      const contract = getSlotContract(archetype);
      const contractSlotIds = contract.slots.map(s => s.slotId);
      const expectedPhysicalSlotIds = EXPECTED_PHYSICAL_SLOTS_BY_ARCHETYPE[archetype];

      expect(contractSlotIds).toEqual(expectedPhysicalSlotIds);
    }
  });

  it('resolve convenções de cofre, prefixos aceitos (Prac - / Prat -) e overrides de Perfil', () => {
    expect(getTemplateRelativePath('definition')).toBe('7 - Templates/Def -.md');
    expect(getTemplateRelativePath('practical')).toBe('7 - Templates/Prac -.md');
    expect(getTemplateRelativePath('field')).toBe('7 - Templates/Field -.md');

    const pracCfg1 = resolveNoteTypeConfig('Prac - Busca em Largura');
    const pracCfg2 = resolveNoteTypeConfig('Prat - Algoritmo de Dijkstra');
    expect(pracCfg1?.canonicalType).toBe('practical');
    expect(pracCfg2?.canonicalType).toBe('practical');
    expect(inferCanonicalNoteType('Prac - Def Note').canonicalNoteType).toBe('practical');

    // Testa override por Perfil
    const customConventions = resolveVaultConventions({
      templatesDir: 'TemplatesCustom',
      noteTypes: {
        definition: {
          defaultPrefix: 'Definicao - ',
          templateFile: 'CustomDef.md',
          slotRuleOverrides: {
            DEFINICAO_ENUNCIADO: 'Regra customizada pelo usuário para o enunciado.'
          }
        }
      }
    });

    expect(getTemplateRelativePath('definition', customConventions)).toBe(
      'TemplatesCustom/CustomDef.md'
    );
    const overriddenContract = getSlotContract('definition', customConventions);
    const enunciadoRule = overriddenContract.slots.find(s => s.slotId === 'DEFINICAO_ENUNCIADO');
    expect(enunciadoRule?.epistemicDirective).toBe(
      'Regra customizada pelo usuário para o enunciado.'
    );
  });

  it('gera prompt cirúrgico de contrato único (buildSingleNoteContractPrompt) sem vazamento de outros tipos', () => {
    const defPrompt = buildSingleNoteContractPrompt('definition');
    expect(defPrompt).toContain('archetype="definition"');
    expect(defPrompt).toContain('Prac - Def Note');
    expect(defPrompt).toContain('Domínio B');
    expect(defPrompt).toContain('[DECOMPOSICAO_ANALITICA]');
    // Garante que NÃO carrega textos de teoremas, axiomas ou leis (economia máxima de tokens)
    expect(defPrompt).not.toContain('PROVA_CORPO');
    expect(defPrompt).not.toContain('Buckingham');
    expect(defPrompt).not.toContain('DECOMPOSICAO_QUESTAO');
  });

  it('blinda grau de entrada zero (d^- = 0) esvaziando MOC_PRESUPPOSED em Axiom - e Obs -', () => {
    const axiomSanitized = sanitizeSlotPayload('axiom', {
      STATUS: 'adult',
      MOC_DOMAIN_FIELDS: '[[6 - Main Notes/Field - Teoria dos Conjuntos.md]]',
      MOC_PRESUPPOSED: [
        ['[[Def - Conjunto]]', '[[Def - Pertinência]]']
      ],
      AXIOMA_NOME: 'Axioma da Extensionalidade'
    });

    // Axioma deve ter MOC_PRESUPPOSED forçado a vazio para preservar d^- = 0 e L = 0!
    expect(axiomSanitized.MOC_PRESUPPOSED).toBe('');
    expect(axiomSanitized.STATUS).toBe('#adult');
    expect(axiomSanitized.MOC_DOMAIN_FIELDS).toBe('[[Field - Teoria dos Conjuntos]]');

    const obsSanitized = sanitizeSlotPayload('observation', {
      MOC_PRESUPPOSED: '\t\t- [[Def - Fóton]]',
      OBS_NOME: 'Experimento de Michelson-Morley'
    });
    expect(obsSanitized.MOC_PRESUPPOSED).toBe('');
  });

  it('realiza roundtrip completo: sanitizeSlotPayload -> fillTemplateSlots -> parseEpistemicHeader -> compileVaultToEpistemicEngine', () => {
    const defTemplate = [
      '#review #difficulty',
      '<!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250-->',
      '{{date}} {{time}}',
      '',
      'Status: <!-- SLOT:STATUS -->',
      '',
      '---',
      '',
      '## Map of Content / Tags:',
      '',
      '- **Domain Fields**: <!-- SLOT:MOC_DOMAIN_FIELDS -->',
      '',
      '- Concept Taxonomy:',
      '\t- **Presupposed Concept**:',
      '<!-- SLOT:MOC_PRESUPPOSED -->',
      '\t- **Coordinate Concepts**:',
      '<!-- SLOT:MOC_COORDINATE -->',
      '\t- **Derived Concepts**:',
      '<!-- SLOT:MOC_DERIVED -->',
      '',
      '- **Related**:',
      '<!-- SLOT:MOC_RELATED -->',
      '',
      '---',
      '---',
      '',
      '## 1. Definição',
      '',
      '> [!abstract]- Metadados & Taxonomia',
      '> - **Domínio:** <!-- SLOT:META_DOMINIO -->',
      '> - **Tipo:** <!-- SLOT:META_TIPO -->',
      '> - **Status:** <!-- SLOT:META_STATUS -->',
      '> - **Distinguo:** <!-- SLOT:META_DISTINGUO -->',
      '',
      '> [!def] Definição 1 — <!-- SLOT:CONCEITO_NOME -->',
      '> <!-- SLOT:DEFINICAO_ENUNCIADO -->',
      '> ',
      '> ---',
      '> **Decomposição Analítica:**',
      '> <!-- SLOT:DECOMPOSICAO_ANALITICA -->',
      '',
      '---',
      '',
      '## 2. Taxonomia & Linhagem Ontológica',
      '',
      '```mermaid',
      '<!-- SLOT:TAXONOMIA_MERMAID -->',
      '```'
    ].join('\n');

    const slotsInTemplate = extractTemplateSlots(defTemplate);
    expect(slotsInTemplate).toContain('DECOMPOSICAO_ANALITICA');

    // Simula saída imperfeita da LLM (com caminhos em wikilinks, conjunções/disjunções no MOC,
    // callout sem '> ' nas linhas 2 e 3, e cerca ```mermaid duplicada)
    const rawLlmPayload = {
      STATUS: 'teenager',
      MOC_DOMAIN_FIELDS: ['6 - Main Notes/Field - Topologia Geral.md', '[[Field - Análise Real]]'],
      MOC_PRESUPPOSED: [
        // Caminho 1 (Conjunção AND): Conjunto E Família de Subconjuntos
        ['[[6 - Main Notes/Def - Conjunto.md]]', 'Def - Família de Subconjuntos'],
        // Caminho 2 (Disjunção OR): Operador de Fecho de Kuratowski
        ['[[Def - Operador de Fecho de Kuratowski]]']
      ],
      MOC_COORDINATE: ['[[Def - Espaço Mensurável.md]]', '[[Def - Espaço Uniforme]]'],
      MOC_DERIVED: ['[[Def - Espaço Métrico]]', '[[Theo - Compacidade preserva Continuidade]]'],
      MOC_RELATED: ['[[Def - Reticulado Completo]]'],
      META_DOMINIO: 'Domínio B — Matemática, Lógica Formal e Ciência da Computação',
      META_TIPO: 'Definição Estrutural / Axiomática [B.2]',
      META_STATUS: 'Estrutura Matemática Fundacional',
      META_DISTINGUO: 'Não confundir com [[6 - Main Notes/Def - Topologia de Rede.md]].',
      CONCEITO_NOME: 'Espaço Topológico',
      DEFINICAO_ENUNCIADO:
        'Um **Espaço Topológico** é um par ordenado $(X, \\tau)$ onde $X$ é um [[Def - Conjunto]] e $\\tau$ é uma [[Def - Família de Subconjuntos]] de $X$.',
      DECOMPOSICAO_ANALITICA: [
        '- **Portadores (Carriers):** Conjunto base $X$.',
        '> - **Operações / Relações Primitivas:** Família de abertos $\\tau \\subseteq \\mathcal{P}(X)$.',
        '- **Axiomas Constitutivos da Estrutura:** (1) $\\emptyset, X \\in \\tau$; (2) Fechado sob uniões arbitrárias; (3) Fechado sob interseções finitas.'
      ].join('\n'),
      TAXONOMIA_MERMAID: [
        '```mermaid',
        'graph TD',
        '    Conj["[[Def - Conjunto]]"] --> EspTop["[[Def - Espaço Topológico]]"]',
        '    EspTop --> EspMet["[[Def - Espaço Métrico]]"]',
        '    class Conj,EspTop,EspMet internal-link;',
        '```'
      ].join('\n')
    };

    const sanitized = sanitizeSlotPayload('definition', rawLlmPayload);
    const expanded = expandTemplateMacros(defTemplate, {
      now: new Date(2026, 10, 3, 10, 30)
    });
    const finalMarkdown = fillTemplateSlots(expanded, sanitized);

    // 1. Verifica propagação automática de '> ' nas 3 linhas de DECOMPOSICAO_ANALITICA
    expect(finalMarkdown).toContain(
      [
        '> **Decomposição Analítica:**',
        '> - **Portadores (Carriers):** Conjunto base $X$.',
        '> - **Operações / Relações Primitivas:** Família de abertos $\\tau \\subseteq \\mathcal{P}(X)$.',
        '> - **Axiomas Constitutivos da Estrutura:** (1) $\\emptyset, X \\in \\tau$; (2) Fechado sob uniões arbitrárias; (3) Fechado sob interseções finitas.'
      ].join('\n')
    );

    // 2. Verifica sanitização do bloco Mermaid (sem ```mermaid duplicado e sem [[ ]] nos nós)
    expect(finalMarkdown).not.toContain('```mermaid\n```mermaid');
    expect(finalMarkdown).toContain('Conj["Def - Conjunto"] --> EspTop["Def - Espaço Topológico"]');
    expect(finalMarkdown).toContain('class Conj,EspTop,EspMet internal-link;');

    // 3. Verifica que parseEpistemicHeader reconstrói perfeitamente a Árvore Booleana E/OU
    const parsedHeader = parseEpistemicHeader(finalMarkdown);
    expect(parsedHeader.hasHeader).toBe(true);
    expect(parsedHeader.status).toBe('teenager');
    expect(parsedHeader.domainFields).toEqual([
      'Field - Topologia Geral',
      'Field - Análise Real'
    ]);
    expect(parsedHeader.presupposedPaths).toEqual([
      {
        isConjunction: true,
        prerequisites: ['Def - Conjunto', 'Def - Família de Subconjuntos']
      },
      {
        isConjunction: false,
        prerequisites: ['Def - Operador de Fecho de Kuratowski']
      }
    ]);
    expect(parsedHeader.coordinate).toEqual([
      'Def - Espaço Mensurável',
      'Def - Espaço Uniforme'
    ]);
    expect(parsedHeader.derived).toEqual([
      'Def - Espaço Métrico',
      'Theo - Compacidade preserva Continuidade'
    ]);
    expect(parsedHeader.related).toEqual(['Def - Reticulado Completo']);

    // 4. Verifica compilação no EpistemicAIFEngine
    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: '6 - Main Notes/Def - Espaço Topológico.md',
        content: finalMarkdown
      }
    ]);
    expect(engine.getNodeCount()).toBeGreaterThanOrEqual(4);
  });

  it('faz parsing correto do cabeçalho Field Taxonomy (Broader, Coordinate, Narrower Fields, Core Object, Machinery)', () => {
    const fieldSanitized = sanitizeSlotPayload('field', {
      STATUS: '#area #teenager',
      MOC_BROADER_FIELDS: ['[[Field - Matemática Pura]]'],
      MOC_COORDINATE_FIELDS: ['[[Field - Álgebra Abstrata]]'],
      MOC_NARROWER_FIELDS: ['[[Field - Topologia Algébrica]]', '[[Field - Topologia Diferencial]]'],
      MOC_CORE_OBJECT: ['[[Def - Espaço Topológico]]', '[[Def - Homeomorfismo]]'],
      MOC_MACHINERY: ['[[Def - Compacidade]]', '[[Def - Conexidade]]']
    });

    const fieldTemplate = [
      '{{date}} {{time}}',
      '',
      'Status: <!-- SLOT:STATUS -->',
      '',
      '---',
      '',
      '## Map of Content / Tags:',
      '',
      '- Field Taxonomy:',
      '\t- **Broader Fields**:',
      '<!-- SLOT:MOC_BROADER_FIELDS -->',
      '\t- **Coordinate Fields**:',
      '<!-- SLOT:MOC_COORDINATE_FIELDS -->',
      '\t- **Narrower Fields**:',
      '<!-- SLOT:MOC_NARROWER_FIELDS -->',
      '',
      '- Related:',
      '\t- **Core Object**: <!-- SLOT:MOC_CORE_OBJECT -->',
      '\t- **Machinery**: <!-- SLOT:MOC_MACHINERY -->',
      '',
      '---',
      '---',
      '',
      '## 1. Definição & Demarcação Epistêmica do Campo'
    ].join('\n');

    const renderedField = fillTemplateSlots(fieldTemplate, fieldSanitized);
    const parsedFieldHeader = parseEpistemicHeader(renderedField);

    expect(parsedFieldHeader.hasHeader).toBe(true);
    expect(parsedFieldHeader.presupposedPaths).toEqual([
      {
        isConjunction: false,
        prerequisites: ['Field - Matemática Pura']
      }
    ]);
    expect(parsedFieldHeader.coordinate).toEqual(['Field - Álgebra Abstrata']);
    expect(parsedFieldHeader.derived).toEqual([
      'Field - Topologia Algébrica',
      'Field - Topologia Diferencial'
    ]);
    expect(parsedFieldHeader.related).toEqual([
      'Def - Espaço Topológico',
      'Def - Homeomorfismo',
      'Def - Compacidade',
      'Def - Conexidade'
    ]);
  });
});
