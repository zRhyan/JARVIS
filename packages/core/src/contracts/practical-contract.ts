// packages/core/src/contracts/practical-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Prac - ` / `Prat - ` (`practical`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Prac -.md` e ao protocolo `Prac - Prac Note.md`.
 */
export const PRACTICAL_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'practical',
  defaultPrefix: 'Prac - ',
  defaultTemplateFile: 'Prac -.md',
  ruleModality: AIFRuleModality.PROCEDURAL,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Prac Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE NOTA PRÁTICA / OPERACIONAL (Prac - Prac Note):',
    '1. Lógica de Hoare e Design by Contract ({P} C {Q}): Toda nota Prac - especifica uma transformação procedural determinística ou heurística que leva um estado de entrada que satisfaz a Pré-Condição P a um estado de saída que garante a Pós-Condição Q, preservando um Invariante I.',
    '2. Ancoragem Teórica da Correção (Why it Works): Nenhum algoritmo ou protocolo opera no vácuo; MOC_PRESUPPOSED e FUNDAMENTO_TEORICO devem apontar para as definições das estruturas de dados/conceitos ([[Def - ...]]) e para os teoremas ou leis empíricas ([[Theo - ...]], [[Law - ...]]) que provam que o procedimento termina e é correto.',
    '3. Executabilidade Sem Ambiguidade: PROCEDIMENTO_CORPO deve listar os passos sequenciais acionáveis (com critérios de decisão if/else e blocos de código/comandos quando aplicável).',
    '4. Blindagem Operacional: Especifique os casos degenerados (Edge Cases) em FALHAS_EDGE_CASES, os erros recorrentes de aplicação em FALHAS_ANTIPADROES e os trade-offs frente a procedimentos alternativos (MOC_COORDINATE) em TRADEOFFS_COORDENADOS.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE PROCEDIMENTO (META_TIPO):',
    '- [P.1] Algoritmo / Estrutura de Dados / Padrão de Arquitetura de Software -> Chaves em DECOMPOSICAO_CONTRATO: Entrada & Pré-Condições (P) | Saída & Pós-Condições Garantidas (Q) | Invariante de Laço / Estado e Critério de Terminação (Variante).',
    '- [P.2] Protocolo Experimental / Laboratorial / Clínico / Metrológico -> Chaves: Insumos, Aparato & Condições de Preparo (P) | Resultado / Medição ou Estado Alvo Obtido (Q) | Controles de Qualidade, Segurança e Calibração (Invariante).',
    '- [P.3] Método de Resolução Matemática / Algoritmo Simbólico (ex: Eliminação Gaussiana, Integração por Partes) -> Chaves: Forma da Expressão / Sistema de Entrada (P) | Forma Normal / Solução Obtida (Q) | Transformação Elementar Preservadora de Equivalência.',
    '- [P.4] Protocolo Epistêmico / Metodológico / Fluxo de Trabalho Cognitivo -> Chaves: Artefato / Insumo Cognitivo de Entrada (P) | Artefato Validado de Saída (Q) | Regras de Auditoria e Invariantes de Qualidade.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Algoritmos]], [[Field - Engenharia de Software]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estruturas/conceitos operados ([[Def - ...]]), teoremas/leis que garantem a correção do método ([[Theo - ...]], [[Law - ...]]) e sub-rotinas pré-requisito ([[Prac - ...]]).',
      formatPattern: '\t\t- [[Def - Estrutura A]], [[Theo - Teorema de Correção B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Algoritmos ou protocolos alternativos que resolvem o mesmo problema com diferentes trade-offs de tempo, espaço ou precisão.',
      formatPattern: '\t\t- [[Prac - Método Alternativo]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Pipelines compostos ou procedimentos de nível superior ([[Prac - ...]]) que invocam este procedimento como sub-rotina.',
      formatPattern: '\t\t- [[Prac - Pipeline Composto]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Questões de projeto ([[Quest - ...]]) ou observações de benchmark ([[Obs - ...]]) associadas.',
      formatPattern: '\t- [[Obs - Benchmark Relacionado]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio técnico, computacional, matemático ou experimental.'
    },
    {
      slotId: 'META_OBJETIVO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Problema operacional exato que este procedimento resolve.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de procedimento conforme a Matriz (ex: Algoritmo Computacional [P.1], Protocolo Experimental [P.2], Método Simbólico [P.3], Protocolo Epistêmico [P.4]).'
    },
    {
      slotId: 'META_CUSTO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Complexidade assintótica de tempo e espaço (ex: Tempo O(V log V + E), Espaço O(V)) ou custo operacional/instrumental.'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação separando este método de algoritmos similares com pré-condições distintas (ex: Dijkstra vs. Bellman-Ford quanto a pesos negativos).'
    },
    {
      slotId: 'PRAC_NOME',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo do procedimento ou algoritmo (sem o prefixo Prac -).'
    },
    {
      slotId: 'PRAC_ENUNCIADO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Especificação funcional concisa descrevendo a transformação {P} -> {Q} realizada pelo procedimento.'
    },
    {
      slotId: 'DECOMPOSICAO_CONTRATO',
      sectionTitle: '1. Especificação Operacional & Contrato de Execução',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (Entrada & Pré-Condições P | Saída & Pós-Condições Q | Invariante e Terminação).'
    },
    {
      slotId: 'FUNDAMENTO_TEORICO',
      sectionTitle: '2. Algoritmo, Protocolo Passo a Passo & Implementação',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Wikilink(s) e explicação de qual teorema ([[Theo - ...]]) ou lei ([[Law - ...]]) garante que o método funciona.'
    },
    {
      slotId: 'FUNDAMENTO_INVARIANTE',
      sectionTitle: '2. Algoritmo, Protocolo Passo a Passo & Implementação',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'A propriedade estrutural ou física que permanece verdadeira ao final de cada passo/iteração e assegura a pós-condição Q.'
    },
    {
      slotId: 'PROCEDIMENTO_CORPO',
      sectionTitle: '2. Algoritmo, Protocolo Passo a Passo & Implementação',
      syntaxKind: 'markdown_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Sequência numerada de etapas operacionais (**Etapa 1 — ...:** ...) acompanhada, quando pertinente, de pseudocódigo ou implementação limpa em bloco de código.'
    },
    {
      slotId: 'FALHAS_EDGE_CASES',
      sectionTitle: '3. Casos de Borda (Edge Cases), Modos de Falha & Trade-offs',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) detalhando entradas degeneradas (conjunto vazio, dimensão zero, colinearidade, saturação) e como tratá-las.',
      formatPattern: '\t- **Caso de Borda (...):** Tratamento...'
    },
    {
      slotId: 'FALHAS_ANTIPADROES',
      sectionTitle: '3. Casos de Borda (Edge Cases), Modos de Falha & Trade-offs',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) alertando sobre violações de pré-condição ou erros clássicos de implementação (Anti-Patterns).',
      formatPattern: '\t- **Anti-Padrão / Armadilha:** ...'
    },
    {
      slotId: 'TRADEOFFS_COORDENADOS',
      sectionTitle: '3. Casos de Borda (Edge Cases), Modos de Falha & Trade-offs',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) comparando quando preferir este procedimento vs. os procedimentos alternativos de MOC_COORDINATE.',
      formatPattern: '\t- vs. [[Prac - Alternativa]]: Preferir este quando...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Casos de Borda (Edge Cases), Modos de Falha & Trade-offs',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Estruturas e Teorema Garantidor -> Procedimento Atual (e Alternativas Coordenadas) -> Pipelines Derivados. Última linha: `class ID1,ID2 internal-link;`.'
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
