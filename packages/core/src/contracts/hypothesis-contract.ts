// packages/core/src/contracts/hypothesis-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Hyp - ` (`hypothesis`).
 * Alinhado 1:1 aos 22 slots de `7 - Templates/Hyp -.md` e ao protocolo `Prac - Hyp Note.md`.
 */
export const HYPOTHESIS_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'hypothesis',
  defaultPrefix: 'Hyp - ',
  defaultTemplateFile: 'Hyp -.md',
  ruleModality: AIFRuleModality.DEFEASIBLE_R_D,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Hyp Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE HIPÓTESE EXPLICATIVA (Prac - Hyp Note):',
    '1. Inferência Abdutiva e Mecanismo Causal (Peirce / Pearl — R_d): Uma nota Hyp - postula um mecanismo causal oculto, estrutura subjacente ou entidade teórica (Explanans) para dar razão a um fenômeno ou anomalia empírica (Explanandum em Obs - ou Law -).',
    '2. Proibição de Explicação Ad Hoc / Virtus Dormitiva (Lakatos/Popper): Para não ser circular, a hipótese DEVE gerar predições observacionais inéditas (H ^ A => O_hat) em PREDICOES_TESTAVEIS que vão além dos dados que motivaram sua criação.',
    '3. Critério de Falsificabilidade Popperiano: Especifique em CRITERIO_FALSIFICABILIDADE qual resultado empírico concreto em um Experimentum Crucis refutaria irrevogavelmente esta hipótese.',
    '4. Inferência para a Melhor Explicação (IBE — Lipton): Em COMPETICAO_RIVAIS, compare esta hipótese com as hipóteses concorrentes de MOC_COORDINATE segundo Poder Unificador, Parcimônia Ontológica (Navalha de Ockham), Precisão Preditiva e Consonância Externa.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE HIPÓTESE (META_TIPO):',
    '- [H.1] Hipótese Mecanística / Causal Subjacente (Biologia, Medicina, Neurociência, Engenharia) -> Chaves em DECOMPOSICAO_CAUSAL: Entidades / Agentes Postulados (Explanans) | Cadeia de Transmissão Causal / Intervenção (do(X) -> M -> Y) | Hipóteses Auxiliares de Acoplamento (A).',
    '- [H.2] Hipótese de Entidade / Estrutura Oculta ou Micro-Modelo (Física Teórica, Cosmologia, Química — ex: Matéria Escura) -> Chaves: Estrutura / Grau de Liberdade Postulado | Acoplamento com Observáveis Conhecidos | Parâmetros Livres do Modelo.',
    '- [H.3] Hipótese Evolutiva / Histórica / Filogenética (Biologia Evolutiva, Geologia, Linguística Histórica) -> Chaves: Estado Ancestral / Condição Inicial Postulada | Pressão Seletiva / Processo de Transição | Traços Vestigiais / Assinaturas Presentes.',
    '- [H.4] Hipótese Cognitiva / Computacional / Comportamental (Psicologia, IA, Economia) -> Chaves: Representação / Arquitetura Interna Postulada | Regra de Processamento / Otimização | Assinatura Comportamental / Tempo de Reação.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Cosmologia]], [[Field - Biologia Molecular]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Pré-requisitos da abdução: as definições teóricas do mecanismo ([[Def - ...]]), as leis de fundo ([[Law - ...]]) e as observações/anomalias ([[Obs - ...]]) que motivaram a hipótese.',
      formatPattern: '\t\t- [[Def - Mecanismo A]], [[Obs - Anomalia B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Hipóteses rivais concorrentes ([[Hyp - ...]]) que tentam explicar o mesmo Explanandum (avaliadas via IBE em COMPETICAO_RIVAIS).',
      formatPattern: '\t\t- [[Hyp - Hipótese Rival]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Predições observacionais derivadas, novos experimentos propostos ([[Obs - ...]] / [[Prac - ...]]) ou leis emergentes caso a hipótese seja verdadeira.',
      formatPattern: '\t\t- [[Obs - Predição Testada]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Objeções críticas ([[Obj - ...]]) ou mecanismos análogos em outros sistemas.',
      formatPattern: '\t- [[Obj - Objeção Relacionada]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio científico onde a hipótese é formulada.'
    },
    {
      slotId: 'META_EXPLANANDUM',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Fenômeno empírico ou anomalia alvo que esta hipótese visa explicar (com wikilink para [[Obs - ...]] ou [[Law - ...]]).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de hipótese conforme a Matriz (ex: Mecanística/Causal [H.1], Entidade/Estrutura Oculta [H.2], Evolutiva/Histórica [H.3], Cognitiva/Computacional [H.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Grau atual de corroboração (ex: Modelo Padrão Dominante, Hipótese em Teste Ativo, Especulativa, Refutada Historicamente).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação separando o mecanismo postulado (Hyp -) da regularidade empírica bruta (Law -) ou da principal hipótese rival.'
    },
    {
      slotId: 'HIPOTESE_NOME',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da hipótese (sem o prefixo Hyp -).'
    },
    {
      slotId: 'HIPOTESE_ENUNCIADO',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado proposicional claro formulando o mecanismo causal ou estrutural postulado (Explanans).'
    },
    {
      slotId: 'DECOMPOSICAO_CAUSAL',
      sectionTitle: '1. Enunciado da Hipótese & Mecanismo Postulado',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO (ex: Entidades Postuladas | Cadeia de Transmissão Causal | Hipóteses Auxiliares A).'
    },
    {
      slotId: 'PODER_EXPLICATIVO',
      sectionTitle: '2. Poder Explicativo, Predições Testáveis & Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) demonstrando como a operação do mecanismo postulado produz exatamente as propriedades quantitativas/qualitativas do Explanandum.',
      formatPattern: '\t- **Geração do Explanandum:** ...'
    },
    {
      slotId: 'PREDICOES_TESTAVEIS',
      sectionTitle: '2. Poder Explicativo, Predições Testáveis & Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) de predições observacionais inéditas (H ^ A => O_hat) que atestam que o programa de pesquisa é progressivo (Lakatos) e não ad hoc.',
      formatPattern: '\t- **Predição $P_1$:** Se $H$ é verdadeira, sob a intervenção $X$, deve-se observar...'
    },
    {
      slotId: 'CRITERIO_FALSIFICABILIDADE',
      sectionTitle: '2. Poder Explicativo, Predições Testáveis & Falsificabilidade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) especificando o Falsificador Potencial Popperiano / Experimentum Crucis que obrigaria o abandono da hipótese.',
      formatPattern: '\t- **Falsificador Potencial ($\\neg \\hat{O}$):** ...'
    },
    {
      slotId: 'BALANCO_FAVORAVEL',
      sectionTitle: '3. Balanço de Evidências (Obs -) & Competição de Hipóteses Rivais',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das evidências independentes ([[Obs - ...]]) que já confirmaram predições desta hipótese.',
      formatPattern: '\t- [[Obs - Evidência]]: Confirma a predição...'
    },
    {
      slotId: 'BALANCO_ANOMALIAS',
      sectionTitle: '3. Balanço de Evidências (Obs -) & Competição de Hipóteses Rivais',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das lacunas abertas, tensões empíricas ou ajustes finos (fine-tuning) ainda não resolvidos pela hipótese.',
      formatPattern: '\t- **Anomalia / Tensão:** ...'
    },
    {
      slotId: 'COMPETICAO_RIVAIS',
      sectionTitle: '3. Balanço de Evidências (Obs -) & Competição de Hipóteses Rivais',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) comparando esta hipótese com cada rival de MOC_COORDINATE segundo os critérios de IBE (Unificação, Parcimônia, Precisão Preditiva).',
      formatPattern: '\t- vs. [[Hyp - Rival]]: Vantagem / Desvantagem em...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Balanço de Evidências (Obs -) & Competição de Hipóteses Rivais',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo Anomalia/Observação Base -> Hipótese Atual vs. Hipótese Rival -> Predições Inéditas e Falsificador. Última linha: `class ID1,ID2 internal-link;`.'
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
