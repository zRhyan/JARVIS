// packages/core/src/contracts/observation-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Obs - ` (`observation`).
 * Alinhado 1:1 aos 23 slots de `7 - Templates/Obs -.md` e ao protocolo `Prac - Obs Note.md`.
 */
export const OBSERVATION_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'observation',
  defaultPrefix: 'Obs - ',
  defaultTemplateFile: 'Obs -.md',
  ruleModality: AIFRuleModality.EMPIRICAL_PREMISE_K_P,
  requiresZeroInDegree: true,
  protocolReferenceNote: 'Prac - Obs Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE OBSERVAÇÃO / EVIDÊNCIA (Prac - Obs Note):',
    '1. Raiz Factual Empírica (d^- = 0 e L = 0 no ramo empírico K_p): Na ontologia ASPIC+ / AIF, uma nota Obs - atua como premissa factual de origem. O slot MOC_PRESUPPOSED DEVE permanecer ESTRITAMENTE VAZIO para que o compilador não crie RA-Nodes de entrada que façam a observação parecer deduzida de uma teoria. Os conceitos, grandezas e instrumentos de medição utilizados na coleta são ancorados em METODOLOGIA_PRIMITIVOS (Seção 2).',
    '2. Neutralidade Protocolar (Carnap/Neurath): O enunciado em OBS_ENUNCIADO deve registrar o fenômeno observável, a medição ou o achado estatístico sob condições C, sem embutir como fato consumado a hipótese explicativa oculta (que pertence a Hyp - em MOC_DERIVED).',
    '3. Explicitação da Carga Teórica Instrumental (Duhem-Quine): Nenhuma medição é livre de pressupostos instrumentais; explicite em DECOMPOSICAO_PROTOCOLAR quais teorias ópticas, metrológicas ou estatísticas foram assumidas para traduzir o sinal bruto no dado reportado.',
    '4. Subdeterminação da Teoria pelos Dados: Em IMPACTO_SUBDETERMINACAO, registre quais hipóteses alternativas também são compatíveis com o dado observado.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE OBSERVAÇÃO / EVIDÊNCIA (META_TIPO):',
    '- [O.1] Medição Experimental Controlada / Laboratorial (Física, Química, Biologia Experimental) -> Chaves em DECOMPOSICAO_PROTOCOLAR: Sistema / Amostra e Condições de Contorno (C) | Sinal / Grandeza Medida e Valor Registrado (O) | Carga Teórica Instrumental (Hipóteses Auxiliares de Calibração A_inst).',
    '- [O.2] Evidência Observacional / Coorte / Levantamento Estatístico (Epidemiologia, Economia, Astronomia) -> Chaves: População / Recorte Espaço-Temporal e Amostragem | Estimador / Associação Empírica Observada | Pressupostos do Modelo Estatístico / Identificação.',
    '- [O.3] Registro Clínico / Estudo de Caso / Fenomenologia Qualitativa (Medicina, Neuropsicologia, História) -> Chaves: Sujeito / Fonte Primária e Contexto | Manifestação / Evidência Documental ou Clínica Registrada | Critério de Autenticidade / Diagnóstico Diferencial.',
    '- [O.4] Benchmark Computacional / Simulação Empírica (Ciência da Computação, IA, Engenharia) -> Chaves: Arquitetura / Ambiente de Execução e Dataset | Métrica / Comportamento Emergente Observado | Hiperparâmetros e Condições de Reprodutibilidade.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Física Experimental]], [[Field - Neurociência]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'DEVE PERMANECER ESTRITAMENTE VAZIO (string vazia "") para garantir grau de entrada dedutivo zero (d^- = 0) e nível L = 0 como raiz empírica K_p. Liste as grandezas e conceitos operados em METODOLOGIA_PRIMITIVOS.'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Replicações independentes, observações complementares da mesma bateria experimental ou medições em regimes adjacentes.',
      formatPattern: '\t\t- [[Obs - Observação Coordenada]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Leis empíricas ([[Law - ...]]) ajustadas sobre este dado, hipóteses ([[Hyp - ...]]) abduzidas/corroboradas ou objeções ([[Obj - ...]]) baseadas nesta anomalia.',
      formatPattern: '\t\t- [[Law - Lei Derivada]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Fenômenos análogos ou protocolos experimentais relacionados ([[Prac - ...]]).',
      formatPattern: '\t- [[Prac - Protocolo Experimental]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio empírico/experimental da observação.'
    },
    {
      slotId: 'META_CONTEXTO',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Experimento histórico, laboratório, missão observacional, coorte ou dataset de origem.'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de evidência conforme a Matriz (ex: Medição Experimental Controlada [O.1], Evidência Observacional/Estatística [O.2], Estudo de Caso [O.3], Benchmark [O.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Qualificação de robustez empírica (ex: Premissa Empírica K_p — Replicada > 5 sigma, Dado Preliminar, Anomalia Consolidada).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação separando o fato empírico bruto (Obs -) da lei matemática (Law -) ou da hipótese teórica (Hyp -) que o interpreta.'
    },
    {
      slotId: 'OBS_NOME',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da observação ou experimento (sem o prefixo Obs -).'
    },
    {
      slotId: 'OBS_ENUNCIADO',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Sentença protocolar precisa descrevendo: sob as condições C, observou-se/mediu-se a resposta/grandeza O com magnitude e margem de incerteza explícitas.'
    },
    {
      slotId: 'DECOMPOSICAO_PROTOCOLAR',
      sectionTitle: '1. Enunciado Protocolar & Dado Factual',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos conforme a espécie em META_TIPO (Sistema/Condições C | Sinal/Grandeza Medida O | Carga Teórica Instrumental de Duhem-Quine A_inst).'
    },
    {
      slotId: 'METODOLOGIA_PRIMITIVOS',
      sectionTitle: '2. Metodologia de Aquisição, Controles & Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) ancorando as grandezas medidas e instrumentos ([[Def - ...]], [[Prac - ...]]) sem violar d^- = 0 no MOC.',
      formatPattern: '\t- [[Def - Grandeza]]: Papel na medição.'
    },
    {
      slotId: 'METODOLOGIA_CONTROLES',
      sectionTitle: '2. Metodologia de Aquisição, Controles & Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) detalhando o desenho de controle (grupo controle, cegamento, isolamento térmico/eletromagnético, calibração).',
      formatPattern: '\t- **Controle Experimental:** ...'
    },
    {
      slotId: 'METODOLOGIA_CONFIABILIDADE',
      sectionTitle: '2. Metodologia de Aquisição, Controles & Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) reportando resolução instrumental, barra de erro, p-valor / razão sinal-ruído (sigma) e histórico de replicações independentes.',
      formatPattern: '\t- **Incerteza / Significância:** ...'
    },
    {
      slotId: 'METODOLOGIA_VIESES',
      sectionTitle: '2. Metodologia de Aquisição, Controles & Validade',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) mapeando potenciais variáveis de confusão (confounders), artefatos instrumentais ou vieses de seleção e como foram mitigados.',
      formatPattern: '\t- **Confounder / Viés Potencial:** ...'
    },
    {
      slotId: 'IMPACTO_CORROBORACAO',
      sectionTitle: '3. Impacto Epistêmico na Rede (Confirmação, Anomalia & Subdeterminação)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das leis ([[Law - ...]]), hipóteses ([[Hyp - ...]]) ou teses ([[Tese - ...]]) corroboradas indutivamente/abdutivamente por este dado.',
      formatPattern: '\t- Corrobora [[Hyp - ...]]: Pois...'
    },
    {
      slotId: 'IMPACTO_REFUTACAO',
      sectionTitle: '3. Impacto Epistêmico na Rede (Confirmação, Anomalia & Subdeterminação)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das hipóteses/teorias que sofrem falsificação ou anomalia severa diante deste resultado (Experimentum Crucis).',
      formatPattern: '\t- Refuta / Tensiona [[Hyp - ...]]: Pois...'
    },
    {
      slotId: 'IMPACTO_SUBDETERMINACAO',
      sectionTitle: '3. Impacto Epistêmico na Rede (Confirmação, Anomalia & Subdeterminação)',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando quais explicações alternativas permanecem empiricamente equivalentes frente a este dado isolado.',
      formatPattern: '\t- **Subdeterminação:** ...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Impacto Epistêmico na Rede (Confirmação, Anomalia & Subdeterminação)',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo esta Observação no topo (L=0, K_p) gerando suporte indutivo para Leis/Hipóteses e conflito contra Hipóteses Refutadas. Última linha: `class ID1,ID2 internal-link;`.'
    },
    {
      slotId: 'REF_SOURCES',
      sectionTitle: 'References',
      syntaxKind: 'reference_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Referências bibliográficas ou papers originais indentados com 1 tab (\\t- ).',
      formatPattern: '\t- Autor, Paper, Ano.'
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
