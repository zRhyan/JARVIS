// packages/core/src/contracts/thesis-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Tese - ` (`thesis`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Tese -.md` e ao protocolo `Prac - Tese Note.md`.
 */
export const THESIS_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'thesis',
  defaultPrefix: 'Tese - ',
  defaultTemplateFile: 'Tese -.md',
  ruleModality: AIFRuleModality.DEFEASIBLE_R_D,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Tese Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE TESE / DOUTRINA (Prac - Tese Note):',
    '1. Posição Doutrinária / Respondeo em uma Quaestio Disputata (R_d): Uma nota Tese - articula uma tomada de posição filosófica, interpretativa, jurídica ou meta-teórica estruturada em resposta a um problema aberto ([[Quest - ...]] em META_QUAESTIO).',
    '2. Reconstrução Silogística sem Entimemas (Toulmin / Walton): Em ARGUMENTO_CORPO, reconstrua o argumento com premissas numeradas explícitas (Premissa Maior, Premissa Menor / Factual, Garantias / Warrants) conectadas a [[Def - ...]], [[Axiom - ...]], [[Obs - ...]] ou [[Tese - ...]] declarados em MOC_PRESUPPOSED.',
    '3. Honestidade Dialética (Ad Objecta & Custos Teóricos): Em DIALETICA_ANTITESES, contraponha a tese às posições rivais de MOC_COORDINATE. Em DIALETICA_OBJECOES, responda às principais objeções ([[Obj - ...]]) usando distinções escolásticas (Distinguo). Em DIALETICA_CUSTOS, explicite o preço filosófico/teórico que a tese aceita pagar (Biting the Bullet).'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE TESE / DOUTRINA (META_TIPO):',
    '- [TS.1] Tese Ontológica / Metafísica (ex: Realismo Modal, Fisicalismo, Hilemorfismo) -> Chaves em DECOMPOSICAO_TESES: Tese Nuclear (Claim) | Compromissos Ontológicos Exigidos (Quine) | Qualificador Modal e Escopo (Toulmin).',
    '- [TS.2] Tese Epistemológica / Metodológica / Meta-Científica (ex: Falsificacionismo, Empirismo Construtivo, Instrumentalismo) -> Chaves: Tese Nuclear (Claim) | Critério de Demarcação / Justificação Proposto | Qualificador Modal e Limites.',
    '- [TS.3] Tese Normativa / Ética / Jurídica / Política (ex: Deontologismo Kantiano, Positivismo Jurídico) -> Chaves: Princípio Normativo Central (Claim) | Fundamento de Obrigatoriedade / Validade | Cláusulas de Exceção / Colisão de Princípios.',
    '- [TS.4] Tese Hermenêutica / Historiográfica / Estética -> Chaves: Tese Interpretativa Central (Claim) | Cânone / Evidência Textual ou Histórica Mobilizada | Horizonte de Validade.'
  ].join('\n'),
  slots: [
    {
      slotId: 'STATUS',
      sectionTitle: 'Preâmbulo',
      syntaxKind: 'status_tag',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Tag de maturidade da nota (ex: #teenager, #adult).'
    },
    {
      slotId: 'MOC_DOMAIN_FIELDS',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'inline_wikilinks',
      required: true,
      allowEmpty: false,
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Metafísica]], [[Field - Filosofia da Ciência]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Árvore Booleana das premissas argumentativas: definições ([[Def - ...]]), axiomas/princípios ([[Axiom - ...]]), evidências ([[Obs - ...]]) e teses anteriores ([[Tese - ...]]) das quais o argumento depende. Linhas separadas (OR) representam linhas independentes de argumentação.',
      formatPattern: '\t\t- [[Def - Conceito A]], [[Tese - Premissa B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Teses rivais / antíteses diretas ([[Tese - ...]]) que respondem de modo concorrente à mesma Quaestio.',
      formatPattern: '\t\t- [[Tese - Antítese Rival]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Teses corolárias, diretrizes práticas ([[Prac - ...]]) ou sub-questões que decorrem da adoção desta tese.',
      formatPattern: '\t\t- [[Tese - Corolário Doutrinário]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'A Quaestio central disputada ([[Quest - ...]]) e as objeções dirigidas contra esta tese ([[Obj - ...]]).',
      formatPattern: '\t- [[Quest - Questão Disputada]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio filosófico, jurídico, humanístico ou meta-teórico.'
    },
    {
      slotId: 'META_QUAESTIO',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'A questão disputada a que esta tese responde (com wikilink para [[Quest - ...]]).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de tese conforme a Matriz (ex: Ontológica/Metafísica [TS.1], Epistemológica/Metodológica [TS.2], Normativa/Jurídica [TS.3], Hermenêutica [TS.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estatuto dialético na literatura (ex: Posição Hegemônica, Posição Minoritária Defensável, Doutrina Clássica Consolidada).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação entre variantes fortes/fracas da mesma tese (ex: Realismo Estrutural Epistêmico vs. Ôntico).'
    },
    {
      slotId: 'TESE_NOME',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da tese ou doutrina (sem o prefixo Tese -).'
    },
    {
      slotId: 'TESE_ENUNCIADO',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado afirmativo denso e rigoroso (Respondeo), livre de ambiguidades retóricas.'
    },
    {
      slotId: 'DECOMPOSICAO_TESES',
      sectionTitle: '1. Enunciado da Tese & Posição Doutrinária',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (Tese Nuclear | Compromissos Exigidos | Qualificador Modal de Toulmin).'
    },
    {
      slotId: 'ARGUMENTO_ESQUEMA',
      sectionTitle: '2. Arquitetura Argumentativa (Corpus Argumentativo)',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Esquema argumentativo de Walton/Toulmin utilizado (ex: Argumento Transcendental, Argumento de Indispensabilidade, Redução ao Absurdo da Antítese, Inferência para a Melhor Explicação Filosófica).'
    },
    {
      slotId: 'ARGUMENTO_NUCLEO',
      sectionTitle: '2. Arquitetura Argumentativa (Corpus Argumentativo)',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Síntese em 1 a 2 frases do nervo probante (Ratio central pela qual as premissas forçam a conclusão).'
    },
    {
      slotId: 'ARGUMENTO_CORPO',
      sectionTitle: '2. Arquitetura Argumentativa (Corpus Argumentativo)',
      syntaxKind: 'markdown_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Reconstrução formal das premissas (**Premissa 1 (...):** ..., **Premissa 2 (...):** ..., **Garantia / Inferência:** ..., **Conclusão:** ...) com wikilinks explícitos para os nós de MOC_PRESUPPOSED.'
    },
    {
      slotId: 'DIALETICA_ANTITESES',
      sectionTitle: '3. Fronteira Dialética, Antíteses & Vulnerabilidades (Obj -)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) contrastando esta tese com suas antíteses coordenadas (MOC_COORDINATE) e apontando o ponto exato de divergência.',
      formatPattern: '\t- vs. [[Tese - Antítese]]: Diverge quanto a...'
    },
    {
      slotId: 'DIALETICA_OBJECOES',
      sectionTitle: '3. Fronteira Dialética, Antíteses & Vulnerabilidades (Obj -)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) elencando as objeções mais fortes ([[Obj - ...]]) e a resposta defensiva da tese (Ad Argumentum / Distinguo).',
      formatPattern: '\t- Contra [[Obj - Objeção]]: Responde-se distinguindo...'
    },
    {
      slotId: 'DIALETICA_CUSTOS',
      sectionTitle: '3. Fronteira Dialética, Antíteses & Vulnerabilidades (Obj -)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando as consequências contraintuitivas ou custos teóricos que o defensor da tese precisa aceitar (Biting the Bullet).',
      formatPattern: '\t- **Custo Teórico (Biting the Bullet):** ...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Fronteira Dialética, Antíteses & Vulnerabilidades (Obj -)',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Quaestio -> Premissas -> Tese Atual vs. Antíteses Coordenadas <- Objeções (Obj -). Última linha: `class ID1,ID2 internal-link;`.'
    },
    {
      slotId: 'REF_SOURCES',
      sectionTitle: 'References',
      syntaxKind: 'reference_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Referências bibliográficas primárias indentadas com 1 tab (\\t- ).',
      formatPattern: '\t- Autor, Obra, Seção.'
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
