// packages/core/src/contracts/axiom-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Axiom - ` (`axiom`).
 * Alinhado 1:1 aos 23 slots de `7 - Templates/Axiom -.md` e ao protocolo `Prac - Axiom Note.md`.
 */
export const AXIOM_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'axiom',
  defaultPrefix: 'Axiom - ',
  defaultTemplateFile: 'Axiom -.md',
  ruleModality: AIFRuleModality.INVIOLABLE_PREMISE_K_N,
  requiresZeroInDegree: true,
  protocolReferenceNote: 'Prac - Axiom Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE AXIOMA / POSTULADO (Prac - Axiom Note):',
    '1. Grau de Entrada Dedutivo Zero (d^- = 0 e L = 0): Na ontologia ASPIC+ / AIF, uma nota Axiom - pertence ao conjunto de premissas necessárias invioláveis K_n. O slot MOC_PRESUPPOSED DEVE permanecer ESTRITAMENTE VAZIO para que o compilador não crie RA-Nodes de entrada que rebaixem o axioma a L >= 1. Os termos primitivos e conceitos de assinatura operados pelo axioma devem ser listados em TAXONOMIA_PRIMITIVOS (Seção 2).',
    '2. Irredutibilidade / Independência de Tarski-Hilbert: A proposição A não pode ser dedutível dos demais axiomas coordenados (Sigma \\ {A} ⊬ A). Caso seja dedutível sem perda de generalidade, deve ser reclassificada como Theo -.',
    '3. Consistência Relativa (Satisfatibilidade): Deve existir ao menos um modelo canônico M tal que M |= Sigma U {A}, e um modelo de separação M_{~A} tal que M_{~A} |= (Sigma \\ {A}) U {~A}.',
    '4. Parcimônia Fundacional: Se o axioma for equivalente à conjunção de duas leis independentes, deve ser fatiado ou ter suas cláusulas explicitadas em DECOMPOSICAO_FORMAL.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'MATRIZ DE ROTEAMENTO DE DOMÍNIO E ESPÉCIE DE AXIOMA:',
    '- Domínio A (Lógica Formal, Teoria dos Conjuntos, Fundamentos da Matemática):',
    '  * [A.1] Axioma Estrutural / Existencial de Teoria Formal (ZFC, Peano) -> Chaves em DECOMPOSICAO_FORMAL: Assinatura / Sorts Operados | Fórmula Bem-Formada ( LPO / LSO ) | Escopo Quantificacional e Restrições de Parâmetro.',
    '  * [A.2] Esquema de Axiomas (Axiom Schema — Substituição, Indução) -> Chaves: Metavariável de Fórmula phi(x) | Instanciação Geradora | Condição de Variáveis Livres / Restrição de Linguagem.',
    '  * [A.3] Regra de Inferência Primitiva / Postulado Dedutivo (Gentzen/Prawitz) -> Chaves: Premissas do Sequente | Conclusão do Sequente | Condição Lateral de Aplicação (Eigenvariable).',
    '- Domínio B (Geometria, Física Matemática, Mecânica Analítica, Termodinâmica):',
    '  * [B.1] Postulado Constitutivo / Princípio Variacional ou de Simetria (Hilbert, Einstein, Dirac) -> Chaves: Espaço de Estados / Variedade Ambiente | Invariante / Equação ou Funcional Postulado | Domínio Físico-Matemático de Validade.',
    '- Domínio C (Filosofia, Metafísica, Epistemologia Formal, Teoria da Decisão):',
    '  * [C.1] Primeiro Princípio Ontológico / Epistêmico (Aristóteles, Leibniz, Kolmogorov/Savage) -> Chaves: Domínio Ontológico / Agente Racional | Tese Fundacional Irredutível | Condição de Coerência / Racionalidade Imposta.',
    '- Domínio D (Ética, Direito, Teoria Política, Economia Normativa):',
    '  * [D.1] Postulado Normativo / Grundnorm (Kelsen, Rawls, Arrow) -> Chaves: Sujeitos / Escopo Normativo | Dever-Ser / Regra Constitutiva Primária | Invariante de Justiça ou Validade Jurídica.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Teoria dos Conjuntos]], [[Field - Lógica Matemática]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'DEVE PERMANECER ESTRITAMENTE VAZIO (string vazia "") para garantir grau de entrada dedutivo zero (d^- = 0) e nível L = 0 na Rede Epistêmica. Liste os conceitos e termos primitivos operados em TAXONOMIA_PRIMITIVOS.'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Demais axiomas independentes que compõem o mesmo sistema axiomático Sigma (ex: [[Axiom - Extensionalidade]], [[Axiom - Par]]).',
      formatPattern: '\t\t- [[Axiom - Axioma Coordenado]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Teoremas imediatos ([[Theo - ...]]) e conceitos/estruturas ([[Def - ...]]) cuja existência ou demonstração depende diretamente deste axioma.',
      formatPattern: '\t\t- [[Theo - Teorema Derivado]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Axiomas alternativos/rivais que negam ou relaxam este axioma, ou formulações equivalentes em outros sistemas.',
      formatPattern: '\t- [[Axiom - Axioma Alternativo]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio Epistêmico conforme a Matriz de Roteamento (ex: Domínio A — Lógica Formal e Fundamentos da Matemática).'
    },
    {
      slotId: 'META_SISTEMA',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Sistema formal, teoria axiomática ou corpo doutrinário que este axioma integra (ex: ZFC, Aritmética de Peano, Geometria Euclidiana).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie exata de axioma selecionada na Matriz de Roteamento (ex: Axioma Estrutural [A.1], Esquema de Axiomas [A.2], Postulado Físico [B.1]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estatuto dedutivo (ex: Premissa Necessária Inviolável K_n — Raiz Dedutiva L = 0, Independente de ZF).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação concisa separando este axioma de versões fracas/fortes ou teoremas homônimos.'
    },
    {
      slotId: 'AXIOMA_NOME',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo do axioma ou postulado (sem o prefixo Axiom -).'
    },
    {
      slotId: 'AXIOMA_ENUNCIADO',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado categórico rigoroso em prosa precisa + simbologia lógica/matemática em LaTeX.'
    },
    {
      slotId: 'DECOMPOSICAO_FORMAL',
      sectionTitle: '1. Enunciado Axiomático',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando EXATAMENTE as chaves obrigatórias determinadas pela espécie escolhida em META_TIPO.'
    },
    {
      slotId: 'TAXONOMIA_PRIMITIVOS',
      sectionTitle: '2. Independência & Topologia do Sistema',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) dos termos primitivos, sorts e conceitos de base ([[Def - ...]]) sobre os quais o axioma legisla.',
      formatPattern: '\t- [[Def - Termo Primitivo]]: Papel na assinatura do axioma.'
    },
    {
      slotId: 'TAXONOMIA_INDEPENDENCIA',
      sectionTitle: '2. Independência & Topologia do Sistema',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando por que o axioma não pode ser deduzido dos demais axiomas do sistema e qual o Modelo de Separação M_{~A} (Tarski/Fraenkel-Mostowski/Forcing).',
      formatPattern: '\t- **Modelo de Separação:** Descrição formal.'
    },
    {
      slotId: 'TAXONOMIA_SISTEMAS_ALTERNATIVOS',
      sectionTitle: '2. Independência & Topologia do Sistema',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das teorias ou sistemas que emergem ao negar (~A), enfraquecer ou substituir este axioma.',
      formatPattern: '\t- **Sistema Alternativo:** Descrição.'
    },
    {
      slotId: 'TAXONOMIA_FRONTEIRA_COORDENADA',
      sectionTitle: '2. Independência & Topologia do Sistema',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) mostrando como este axioma se acopla aos demais axiomas coordenados (MOC_COORDINATE) para gerar os teoremas de MOC_DERIVED.',
      formatPattern: '\t- Com [[Axiom - Coordenado]]: Gera [[Theo - Derivado]].'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '2. Independência & Topologia do Sistema',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo este axioma no topo (L=0), sua combinação conjuntiva com axiomas coordenados e as setas para teoremas derivados e sistemas alternativos. Última linha: `class ID1,ID2 internal-link;`.'
    },
    {
      slotId: 'JUSTIFICACAO_CRITERIO',
      sectionTitle: '3. Justificação Epistêmica & Modelos de Consistência',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Justificação fundacional pela qual o axioma é aceito sem prova: evidência intrínseca (Frege/Gödel) e/ou fecundidade extrínseca/indispensabilidade (Russell/Maddy).'
    },
    {
      slotId: 'JUSTIFICACAO_MODELO',
      sectionTitle: '3. Justificação Epistêmica & Modelos de Consistência',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estrutura ou universo canônico M onde o axioma é satisfeito (M |= A), atestando sua consistência relativa.'
    },
    {
      slotId: 'JUSTIFICACAO_PATOLOGIA',
      sectionTitle: '3. Justificação Epistêmica & Modelos de Consistência',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Paradoxo, antinomia, regressão infinita ou anomalia estrutural que o axioma bloqueia.'
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
