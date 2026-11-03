// packages/core/src/contracts/definition-contract.ts

import { AIFRuleModality } from '../epistemic-types.js';
import type { NoteSlotContract } from './contract-types.js';

/**
 * Contrato modular e autossuficiente para notas do tipo `Def - ` (`definition`).
 * Alinhado 1:1 aos 21 slots de `7 - Templates/Def -.md` e ao protocolo `Prac - Def Note.md`.
 */
export const DEFINITION_SLOT_CONTRACT: NoteSlotContract = {
  canonicalType: 'definition',
  defaultPrefix: 'Def - ',
  defaultTemplateFile: 'Def -.md',
  ruleModality: AIFRuleModality.STRICT_R_S,
  requiresZeroInDegree: false,
  protocolReferenceNote: 'Prac - Def Note',
  globalProtocolSummary: [
    'PROTOCOLO ALGORÍTMICO DE CONSTRUÇÃO DE DEFINIÇÃO (Prac - Def Note):',
    '1. Atomicidade Epistêmica Estrita ({D_X} ⊬ P): Uma nota Def - introduz uma equivalência constitutiva ou regra de abreviação conservativa. É PROIBIDO incluir demonstrações de teoremas, propriedades não-triviais (Propria) ou consequências dedutivas no corpo da definição — tais resultados pertencem a notas Theo - listadas em Derived Concepts.',
    '2. Exceções de Indefinibilidade: Antes de aplicar gênero e diferença, verifique: (Exceção A) Termo Primitivo / Ur-Element (d^- = 0, ex: Conjunto, Ponto) -> use Elucidação Primitiva (Frege/Hilbert) e deixe MOC_PRESUPPOSED vazio; (Exceção B) Transcendental / Meta-Categorial -> use Delimitação Transcendental; (Exceção C) Termo Teórico / Símbolo Incompleto -> use Definição Contextual (Russell) ou Caracterização de Ramsey-Lewis.',
    '3. Auditoria das 7 Leges Definitionis + 2 Critérios de Lesniewski-Suppes: (I) Adequação Extensional (Conversibilidade Definiendum <-> Definiens); (II) Proibição de Dialelo / Circulus in Definiendo (DAG estrito); (III) Proibição de Definição Puramente Negativa (exceto privações ontológicas); (IV) Proibição de Metáforas/Ambiguidade; (V) Parcimônia Constitutiva (excluir Propria demonstráveis de DECOMPOSICAO_ANALITICA); (VI) Conservatividade / Não-Criatividade (toda cláusula existencial exige unicidade previa); (VII) Eliminabilidade Formal.',
    '4. Alinhamento Estrito MOC <-> Corpo: Todo conceito usado no Definiens DEVE constar em MOC_PRESUPPOSED. Os irmãos do mesmo gênero listados em TAXONOMIA_FRONTEIRA_COORDENADA DEVEM coincidir com MOC_COORDINATE.'
  ].join('\n'),
  taxonomyRoutingMatrix: [
    'MATRIZ DE ROTEAMENTO DE DOMÍNIO E ESPÉCIE DE DEFINIÇÃO (Opção 3B):',
    '- Domínio A (Filosofia, Ontologia, Metafísica, Epistemologia):',
    '  * [A.1] Essencialista Clássica ( Aristóteles/Porfírio ): Gênero Próximo + Diferença Específica -> Chaves em DECOMPOSICAO_ANALITICA: Gênero Próximo | Diferença Específica | Condição de Identidade.',
    '  * [A.2] Analítica de Condições Necessárias e Suficientes (Frege/Carnap): x é F <-> C1(x) ^ ... ^ Cn(x) -> Chaves: Universo de Discurso | Condições Individualmente Necessárias | Fecho de Suficiência Conjunta.',
    '  * [A.3] Explicação Carnapiana (Carnap): Substituição de Explicandum vago por Explicatum preciso -> Chaves: Explicandum Pré-Teórico | Explicatum Formal | Critérios de Adequação (Similaridade, Exatidão, Fecundidade, Simplicidade).',
    '  * [A.4] Semelhança de Família / Politética (Wittgenstein): Rede disjuntiva ponderada de traços -> Chaves: Conjunto de Traços Prototípicos | Limiar / Regra de Suficiência Politética | Casos Paradigmáticos vs. Casos de Fronteira.',
    '- Domínio B (Matemática, Lógica Formal, Ciência da Computação Teórica):',
    '  * [B.1] Explícita / Nominal (Lesniewski/Suppes): Definiendum := Definiens -> Chaves: Assinatura / Ambiente | Componentes do Definiens | Condição de Boa-Formação (Unicidade).',
    '  * [B.2] Estrutural / Axiomática / Bourbakista (Bourbaki/Suppes): S = (D1, ..., R1, ...) satisfazendo axiomas internos -> Chaves: Portadores (Carriers) | Operações / Relações Primitivas | Axiomas Constitutivos da Estrutura.',
    '  * [B.3] Indutiva / Recursiva / Construtiva (Kleene/Aczel): Caso Base + Passo Indutivo + Cláusula Extremal -> Chaves: Casos Base (Átomos) | Regras / Construtores Indutivos | Cláusula de Fechamento Extremal (Menor Ponto Fixo).',
    '  * [B.4] Categorial / Propriedade Universal (Mac Lane/Lawvere): Objeto inicial/terminal em categoria auxiliar -> Chaves: Categoria Ambiente | Funtor / Diagrama Alvo | Morfismo Universal e Unicidade a menos de Isomorfismo Único.',
    '  * [B.5] Abstrativa por Quociente de Equivalência (Frege/Peano): Partição D/~ -> Chaves: Domínio Base | Relação de Equivalência (~) | Invariante / Representante Canônico da Classe [x]_~.',
    '- Domínio C (Ciências Empíricas, Física, Biologia, Psicometria, Engenharia):',
    '  * [C.1] Operacional / Metrológica (Bridgman): Condição de estímulo/teste S -> resposta mensurável R -> Chaves: Grandeza / Construto Alvo | Protocolo / Operação de Medição (S -> R) | Escala, Unidade e Domínio de Validade Instrumental.',
    '  * [C.2] Mecanística-Funcional / Redutiva (Machamer-Darden-Craver/Cummins): Papel causal-funcional + mecanismo subjacente -> Chaves: Papel Funcional / Fenômeno Alvo (Cummins Role) | Entidades / Partes Componentes | Atividades e Organização Espaço-Temporal.',
    '  * [C.3] Cluster de Propriedades Homeostáticas — HPC / Espécies Naturais (Boyd/Kornblith): Cluster co-ocorrente + mecanismo homeostático causal -> Chaves: Cluster de Propriedades Co-ocorrentes | Mecanismo Homeostático Subjacente | Fronteira Filogenética / Microestrutural.',
    '- Domínio D (Direito, Ética, Linguística, Ciências Sociais):',
    '  * [D.1] Estipulativa / Precisificadora / Normativa (Robinson/Hempel): Fixação deliberada de fronteira decisória -> Chaves: Termo / Escopo Jurisdicional ou Teórico | Critério Decisório de Inclusão (Fato Gerador / Limiar) | Cláusulas de Exclusão Explícita.',
    '- Exceções Fundacionais:',
    '  * [Exceção A/B] Elucidação Primitiva / Transcendental -> Chaves: Estatuto Fundacional | Intuição / Papel Estrutural | Esquema Axiomático ou Operacional em que Ingressa.',
    '  * [Exceção C] Definição Contextual / Ramsey-Lewis -> Chaves: Expressão / Termo Teórico | Contexto Proposicional Completo | Regra de Tradução / Sentença de Ramsey.'
  ].join('\n'),
  slots: [
    {
      slotId: 'STATUS',
      sectionTitle: 'Preâmbulo',
      syntaxKind: 'status_tag',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Tag de maturidade da nota (ex: #teenager, #adult, #child).'
    },
    {
      slotId: 'MOC_DOMAIN_FIELDS',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'inline_wikilinks',
      required: true,
      allowEmpty: false,
      epistemicDirective: '1 a 3 wikilinks na mesma linha apontando para os campos disciplinares (ex: [[Field - Teoria dos Conjuntos]], [[Field - Topologia]]).'
    },
    {
      slotId: 'MOC_PRESUPPOSED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_presupposed_tree',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Árvore Booleana de pré-requisitos constitutivos presentes no Definiens. Mesma linha = conjunção (AND); linhas separadas = disjunção (OR, definições equivalentes). Deixe VAZIO apenas se o conceito for um Termo Primitivo (Exceção A, d^- = 0).',
      formatPattern: '\t\t- [[Def - Conceito A]], [[Def - Conceito B]]'
    },
    {
      slotId: 'MOC_COORDINATE',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Conceitos irmãos que compartilham o mesmo gênero próximo (hiperônimo), diferindo apenas na diferença específica ou restrição de parâmetro. Deve espelhar os conceitos de TAXONOMIA_FRONTEIRA_COORDENADA.',
      formatPattern: '\t\t- [[Def - Conceito Irmão]]'
    },
    {
      slotId: 'MOC_DERIVED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_wikilink_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Conceitos filhos (hipônimos imediatos) e teoremas/propriedades ([[Theo - ...]]) demonstrados diretamente a partir desta definição.',
      formatPattern: '\t\t- [[Def - Hipônimo]]'
    },
    {
      slotId: 'MOC_RELATED',
      sectionTitle: 'Map of Content / Tags',
      syntaxKind: 'moc_related_list',
      required: false,
      allowEmpty: true,
      epistemicDirective: 'Analogias estruturais de outros domínios, dualidades ou contrastes pedagógicos sem dependência dedutiva direta.',
      formatPattern: '\t- [[Def - Conceito Relacionado]]'
    },
    {
      slotId: 'META_DOMINIO',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Domínio Epistêmico conforme a Matriz de Roteamento (ex: Domínio B — Matemática, Lógica Formal e Ciência da Computação).'
    },
    {
      slotId: 'META_TIPO',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Espécie exata de definição selecionada na Matriz de Roteamento (ex: Definição Estrutural / Axiomática [B.2] ou Definição Essencialista [A.1]).'
    },
    {
      slotId: 'META_STATUS',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Estatuto ontológico/formal do termo definido (ex: Conceito Derivado, Estrutura Algébrica, Termo Primitivo / Ur-Element, Construto Operacional).'
    },
    {
      slotId: 'META_DISTINGUO',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Desambiguação concisa separando o conceito atual de homônimos ou usos em outros domínios (ex: Não confundir com [[Def - Homônimo]] em [[Field - Outro Campo]]).'
    },
    {
      slotId: 'CONCEITO_NOME',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Nome canônico limpo do conceito sendo definido (sem o prefixo Def -).'
    },
    {
      slotId: 'DEFINICAO_ENUNCIADO',
      sectionTitle: '1. Definição',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Enunciado constitutivo rigoroso (Definiendum <-> Definiens), autocontido, livre de circularidade e com todos os conceitos pressupostos linkados via [[Def - ...]].'
    },
    {
      slotId: 'DECOMPOSICAO_ANALITICA',
      sectionTitle: '1. Definição',
      syntaxKind: 'callout_multiline_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: '3 bullets estritos usando EXATAMENTE as chaves obrigatórias determinadas pela espécie escolhida em META_TIPO (ex: para [B.2]: - **Portadores (Carriers):** ... / - **Operações / Relações Primitivas:** ... / - **Axiomas Constitutivos da Estrutura:** ...). NUNCA inclua Propria ou teoremas demonstráveis aqui.'
    },
    {
      slotId: 'TAXONOMIA_HIPERONIMO',
      sectionTitle: '2. Taxonomia & Linhagem Ontológica',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Wikilink para o gênero superior imediato ([[Def - ...]]) acompanhado de breve explicação de como este conceito especializa o gênero pai (ou justificativa de raiz se d^- = 0).'
    },
    {
      slotId: 'TAXONOMIA_PARAMETROS_LIVRES',
      sectionTitle: '2. Taxonomia & Linhagem Ontológica',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) explicitando quais condições ou parâmetros permanecem abertos nesta definição e cuja fixação gera as subespécies (hipônimos).',
      formatPattern: '\t- **Parâmetro / Eixo:** Descrição.'
    },
    {
      slotId: 'TAXONOMIA_HIPONIMOS',
      sectionTitle: '2. Taxonomia & Linhagem Ontológica',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) das subespécies imediatas ([[Def - ...]]) obtidas pela adição de axiomas ou restrição dos parâmetros livres.',
      formatPattern: '\t- [[Def - Hipônimo]]: Obtido ao restringir...'
    },
    {
      slotId: 'TAXONOMIA_FRONTEIRA_COORDENADA',
      sectionTitle: '2. Taxonomia & Linhagem Ontológica',
      syntaxKind: 'markdown_bullets',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Lista indentada com 1 tab (\\t- ) contrastando o conceito atual com seus irmãos coordenados (mesmo hiperônimo em MOC_COORDINATE) e explicitando o critério exato de corte (mutuamente exclusivos vs. sobrepostos).',
      formatPattern: '\t- vs. [[Def - Irmão]]: Critério de corte...'
    },
    {
      slotId: 'TAXONOMIA_MERMAID',
      sectionTitle: '2. Taxonomia & Linhagem Ontológica',
      syntaxKind: 'mermaid_graph_td',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Diagrama Mermaid (iniciando com graph TD, SEM cercas ```mermaid) mapeando Hiperônimo -> Conceito Atual e Irmãos -> Hipônimos. Os IDs dos nós clicáveis não devem conter [[ ]], e a última linha deve declarar `class ID1,ID2 internal-link;`.'
    },
    {
      slotId: 'INSTANCIACAO_EXEMPLAR',
      sectionTitle: '3. Instanciações & Casos de Teste',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Caso concreto padrão que instancia positivamente todas as cláusulas de DECOMPOSICAO_ANALITICA (teste de não-vacuidade).'
    },
    {
      slotId: 'INSTANCIACAO_NAO_EXEMPLO',
      sectionTitle: '3. Instanciações & Casos de Teste',
      syntaxKind: 'inline_text',
      required: true,
      allowEmpty: false,
      epistemicDirective: 'Contra-modelo cirúrgico (Quasi-Example) que satisfaz o gênero próximo e quase todas as condições, mas falha em exatamente uma condição necessária (provando sua indispensabilidade).'
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
