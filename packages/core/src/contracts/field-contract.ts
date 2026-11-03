// packages/core/src/contracts/field-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Field - ` (`field`).
 * Alinhado 1:1 aos 20 slots de `7 - Templates/Field -.md` e ao protocolo `Prac - Field Note.md`.
 */
export const FIELD_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'field',
  defaultPrefix: 'Field - ',
  defaultTemplateFile: 'Field -.md',
  ruleModality: AIFRuleModality.NONE,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Field Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE CAMPO / DOMÍNIO (Prac - Field Note):',
    '1. Módulo de Teoria MMT (Theory Graph Container): Uma nota Field - não é um I-Node proposicional comum, mas o contêiner de domínio disciplinar que agrupa notas e estabelece morfismos de inclusão entre áreas (Broader Fields -> Campo Atual -> Narrower Fields).',
    '2. Taxonomia Específica de Field no MOC: Usa `Broader Fields` (super-domínios dos quais herda vocabulário), `Coordinate Fields` (disciplinas irmãs adjacentes), `Narrower Fields` (sub-disciplinas especializadas), `Core Object` (os objetos primários de estudo, [[Def - ...]]) e `Machinery` (o ferramental técnico/formal empregado).',
    '3. Demarcação Escolástica Tripartida (DECOMPOSICAO_CAMPO): Distinga rigorosamente: (1) Objeto Material (Obiectum Materiale — a classe de entes estudada, que pode ser compartilhada com outros campos); (2) Objeto Formal Quod (Obiectum Formale Quod — o aspecto, invariante ou propriedade específica sob a qual os entes são investigados); e (3) Objeto Formal Quo / Maquinário (Obiectum Formale Quo — o método de prova, aparelho formal ou experimental utilizado).',
    '4. Arquitetura Fundacional L = 0 e Sumário Topológico: Na Seção 2, elenque as raízes do campo (Definições Primitivas, Axiomas/Leis e Problemas Diretores). Na Seção 3 (SUMARIO_TEMATICO), organize o mapa de notas do campo em ordem estritamente topológica (dos fundamentos L = 0 às camadas avançadas L >= 1).'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE NATUREZA EPISTÊMICA DO CAMPO (META_TIPO):',
    '- [F.1] Ciência Formal / Dedutiva (Matemática, Lógica, Ciência da Computação Teórica) -> Chaves em DECOMPOSICAO_CAMPO: Objeto Material (Estruturas / Entes) | Objeto Formal Quod (Invariantes / Propriedades Preservadas por Morfismos) | Objeto Formal Quo (Maquinário Dedutivo e Linguagem Formal).',
    '- [F.2] Ciência Empírica / Natural ou Social (Física, Química, Biologia, Psicologia, Economia) -> Chaves: Objeto Material (Sistemas / Fenômenos Naturais ou Sociais) | Objeto Formal Quod (Escala, Leis de Acoplamento e Mecanismos) | Objeto Formal Quo (Método Experimental, Metrológico e Estatístico).',
    '- [F.3] Disciplina Filosófica / Normativa / Humanística (Metafísica, Epistemologia, Ética, Direito) -> Chaves: Objeto Material (Domínio da Experiência / Ação / Ser) | Objeto Formal Quod (Questões de Fundamento, Validade ou Normatividade) | Objeto Formal Quo (Análise Conceitual, Dialética e Hermenêutica).',
    '- [F.4] Engenharia / Ciência Aplicada / Domínio Tecnológico -> Chaves: Objeto Material (Sistemas Artificiais / Processos) | Objeto Formal Quod (Requisitos de Desempenho, Confiabilidade e Otimização) | Objeto Formal Quo (Técnicas de Projeto, Síntese e Controle).'
  ].join('\n'),
  slots: [
    {
      slotId: 'STATUS',
      sectionTitle: 'Preâmbulo',
      syntaxKind: 'status_tag',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Tag de classificação de área e maturidade (ex: #area #teenager ou #teenager).'
    },
    {
      slotId: 'MOC_BROADER_FIELDS',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Super-domínios ([[Field - ...]]) nos quais este campo está contido ou dos quais importa sua base fundacional.',
      formatPattern: '\t\t- [[Field - Super-Domínio]]'
    },
    {
      slotId: 'MOC_COORDINATE_FIELDS',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Campos irmãos do mesmo nível de generalidade ([[Field - ...]]) que estudam objetos adjacentes ou sob outra perspectiva formal.',
      formatPattern: '\t\t- [[Field - Campo Coordenado]]'
    },
    {
      slotId: 'MOC_NARROWER_FIELDS',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Sub-áreas ou ramificações especializadas ([[Field - ...]]) contidas neste campo.',
      formatPattern: '\t\t- [[Field - Sub-Domínio]]'
    },
    {
      slotId: 'MOC_CORE_OBJECT',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'inline_wikilinks',
      required: true,
      allowEmpty: false,
      epistemicDirective: '1 a 4 wikilinks na mesma linha apontando para os conceitos/objetos centrais estudados pelo campo (ex: [[Def - Variedade Topológica]], [[Def - Espaço Topológico]]).'
    },
    {
      slotId: 'MOC_MACHINERY',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'inline_wikilinks',
      required: true,
      allowEmpty: false,
      epistemicDirective: '1 a 4 wikilinks na mesma linha apontando para o maquinário formal, algorítmico ou experimental empregado pelo campo.'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Grande área do conhecimento em que a disciplina se insere.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Natureza epistêmica do campo conforme a Matriz (ex: Ciência Formal/Dedutiva [F.1], Ciência Empírica [F.2], Disciplina Filosófica/Normativa [F.3], Engenharia/Aplicada [F.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Granularidade escalar (ex: Macro-Disciplina Fundacional, Sub-Especialidade, Campo Interdisciplinar de Fronteira).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Fronteira interdisciplinar explicando como este campo difere de seus campos coordenados mesmo quando compartilham o mesmo Objeto Material.'
    },
    {
      slotId: 'FIELD_NOME',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo do campo disciplinar (sem o prefixo Field -).'
    },
    {
      slotId: 'FIELD_ENUNCIADO',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Definição sintética e rigorosa demarcando o escopo, o objeto de estudo e a finalidade epistêmica do campo.'
    },
    {
      slotId: 'DECOMPOSICAO_CAMPO',
      sectionTitle: '1. Definição & Demarcação Epistêmica do Campo',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando a tríade escolástica da Matriz: Objeto Material (Obiectum Materiale) | Objeto Formal Quod (Perspectiva / Invariante) | Objeto Formal Quo (Maquinário / Método).'
    },
    {
      slotId: 'FUNDACAO_DEFINICOES',
      sectionTitle: '2. Arquitetura Fundacional da Teoria (Núcleo L = 0)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) dos conceitos primitivos e definições de nível zero ([[Def - ...]]) que inauguram o vocabulário do campo.',
      formatPattern: '\t- [[Def - Conceito Primitivo]]: Papel fundacional.'
    },
    {
      slotId: 'FUNDACAO_AXIOMAS_LEIS',
      sectionTitle: '2. Arquitetura Fundacional da Teoria (Núcleo L = 0)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) dos axiomas ([[Axiom - ...]]), postulados ou leis empíricas fundamentais ([[Law - ...]]) do campo.',
      formatPattern: '\t- [[Axiom - Postulado]]: Governa...'
    },
    {
      slotId: 'FUNDACAO_PROBLEMAS',
      sectionTitle: '2. Arquitetura Fundacional da Teoria (Núcleo L = 0)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das grandes questões ([[Quest - ...]]) e conjecturas diretoras ([[Conj - ...]]) que orientam a pesquisa na área.',
      formatPattern: '\t- [[Quest - Problema Diretor]]: ...'
    },
    {
      slotId: 'SUMARIO_TEMATICO',
      sectionTitle: '3. Sumário Temático & Topologia de Sub-Domínios',
      syntaxKind: 'markdown_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Mapa estruturado em blocos/camadas ordenadas topologicamente (Camada I — Fundamentos L=0; Camada II — Estruturas e Teoremas Básicos; Camada III — Resultados Avançados e Sub-Domínios) articulando os wikilinks do campo.'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Sumário Temático & Topologia de Sub-Domínios',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Broader Fields -> Campo Atual (e Coordinate Fields) -> Narrower Fields + Núcleo Fundacional. Última linha: `class ID1,ID2 internal-link;`.'
    },
    {
      slotId: 'REF_SOURCES',
      sectionTitle: 'References',
      syntaxKind: 'reference_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Tratados canônicos e livros-texto de referência do campo indentados com 1 tab (\\t- ).',
      formatPattern: '\t- Autor, Tratado/Livro-Texto.'
    },
    {
      slotId: 'REF_MAIN_NOTES',
      sectionTitle: 'References',
      syntaxKind: 'reference_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Notas principais relacionadas no cofre indentadas com 1 tab (\\t- [[Nota]]).',
      formatPattern: '\t- [[Nota]]'
    },
    {
      slotId: 'REF_INVESTIGATIONS',
      sectionTitle: 'References',
      syntaxKind: 'reference_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Investigações ou notas de trabalho abertas indentadas com 1 tab (\\t- ).',
      formatPattern: '\t- [[Investigação]]'
    }
  ]
};
