// packages/core/src/contracts/objection-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Obj - ` (`objection`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Obj -.md` e ao protocolo `Prac - Obj Note.md`.
 */
export const OBJECTION_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'objection',
  defaultPrefix: 'Obj - ',
  defaultTemplateFile: 'Obj -.md',
  ruleModality: AIFRuleModality.CONFLICT_ATTACK,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Obj Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE OBJEÇÃO / DERROTADOR (Prac - Obj Note):',
    '1. Separação Estrita entre Premissas do Ataque (MOC_PRESUPPOSED) e Alvos Atacados (MOC_COORDINATE): Em compileVaultToEpistemicEngine, notas Obj - geram nós de conflito ($ca_k) apontando para os nós listados em MOC_COORDINATE e MOC_RELATED. Portanto: NUNCA coloque a Tese/Hipótese atacada em MOC_PRESUPPOSED! Coloque em MOC_PRESUPPOSED apenas as premissas próprias da objeção (definições, observações anômalas [[Obs - ...]], teoremas de impossibilidade [[Theo - ...]]) e coloque os alvos atacados ([[Tese - ...]], [[Hyp - ...]], [[Law - ...]]) em MOC_COORDINATE (e em META_ALVO).',
    '2. Taxonomia de Derrotadores de Pollock / ASPIC+: Classifique rigorosamente a modalidade do ataque em META_TIPO: (a) Rebutting Defeater (ataca diretamente a conclusão T provando ~T ou construindo contra-exemplo); (b) Undercutting Defeater (ataca o nexo inferencial / warrant entre as premissas e a conclusão sem precisar provar ~T); (c) Undermining Defeater (ataca e invalida uma premissa empírica ou ordinária de base).',
    '3. Princípio da Caridade (Steelmanning) e Tréplica: Ataque a versão mais forte e rigorosa do alvo em ATAQUE_CORPO, examine as melhores defesas do alvo em DIALETICA_REPLICAS e avalie em DIALETICA_TREPLICA sob quais condições o ataque sobrevive.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE MODALIDADES DE DERROTADOR (META_TIPO):',
    '- [OB.1] Derrotador Refutador Direto / Contra-Modelo (Rebutting Defeater — Pollock) -> Chaves em DECOMPOSICAO_CONFLITO: Alvo Atacado e Tese Visada (T) | Premissas / Contra-Exemplo da Objeção | Contradição Formal Gerada (T ^ ~T).',
    '- [OB.2] Derrotador Solapador de Inferência / Non Sequitur (Undercutting Defeater — Pollock) -> Chaves: Inferência / Regra Derrotável Visada (P =>_d Q) | Fator de Desacoplamento / Equivocação Demonstrada | Suspensão da Conclusão.',
    '- [OB.3] Derrotador de Premissa / Anomalia Empírica (Undermining Defeater) -> Chaves: Premissa de Base Atacada (P_i) | Evidência / Demonstração Contrária a P_i | Colapso da Cadeia Dependente.',
    '- [OB.4] Reductio ad Absurdum / Regresso Infinito / Antinomia Interna -> Chaves: Conjunto de Compromissos do Alvo | Derivação Interna do Absurdo / Regresso | Dilema Imposto ao Defensor.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Epistemologia]], [[Field - Filosofia da Mente]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'APENAS as premissas que sustentam a própria objeção: definições ([[Def - ...]]), anomalias empíricas ([[Obs - ...]]) ou teoremas de impossibilidade ([[Theo - ...]]). NUNCA inclua o alvo atacado aqui!',
      formatPattern: '\t\t- [[Def - Conceito A]], [[Obs - Anomalia B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Alvo(s) primário(s) atacado(s) pela objeção ([[Tese - ...]], [[Hyp - ...]], [[Law - ...]]). O compilador AIF gera nós $ca_k de ataque para cada nota listada aqui.',
      formatPattern: '\t\t- [[Tese - Alvo Atacado]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Reformulações teóricas, novas teses ([[Tese - ...]]) ou hipóteses ([[Hyp - ...]]) que nasceram para superar esta objeção.',
      formatPattern: '\t\t- [[Tese - Tese Reformulada]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Alvos secundários ou outras objeções paralelas da mesma família.',
      formatPattern: '\t- [[Obj - Objeção Paralela]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio disciplinar onde ocorre o conflito.'
    },
    {
      slotId: 'META_ALVO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Wikilink(s) explícito(s) para o(s) alvo(s) atacado(s) (ex: [[Tese - ...]] / [[Hyp - ...]]), espelhando MOC_COORDINATE.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Modalidade de derrotador de Pollock conforme a Matriz (ex: Rebutting Defeater [OB.1], Undercutting Defeater [OB.2], Undermining Defeater [OB.3], Reductio ad Absurdum [OB.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Força dialética do ataque (ex: Refutação Letal / Decisiva, Anomalia Severa em Aberto, Objeção Neutralizada por Restrição de Escopo).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação esclarecendo o que esta objeção ataca e o que ela NÃO pretende negar.'
    },
    {
      slotId: 'OBJECAO_NOME',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da objeção, contra-exemplo ou paradoxo (sem o prefixo Obj -).'
    },
    {
      slotId: 'OBJECAO_ENUNCIADO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado incisivo e formal demonstrando a incompatibilidade, falha inferencial ou contra-modelo imposto ao alvo.'
    },
    {
      slotId: 'DECOMPOSICAO_CONFLITO',
      sectionTitle: '1. Enunciado da Objeção & Alvo do Ataque',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da modalidade escolhida em META_TIPO.'
    },
    {
      slotId: 'ATAQUE_PONTO_IMPACTO',
      sectionTitle: '2. Mecanismo de Refutação, Contra-Modelo ou Reductio',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Identificação cirúrgica de qual premissa, cláusula definicional ou passo inferencial do alvo recebe o impacto.'
    },
    {
      slotId: 'ATAQUE_ESTRATEGIA',
      sectionTitle: '2. Mecanismo de Refutação, Contra-Modelo ou Reductio',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Síntese em 1 a 2 frases do mecanismo lógico ou experimental da refutação.'
    },
    {
      slotId: 'ATAQUE_CORPO',
      sectionTitle: '2. Mecanismo de Refutação, Contra-Modelo ou Reductio',
      syntaxKind: 'markdown_body',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Construção formal passo a passo do contra-exemplo, experimento mental (ex: Gettier, Quarto Chinês) ou derivação do absurdo, linkando as premissas de MOC_PRESUPPOSED.'
    },
    {
      slotId: 'DIALETICA_REPLICAS',
      sectionTitle: '3. Resiliência do Alvo, Réplicas (Ad Objectum) & Tréplicas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das principais réplicas defensivas que os partidários do alvo utilizam para tentar escapar da objeção.',
      formatPattern: '\t- **Réplica 1 (...):** ...'
    },
    {
      slotId: 'DIALETICA_TREPLICA',
      sectionTitle: '3. Resiliência do Alvo, Réplicas (Ad Objectum) & Tréplicas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) avaliando se as réplicas funcionam ou se a objeção dispõe de tréplica que restaura o ataque.',
      formatPattern: '\t- **Tréplica:** ...'
    },
    {
      slotId: 'IMPACTO_RECONSTRUTIVO',
      sectionTitle: '3. Resiliência do Alvo, Réplicas (Ad Objectum) & Tréplicas',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) indicando que modificação estrutural ou nova teoria (MOC_DERIVED) é necessária para absorver a lição desta objeção.',
      formatPattern: '\t- **Reconstrução Exigida:** Leva a [[Tese - ...]] / [[Def - ...]].'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Resiliência do Alvo, Réplicas (Ad Objectum) & Tréplicas',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Premissas da Objeção -> Objeção Atual -> Nó de Conflito (CA-Node) -> Alvo Atacado -> Tese Reformulada. Última linha: `class ID1,ID2 internal-link;`.'
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
