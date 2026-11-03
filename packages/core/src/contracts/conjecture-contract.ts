// packages/core/src/contracts/conjecture-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Conj - ` (`conjecture`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Conj -.md` e ao protocolo `Prac - Conj Note.md`.
 */
export const CONJECTURE_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'conjecture',
  defaultPrefix: 'Conj - ',
  defaultTemplateFile: 'Conj -.md',
  ruleModality: AIFRuleModality.DEFEASIBLE_R_D,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Conj Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE CONJECTURA (Prac - Conj Note):',
    '1. Estatuto Defeasible (R_d): Uma Conjectura é uma proposição formal bem-formada cujo valor-verdade permanece aberto (Sigma ⊬ C e Sigma ⊬ ~C), mas que possui suporte indutivo, heurístico ou estrutural substancial.',
    '2. Separação entre Formulação e Teoremas Parciais: MOC_PRESUPPOSED deve conter as definições ([[Def - ...]]) necessárias para que o enunciado faça sentido e os teoremas parciais ([[Theo - ...]]) que fornecem plausibilidade. Já os teoremas condicionais ("Se C vale, então T") pertencem a MOC_DERIVED e CONSEQUENCIAS_CONDICIONAIS.',
    '3. Hierarquia Quantificacional e Falsificabilidade (Kleene): Explicite em DECOMPOSICAO_LOGICA a complexidade quantificacional (ex: Pi_1^0 universal refutável por contra-exemplo finito vs. Pi_2^0 / Sigma_1^0) e em CRITERIO_FALSIFICACAO a anatomia exata do objeto matemático que derrubaria a conjectura (~C).',
    '4. Diagnóstico de Barreira Dedutiva: Especifique em OBSTACULO_DEDUTIVO por que as técnicas atuais de demonstração falham (ex: barreira de paridade em teoria dos crivos, relativização/algebrização em complexidade).'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE CONJECTURA (META_TIPO):',
    '- [C.1] Universal / Invariante Estrutural (Pi_1^0 — ex: Goldbach, Collatz, Riemann) -> Chaves em DECOMPOSICAO_LOGICA: Universo de Discurso e Assinatura | Forma Quantificacional (Hierarquia Aritmética / Analítica) | Condição / Predicado Alvo.',
    '- [C.2] Existencial / Limite Assintótico / Densidade (Pi_2^0 / Sigma_1^0 — ex: Primos Gêmeos, Birch e Swinnerton-Dyer) -> Chaves: Família / Espaço Ambiente | Ordem Assintótica / Invariante Conjecturado | Regime Limite.',
    '- [C.3] Separação de Classes / Impossibilidade Estrutural (ex: P != NP, Conjectura de Schanuel) -> Chaves: Estruturas / Classes Comparadas | Tese de Separação ou Independência | Obstrução Conjecturada.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Teoria dos Números]], [[Field - Complexidade Computacional]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Conceitos constitutivos ([[Def - ...]]) indispensáveis para formular a conjectura e teoremas parciais ([[Theo - ...]]) que ancoram sua plausibilidade.',
      formatPattern: '\t\t- [[Def - Conceito A]], [[Theo - Caso Parcial B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Reformulações equivalentes da mesma conjectura ou conjecturas irmãs do mesmo programa de pesquisa.',
      formatPattern: '\t\t- [[Conj - Conjectura Coordenada]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Teoremas condicionais (C => T) ou algoritmos que assumem esta conjectura como hipótese de trabalho.',
      formatPattern: '\t\t- [[Theo - Consequência Condicional]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Análogos já demonstrados em outros corpos/domínios (ex: Hipótese de Riemann sobre corpos finitos).',
      formatPattern: '\t- [[Theo - Análogo Demonstrado]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio disciplinar da conjectura.'
    },
    {
      slotId: 'META_SISTEMA',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Sistema formal ou teoria ambiente onde o problema está formulado.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de conjectura conforme a Matriz (ex: Universal Pi_1^0 [C.1], Assintótica/Existencial Pi_2^0 [C.2], Separação de Classes [C.3]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estado epistêmico atual (ex: Aberta — Verificada computacionalmente até N, Aberta — Reduzida a casos parciais).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação entre versões fraca/forte ou casos já provados.'
    },
    {
      slotId: 'CONJECTURA_NOME',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da conjectura (sem o prefixo Conj -).'
    },
    {
      slotId: 'CONJECTURA_ENUNCIADO',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado formal preciso da conjectura com quantificadores explícitos e wikilinks [[Def - ...]].'
    },
    {
      slotId: 'DECOMPOSICAO_LOGICA',
      sectionTitle: '1. Enunciado da Conjectura',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (Universo de Discurso | Forma Quantificacional | Predicado Alvo).'
    },
    {
      slotId: 'EVIDENCIA_SUPORTE',
      sectionTitle: '2. Base de Plausibilidade, Casos Resolvidos & Obstáculos Dedutivos',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) detalhando as evidências computacionais, modelos probabilísticos/heurísticos e analogias estruturais que sustentam a plausibilidade defeasible (R_d) da conjectura.',
      formatPattern: '\t- **Verificação Computacional / Heurística:** ...'
    },
    {
      slotId: 'CASOS_DEMONSTRADOS',
      sectionTitle: '2. Base de Plausibilidade, Casos Resolvidos & Obstáculos Dedutivos',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) dos teoremas parciais, cotas ou dimensões particulares já rigorosamente provados ([[Theo - ...]]).',
      formatPattern: '\t- [[Theo - Caso Parcial]]: Demonstra que...'
    },
    {
      slotId: 'OBSTACULO_DEDUTIVO',
      sectionTitle: '2. Base de Plausibilidade, Casos Resolvidos & Obstáculos Dedutivos',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) diagnosticando a barreira técnica formal pela qual os métodos atuais de prova não alcançam o caso geral.',
      formatPattern: '\t- **Barreira Técnica:** ...'
    },
    {
      slotId: 'CONSEQUENCIAS_CONDICIONAIS',
      sectionTitle: '3. Consequências Condicionais & Critério de Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das implicações lógicas que seguem imediatamente se a conjectura for verdadeira (C => T).',
      formatPattern: '\t- **Se $C$ vale:** Implica [[Theo - ...]].'
    },
    {
      slotId: 'EQUIVALENCIAS_COORDENADAS',
      sectionTitle: '3. Consequências Condicionais & Critério de Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) de reformulações matematicamente equivalentes (C <-> C\') em outros domínios ou conjecturas mais fortes/fracas.',
      formatPattern: '\t- **Equivalente a [[Conj - ...]]:** ...'
    },
    {
      slotId: 'CRITERIO_FALSIFICACAO',
      sectionTitle: '3. Consequências Condicionais & Critério de Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) descrevendo a estrutura exata de um contra-modelo falsificador (~C) e as propriedades que ele teria de satisfazer.',
      formatPattern: '\t- **Contra-Modelo Falsificador ($\\neg C$):** ...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Consequências Condicionais & Critério de Falsificabilidade',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) conectando Definições e Casos Parciais (Theo -) -> Conjectura Atual (arestas pontilhadas -.-> R_d) -> Consequências Condicionais e Conjecturas Equivalentes. Última linha: `class ID1,ID2 internal-link;`.'
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
