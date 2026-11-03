// packages/core/src/contracts/law-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Law - ` (`law`).
 * Alinhado 1:1 aos 21 slots de `7 - Templates/Law -.md` e ao protocolo `Prac - Law Note.md`.
 */
export const LAW_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'law',
  defaultPrefix: 'Law - ',
  defaultTemplateFile: 'Law -.md',
  ruleModality: AIFRuleModality.DEFEASIBLE_R_D,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Law Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE LEI EMPÍRICA (Prac - Law Note):',
    '1. Regularidade Nomológica Fenomenológica (R_d): Uma nota Law - codifica uma relação invariante, equação funcional ou lei de escala entre grandezas observáveis (F(x_1, ..., x_n) = 0) que suporta contrafactuais dentro de um regime delimitado.',
    '2. Dupla Ancoragem no MOC: MOC_PRESUPPOSED deve conter tanto as definições das grandezas medidas ([[Def - ...]]) e observações experimentais que estabeleceram a lei ([[Obs - ...]]), quanto (em linha disjuntiva OR separada, quando existir) a teoria micro-redutiva ([[Axiom - ...]], [[Theo - ...]] ou [[Hyp - ...]]) da qual a lei emerge como limite.',
    '3. Homogeneidade Dimensional (Teorema Pi de Buckingham): DECOMPOSICAO_FUNCIONAL deve explicitar cada variável, seu domínio matemático, suas dimensões físicas no SI ([M^a L^b T^c ...]) e a natureza das constantes de acoplamento.',
    '4. Cláusulas Ceteris Paribus (Cartwright) e Breakdown Regime: Nenhuma lei empírica vale irrestritamente; especifique em REGIME_CONDICOES as idealizações exigidas e em REGIME_QUEBRA a fronteira exata onde a lei falha e qual lei de ordem superior a substitui.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'CLASSIFICAÇÃO DE ESPÉCIES DE LEI EMPÍRICA (META_TIPO):',
    '- [L.1] Lei Funcional / Equação Constitutiva ou de Estado (ex: Lei de Ohm, Gases Ideais, Hooke) -> Chaves em DECOMPOSICAO_FUNCIONAL: Grandezas de Estado / Variáveis Dependentes e Independentes | Equação Funcional e Homogeneidade Dimensional (SI / Buckingham Pi) | Constantes Fenomenológicas / Parâmetros Material-Dependentes.',
    '- [L.2] Lei de Conservação / Princípio de Balanço ou Simetria Empírica (ex: Conservação de Massa, 1ª Lei da Termodinâmica) -> Chaves: Grandeza Conservada / Densidade e Fluxo | Equação de Continuidade / Invariância Global | Condições de Sistema Isolado / Termos de Fonte.',
    '- [L.3] Lei de Escala / Lei de Potência / Regularidade Estatística (ex: Lei de Kleiber, Lei de Zipf, Lei de Moore/Amdahl) -> Chaves: Variáveis de Escala e Ordem de Grandeza | Expoente Crítico / Distribuição Assintótica | Invariância de Escala e Limites de Saturação.',
    '- [L.4] Regularidade Estrutural / Tendência Ceteris Paribus (Economia, Psicofísica, Biologia — ex: Weber-Fechner, Oferta e Demanda) -> Chaves: Variáveis Comportamentais / Sistêmicas | Direção de Monotonicidade / Elasticidade | Condições Institucionais / Ceteris Paribus.'
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
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Termodinâmica]], [[Field - Eletromagnetismo]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Árvore Booleana de pré-requisitos: Linha 1 (base fenomenológica/experimental): [[Def - Grandeza A]], [[Def - Grandeza B]], [[Obs - Experimento Base]]. Linha 2 opcional (derivação micro-teórica alternativa OR): [[Axiom - Postulado Micro]], [[Theo - Limite Macroscópico]].',
      formatPattern: '\t\t- [[Def - Grandeza A]], [[Obs - Experimento B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Leis empíricas irmãs que operam no mesmo regime ou governam grandezas conjugadas do mesmo sistema.',
      formatPattern: '\t\t- [[Law - Lei Coordenada]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Consequências deduzidas desta lei, procedimentos práticos de engenharia ([[Prac - ...]]) ou hipóteses explicativas ([[Hyp - ...]]) motivadas por ela.',
      formatPattern: '\t\t- [[Prac - Aplicação Derivada]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Leis matematicamente isomorfas em outros domínios (ex: Lei de Fourier do calor vs. Lei de Fick da difusão vs. Lei de Ohm).',
      formatPattern: '\t- [[Law - Análogo Isomorfo]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio científico da lei empírica.'
    },
    {
      slotId: 'META_REGIME',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Escala física/sistêmica de operação (ex: Regime Clássico Não-Relativístico, Limite Termodinâmico Contínuo, Regime Linear de Pequenas Deformações).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie de lei conforme a Matriz (ex: Equação Constitutiva [L.1], Lei de Conservação [L.2], Lei de Escala/Potência [L.3], Regularidade Ceteris Paribus [L.4]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estatuto epistêmico (ex: Lei Fenomenológica Efetiva R_d, Lei Exata no Limite Contínuo, Aproximação de 1ª Ordem em Série de Taylor).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação crucial separando esta lei empírica de uma mera definição nominal (ex: por que F = -kx ou V = RI é uma lei empírica contingente e não uma definição de k ou R).'
    },
    {
      slotId: 'LEI_NOME',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo da lei empírica (sem o prefixo Law -).'
    },
    {
      slotId: 'LEI_ENUNCIADO',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado nomológico preciso + equação matemática formal em LaTeX com todas as grandezas linkadas via [[Def - ...]].'
    },
    {
      slotId: 'DECOMPOSICAO_FUNCIONAL',
      sectionTitle: '1. Enunciado Funcional & Relação Invariante',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando as chaves da espécie escolhida em META_TIPO, incluindo análise dimensional explícita [M^a L^b T^c ...] e parâmetros fenomenológicos.'
    },
    {
      slotId: 'REGIME_CONDICOES',
      sectionTitle: '2. Regime de Validade, Condições Ceteris Paribus & Limites de Quebra',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando todas as condições de contorno e cláusulas ceteris paribus (isotropia, equilíbrio térmico, baixa densidade, etc.) necessárias para a validade da lei.',
      formatPattern: '\t- **Condição Ceteris Paribus:** ...'
    },
    {
      slotId: 'REGIME_QUEBRA',
      sectionTitle: '2. Regime de Validade, Condições Ceteris Paribus & Limites de Quebra',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) especificando os parâmetros adimensionais ou limiares críticos onde a lei colapsa (Breakdown Regime) e qual equação/lei mais geral assume o controle (ex: Van der Waals substituindo Gases Ideais).',
      formatPattern: '\t- **Quebra em [Regime]:** Substituída por [[Law - ...]].'
    },
    {
      slotId: 'REGIME_FRONTEIRA_COORDENADA',
      sectionTitle: '2. Regime de Validade, Condições Ceteris Paribus & Limites de Quebra',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) articulando como esta lei interage com as leis coordenadas de MOC_COORDINATE dentro do mesmo sistema.',
      formatPattern: '\t- Com [[Law - Coordenada]]: ...'
    },
    {
      slotId: 'FUNDAMENTO_EMPIRICO',
      sectionTitle: '3. Ancoragem Experimental (Obs -) & Redução Micro-Teórica',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das observações e experimentos históricos/modernos ([[Obs - ...]]) que corroboram a curva funcional e determinam suas constantes.',
      formatPattern: '\t- [[Obs - Experimento]]: Corrobora a relação na faixa...'
    },
    {
      slotId: 'FUNDAMENTO_REDUCAO',
      sectionTitle: '3. Ancoragem Experimental (Obs -) & Redução Micro-Teórica',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicando a redução interteórica de Nagel: como esta lei macroscópica emerge matematicamente de uma teoria microscópica mais fundamental (ex: Mecânica Estatística / Quântica).',
      formatPattern: '\t- **Redução Micro-Teórica:** Emerge de [[Theo - ...]] / [[Hyp - ...]] quando...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '3. Ancoragem Experimental (Obs -) & Redução Micro-Teórica',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) exibindo a dupla ancoragem (Observações Empíricas Obs - E/OU Redução Micro-Teórica) -> Lei Atual -> Aplicações e Lei Generalizadora no Regime de Quebra. Última linha: `class ID1,ID2 internal-link;`.'
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
