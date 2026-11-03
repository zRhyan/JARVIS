// packages/core/src/contracts/theorem-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Theo - ` (`theorem`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Theo -.md` e ao protocolo `Prac - Theo Note.md`.
 */
export const THEOREM_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'theorem',
  defaultPrefix: 'Theo - ',
  defaultTemplateFile: 'Theo -.md',
  ruleModality: AIFRuleModality.STRICT_R_S,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Theo Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE TEOREMA / PROPOSIÇÃO (Prac - Theo Note):',
    '1. Unificação dos 5 Papéis Dedutivos (R_s): O prefixo Theo - abrange Teorema, Proposição, Lema, Corolário e Proprium Demonstrado. Especifique a categoria exata em META_STATUS.',
    '2. Fechamento Dedutivo Estrito (Proibição de Entimemas): Toda definição ([[Def - ...]]), axioma ([[Axiom - ...]]) ou lema/teorema anterior ([[Theo - ...]]) invocado nos passos da demonstração (PROVA_CORPO) DEVE estar declarado no fecho conjuntivo de MOC_PRESUPPOSED.',
    '3. Decomposição do Sequente de Gentzen (U, Gamma |- Delta): Separe rigorosamente (1) Contexto / Assinatura Ambiente U, (2) Antecedente / Hipóteses Locais Gamma = {H_1, ..., H_k}, e (3) Consequente / Tese Demonstrada Delta.',
    '4. Auditoria de Minimalidade das Hipóteses e Estatuto da Recíproca: Para cada hipótese H_i em Gamma, exiba em ESCOPO_MINIMALIDADE_HIPOTESES o contra-modelo que satisfaz Gamma \\ {H_i} mas viola Delta. Em ESCOPO_RECIPROCA, analise se Delta => Gamma vale, falha (exibindo contra-exemplo) ou vale sob condição adicional C+.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE META_STATUS E ESPÉCIE PROPOSICIONAL (META_TIPO):',
    '- Valores Canônicos de META_STATUS (reutilizado no título do callout [!theo]): `Teorema` | `Proposição` | `Lema` | `Corolário` | `Proprium Demonstrado`.',
    '- Espécies Proposicionais para META_TIPO e chaves obrigatórias em DECOMPOSICAO_SEQUENTE:',
    '  * [T.1] Implicação Condicional / Sequente Direto (Gamma |- P => Q) -> Chaves: Contexto / Assinatura Ambiente (U) | Hipóteses / Antecedente (Gamma) | Tese / Consequente (Delta).',
    '  * [T.2] Caracterização / Equivalência Múltipla (TFAE: P1 <-> P2 <-> P3) -> Chaves: Estrutura Ambiente (U) | Condições Equivalentes (P_1, ..., P_m) | Ciclo de Implicações Demonstrado.',
    '  * [T.3] Teorema de Existência e/ou Unicidade (forall x exists! y P(x,y)) -> Chaves: Contexto / Parâmetros de Entrada | Tese de Existência (Construtiva vs. Não-Construtiva) | Condição de Unicidade (a menos de Isomorfismo/Equivalência).',
    '  * [T.4] Teorema de Impossibilidade / Limitação / No-Go (Gamma |- ~exists x P(x)) -> Chaves: Sistema / Pressupostos Assumidos (Gamma) | Alvo Bloqueado (~exists x P(x)) | Invariante / Obstrução Violada.',
    '  * [T.5] Teorema de Classificação / Decomposição Canônica -> Chaves: Classe de Objetos Classificada | Família de Invariantes / Formas Normais | Relação de Equivalência / Isomorfismo.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Análise Real]], [[Field - Topologia]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Árvore Booleana de pré-requisitos dedutivos estritos. Mesma linha = conjunção (AND) de todas as definições, axiomas e lemas usados em uma prova; linhas separadas = disjunção (OR) representando provas independentes alternativas.',
      formatPattern: '\t\t- [[Def - Conceito A]], [[Axiom - Axioma B]], [[Theo - Lema C]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Teoremas irmãos de mesmo nível epistêmico L (teoremas duais, recíprocos ou casos complementares).',
      formatPattern: '\t\t- [[Theo - Teorema Coordenado]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Corolários imediatos, teoremas mais profundos (L+1) e procedimentos algorítmicos ([[Prac - ...]]) fundamentados por este teorema.',
      formatPattern: '\t\t- [[Theo - Corolário Derivado]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Análogos estruturais em outros domínios ou conjecturas abertas relacionadas.',
      formatPattern: '\t- [[Theo - Análogo]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio disciplinar e subárea matemática/formal.'
    },
    {
      slotId: 'META_SISTEMA',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Sistema axiomático ou teoria de base em que a prova é válida (ex: ZFC, ZF sem Escolha, Lógica Intuicionista).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie proposicional conforme a Matriz (ex: Implicação Condicional [T.1], Caracterização TFAE [T.2], Existência e Unicidade [T.3], Impossibilidade [T.4], Classificação [T.5]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Exatamente uma das 5 categorias canônicas: `Teorema`, `Proposição`, `Lema`, `Corolário` ou `Proprium Demonstrado` (este slot também intitula o callout [!theo]).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação concisa diferenciando este resultado de versões em outras dimensões/regimes ou da própria definição constitutiva.'
    },
    {
      slotId: 'TEOREMA_NOME',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo do teorema/proposição/lema (sem o prefixo Theo -).'
    },
    {
      slotId: 'TEOREMA_ENUNCIADO',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado formal completo, autossuficiente, com quantificadores explícitos e wikilinks [[Def - ...]] para todas as estruturas envolvidas.'
    },
    {
      slotId: 'DECOMPOSICAO_SEQUENTE',
      sectionTitle: '1. Enunciado Proposicional',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (ex: Contexto / Assinatura Ambiente (U) | Hipóteses / Antecedente (Gamma) | Tese / Consequente (Delta)).'
    },
    {
      slotId: 'PROVA_METODO',
      sectionTitle: '2. Demonstração & Arquitetura Dedutiva (Q.E.D.)',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Paradigma dedutivo empregado (ex: Dedução Direta, Redução ao Absurdo, Contraposição, Indução Estrutural/Transfinita, Argumento Diagonal).'
    },
    {
      slotId: 'PROVA_ESTRATEGIA',
      sectionTitle: '2. Demonstração & Arquitetura Dedutiva (Q.E.D.)',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Síntese em 1 a 2 frases da engrenagem central da demonstração (Proof Sketch / Ideia Central antes do formalismo).'
    },
    {
      slotId: 'PROVA_CORPO',
      sectionTitle: '2. Demonstração & Arquitetura Dedutiva (Q.E.D.)',
      syntaxKind: 'markdown_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Demonstração passo a passo numerada (**Passo 1 (...):** ...), justificando cada transição lógica com wikilinks explícitos para [[Def - ...]], [[Axiom - ...]] ou [[Theo - ...]] declarados em MOC_PRESUPPOSED, encerrando com $\\blacksquare$.'
    },
    {
      slotId: 'ESCOPO_MINIMALIDADE_HIPOTESES',
      sectionTitle: '3. Topologia de Condições, Recíproca & Escopo de Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) exibindo, para cada hipótese H_i do antecedente Gamma, um contra-modelo concreto que satisfaz Gamma \\ {H_i} mas falha na tese Delta.',
      formatPattern: '\t- **Sem a hipótese $H_i$ (...):** Contra-exemplo concreto...'
    },
    {
      slotId: 'ESCOPO_RECIPROCA',
      sectionTitle: '3. Topologia de Condições, Recíproca & Escopo de Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando se a recíproca (Delta => Gamma) é verdadeira, falsa (fornecendo contra-exemplo) ou verdadeira mediante condição suplementar C+.',
      formatPattern: '\t- **Recíproca ($\\Delta \\implies \\Gamma$):** Falsa/Verdadeira...'
    },
    {
      slotId: 'ESCOPO_FRONTEIRA_COORDENADA',
      sectionTitle: '3. Topologia de Condições, Recíproca & Escopo de Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) situando o teorema frente a generalizações, casos particulares (corolários) e teoremas coordenados.',
      formatPattern: '\t- **Generalização / Caso Particular:** [[Theo - ...]]'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Topologia de Condições, Recíproca & Escopo de Validade',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo o fluxo dedutivo: Premissas (Def/Axiom/Lemas) -> Nó de Inferência (&) -> Teorema Atual -> Corolários Derivados. Última linha: `class ID1,ID2 internal-link;`.'
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
