// packages/core/src/contracts/quaestio-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Quest - ` (`quaestio`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Quest -.md` e ao protocolo `Prac - Quest Note.md`.
 */
export const QUAESTIO_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'quaestio',
  defaultPrefix: 'Quest - ',
  defaultTemplateFile: 'Quest -.md',
  ruleModality: AIFRuleModality.INQUIRY_SYNTHESIS,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Quest Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE QUAESTIO / QUESTÃO (Prac - Quest Note):',
    '1. Nó de Bifurcação e Arbitragem Dialética (IBIS Issue / Quaestio Disputata): Uma nota Quest - mapeia imparcialmente o espaço de soluções concorrentes ([[Tese - ...]] ou [[Hyp - ...]]) para um problema aberto fundamental.',
    '2. Alinhamento do MOC: MOC_PRESUPPOSED contém os conceitos e dados comuns aceitos por todos os lados do debate (terreno compartilhado P). MOC_COORDINATE lista as teses/hipóteses rivais em disputa. MOC_DERIVED lista as sub-questões subordinadas.',
    '3. Decomposição Interrogativa (Lógica de Questões — Belnap/Bramorski): Em DECOMPOSICAO_QUESTAO, explicite os Pressupostos da Pergunta (P), o Ponto de Bifurcação (Status Quaestionis) e a Partição do Espaço de Respostas Admissíveis (A = {T_1, ..., T_k}).',
    '4. Matriz Comparativa e Solutio Condicional: Em DISPUTA_MATRIZ_POSICOES, construa uma tabela Markdown imparcial comparando cada posição nos critérios de avaliação, e em SINTESE_DECISORIA formule a regra de decisão condicional ("Se priorizarmos o critério C_1 -> adota-se T_1; se C_2 -> adota-se T_2") e desfaça eventuais falsos dilemas em SINTESE_FALSOS_DILEMAS.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE QUAESTIO (META_TIPO):',
    '- [Q.1] Dilema / Polilema Filosófico ou Fundacional (Utrum... an... — Escolástica) -> Chaves em DECOMPOSICAO_QUESTAO: Pressupostos Comuns da Pergunta (P) | Ponto Exato de Bifurcação (Status Quaestionis) | Espaço de Respostas Diretas (A = {T_1, ..., T_n}).',
    '- [Q.2] Problema Científico em Aberto / Competição de Modelos (Laudan) -> Chaves: Fenômeno / Tensão Empírica Compartilhada (P) | Gargalo Explicativo Central | Famílias de Hipóteses Concorrentes (A = {H_1, ..., H_n}).',
    '- [Q.3] Problema de Decisão / Trade-off de Arquitetura ou Engenharia (IBIS Issue — Rittel/Kunz) -> Chaves: Requisitos e Restrições do Sistema (P) | Conflito de Otimização (Trade-off Central) | Alternativas de Projeto / Procedimento (A = {Prac_1, ..., Prac_n}).'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Filosofia da Matemática]], [[Field - Arquitetura de Sistemas]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Pressupostos comuns compartilhados por todos os debatedores: as definições ([[Def - ...]]), axiomas ([[Axiom - ...]]) ou fatos ([[Obs - ...]]) sem os quais a pergunta nem sequer pode ser formulada.',
      formatPattern: '\t\t- [[Def - Conceito Comum A]], [[Obs - Fato Compartilhado B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'As posições concorrentes que respondem a esta questão ([[Tese - ...]], [[Hyp - ...]] ou [[Prac - ...]]) ou questões irmãs do mesmo nível.',
      formatPattern: '\t\t- [[Tese - Posição Concorrente 1]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Sub-questões mais específicas ([[Quest - ...]]) que emergem após o desdobramento desta questão principal.',
      formatPattern: '\t\t- [[Quest - Sub-Questão Derivada]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Objeções cruzadas ([[Obj - ...]]) decisivas no debate ou debates análogos em outras áreas.',
      formatPattern: '\t- [[Obj - Objeção Crucial]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio disciplinar ou interdisciplinar da questão.'
    },
    {
      slotId: 'META_APORIA',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'O conflito intuitivo, paradoxo aparente ou gargalo empírico/técnico que origina a pergunta.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de questão conforme a Matriz (ex: Dilema/Polilema Fundacional [Q.1], Problema Científico em Aberto [Q.2], Trade-off de Arquitetura IBIS [Q.3]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estado atual do debate (ex: Questão Aberta Perene, Dissolvida por Distinção Conceitual, Consenso Condicional Estabelecido).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação separando esta pergunta de questões vizinhas que frequentemente são confundidas com ela.'
    },
    {
      slotId: 'QUEST_NOME',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da questão (sem o prefixo Quest -).'
    },
    {
      slotId: 'QUEST_ENUNCIADO',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Pergunta formalmente calibrada e neutra (sem implícitos tendenciosos / begging the question).'
    },
    {
      slotId: 'DECOMPOSICAO_QUESTAO',
      sectionTitle: '1. Formulação da Quaestio & Pressupostos da Questão',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (Pressupostos Comuns P | Ponto de Bifurcação / Status Quaestionis | Espaço de Respostas A).'
    },
    {
      slotId: 'DISPUTA_EIXOS',
      sectionTitle: '2. Topografia das Posições em Disputa & Matriz de Trade-offs',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'O(s) eixo(s) conceitual(is) que dividem as escolas/posições (ex: Independência Ontológica vs. Construtibilidade Epistêmica).'
    },
    {
      slotId: 'DISPUTA_CRITERIOS',
      sectionTitle: '2. Topografia das Posições em Disputa & Matriz de Trade-offs',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Critérios objetivos usados para comparar as posições (ex: Parcimônia, Poder Explicativo, Fidelidade à Prática, Custo Computacional).'
    },
    {
      slotId: 'DISPUTA_MATRIZ_POSICOES',
      sectionTitle: '2. Topografia das Posições em Disputa & Matriz de Trade-offs',
      syntaxKind: 'markdown_table_and_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Tabela Markdown comparativa (`| Posição | Tese Central | Principal Força | Principal Vulnerabilidade (Obj -) |`) seguida de breve síntese de cada posição concorrente com wikilinks [[Tese - ...]] / [[Hyp - ...]].'
    },
    {
      slotId: 'SINTESE_DECISORIA',
      sectionTitle: '3. Árvore Decisória, Síntese Dialética (Solutio) & Questões Subordinadas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) formulando a regra de decisão condicional: sob quais premissas ou prioridades adota-se cada resposta.',
      formatPattern: '\t- **Se priorizarmos [Critério X]:** Adota-se [[Tese - A]], pois...'
    },
    {
      slotId: 'SINTESE_FALSOS_DILEMAS',
      sectionTitle: '3. Árvore Decisória, Síntese Dialética (Solutio) & Questões Subordinadas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) identificando se algum pressuposto oculto da própria pergunta gera um falso dilema e como uma terceira via / distinção o dissolve.',
      formatPattern: '\t- **Pressuposto Questionável / Terceira Via:** ...'
    },
    {
      slotId: 'SINTESE_SUBQUESTOES',
      sectionTitle: '3. Árvore Decisória, Síntese Dialética (Solutio) & Questões Subordinadas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das sub-questões derivadas ([[Quest - ...]]) abertas por cada ramo de resposta.',
      formatPattern: '\t- [[Quest - Sub-Questão]]: Surge caso se adote...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Árvore Decisória, Síntese Dialética (Solutio) & Questões Subordinadas',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Pressupostos Comuns -> Quaestio Atual -> Bifurcação para as Posições Concorrentes (Tese/Hyp) <- Objeções Principais -> Sub-Questões. Última linha: `class ID1,ID2 internal-link;`.'
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
