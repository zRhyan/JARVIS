// packages/core/src/epistemic-types.ts

import type { TripartiteMMTUri } from './epistemic-uri.js';

/**
 * Particionamento estrito de vértices na ontologia bipartida AIF (Argument Interchange Format).
 */
export enum AIFNodePartition {
  /** Nó de Informação (I-node): Nota conceitual atômica, axioma, proposição ou evidência */
  I_NODE = 0,
  /** Nó de Esquema (S-node): Reificação de regra de derivação (RA), conflito (CA) ou preferência (PA) */
  S_NODE = 1
}

/**
 * Subtipo ontológico de um S-Node no modelo AIF.
 */
export enum AIFSchemeSubType {
  NONE = 0,
  /** Rule Application (RA-node): Definição dedutiva estrita ou inferência derrotável */
  RA_DEFINITION = 1,
  /** Conflict Application (CA-node): Objeção ou ataque dialético formal */
  CA_CONFLICT = 2,
  /** Preference Application (PA-node): Preferência epistêmica entre alternativas */
  PA_PREFERENCE = 3
}

/**
 * Modalidade lógica da regra no framework ASPIC+.
 */
export enum AIFRuleModality {
  NONE = 0,
  /** Regra Estrita (R_s): Dedução monotônica infalível (ex: Def -, Theo -) */
  STRICT_R_S = 1,
  /** Regra Derrotável (R_d): Inferência indutiva, empírica ou dialética (ex: Law -, Hyp -, Tese -, Conj -) */
  DEFEASIBLE_R_D = 2,
  /** Premissa Inviolável (K_n): Axioma/Postulado (Axiom -) */
  INVIOLABLE_PREMISE_K_N = 3,
  /** Premissa Empírica (K_p): Observação/Evidência (Obs -) */
  EMPIRICAL_PREMISE_K_P = 4,
  /** Conflito Dialético (CA): Objeção (Obj -) */
  CONFLICT_ATTACK = 5,
  /** Inquérito / Síntese (IBIS): Questão (Quest -) */
  INQUIRY_SYNTHESIS = 6,
  /** Operacional / Procedural: Nota prática (Prat -) */
  PROCEDURAL = 7
}

/**
 * Tipos de arestas direcionadas permitidas no grafo bipartido AIF.
 */
export enum AIFEdgeType {
  /** Data Edge (I-to-S): Fornece uma nota premissa a um esquema S-node */
  DATA_SUPPLYING_I_TO_S = 0,
  /** Scheme Edge (S-to-I): Conecta o esquema S-node à nota conclusão I-node */
  CONCLUSION_S_TO_I = 1,
  /** Conflict Edge: Conecta um S-node de conflito (CA-node) ao alvo atacado */
  CONFLICT_ATTACK = 2
}

/**
 * Papel epistêmico na camada de sobreposição em memória (Dual-Layer Epistemic Overlay).
 */
export enum EpistemicEdgeRole {
  /** Aresta dedutiva estrita ativa na projeção acíclica (DAG) */
  STRICT_DEDUCTIVE = 0,
  /** Aresta de retorno (Feedback Arc) rebaixada em memória para link associativo */
  ASSOCIATIVE_FEEDBACK = 1,
  /** Aresta de ataque dialético (CA-node -> Alvo), isolada da ordenação topológica dedutiva */
  DIALECTICAL_CONFLICT = 2
}

/**
 * Os 11 tipos canônicos de notas da ontologia do JARVIS (+ 'field' e 'generic').
 */
export type CanonicalNoteType =
  | 'axiom'
  | 'definition'
  | 'theorem'
  | 'conjecture'
  | 'observation'
  | 'law'
  | 'hypothesis'
  | 'thesis'
  | 'objection'
  | 'quaestio'
  | 'practical'
  | 'field'
  | 'generic';

/**
 * Descritor estruturado de um vértice (I-Node ou S-Node) na Rede Epistêmica em memória.
 */
export interface EpistemicNodeDescriptor {
  readonly internalId: number;
  readonly uri: TripartiteMMTUri;
  readonly domainId: number;
  readonly partition: AIFNodePartition;
  readonly schemeSubType: AIFSchemeSubType;
  readonly ruleModality: AIFRuleModality;
  readonly canonicalNoteType: CanonicalNoteType;
  readonly physicalFilePath: string;
  readonly markdownExcerpt: string;
  /** true se for um link fantasma (nota referenciada em Presupposed Concept mas ainda não criada em disco) */
  readonly isPlaceholder: boolean;
}

/**
 * Descritor estruturado de uma aresta bipartida na Rede Epistêmica em memória.
 */
export interface EpistemicEdgeDescriptor {
  readonly edgeId: number;
  readonly sourceId: number;
  readonly targetId: number;
  readonly edgeType: AIFEdgeType;
  readonly weight: number;
  /** Papel epistêmico mutável na camada de sobreposição em memória (quebra de ciclos não-destrutiva) */
  epistemicRole: EpistemicEdgeRole;
}

/**
 * Entrada de nota bruta do cofre para o compilador da Rede Epistêmica.
 */
export interface RawVaultNoteInput {
  readonly relativePath: string;
  readonly content: string;
}

/**
 * Alerta diagnóstico emitido quando um ciclo acidental é detectado e rompido em memória.
 */
export interface EpistemicCycleWarning {
  readonly sccIndex: number;
  /** URIs canônicos dos I-Nodes (conceitos) envolvidos no ciclo */
  readonly involvedConceptUris: ReadonlyArray<string>;
  /** Nomes legíveis dos conceitos envolvidos no ciclo */
  readonly involvedConceptNames: ReadonlyArray<string>;
  /** Arestas de conclusão (S -> I) rebaixadas para ASSOCIATIVE_FEEDBACK para restaurar o DAG */
  readonly downgradedEdges: ReadonlyArray<{
    readonly edgeId: number;
    readonly schemeUri: string;
    readonly targetConceptUri: string;
    readonly targetConceptName: string;
    readonly sourcePremiseNames: ReadonlyArray<string>;
  }>;
  readonly message: string;
}

/**
 * Resultado da projeção acíclica (Sub-etapas 3.3 e 3.4).
 */
export interface DAGProjectionResult {
  readonly feedbackArcSet: ReadonlyArray<EpistemicEdgeDescriptor>;
  readonly linearOrdering: Int32Array;
  readonly topologicalLevels: Int32Array;
  readonly maxTopologicalLevel: number;
  readonly nonTrivialSccCount: number;
  readonly cycleWarnings: ReadonlyArray<EpistemicCycleWarning>;
}

/**
 * Relatório de inspeção modular de fronteira de um Domínio/Teoria MMT (Sub-etapa 3.5).
 */
export interface BoundaryAnchorReport {
  readonly theoryUri: string;
  readonly domainId: number;
  /** I-nodes sem dependências internas nem externas (d^-_intra = 0 e d^-_inter = 0) */
  readonly absoluteLocalPrimitives: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes sem dependências internas, mas fundamentados via morfismo externo (d^-_intra = 0 e d^-_inter > 0) */
  readonly externallyGroundedPrimitives: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes deste domínio que servem de premissa para esquemas em outros domínios */
  readonly exportedBoundaryAnchors: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes deste domínio que dependem diretamente de premissas de outros domínios */
  readonly importedBoundaryAnchors: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes externos de outros domínios que são referenciados como premissas por este domínio */
  readonly externalPremiseNodes: ReadonlyArray<EpistemicNodeDescriptor>;
}

/**
 * Descritor do Morfismo de Inclusão cirúrgico entre duas Teorias MMT (Sub-etapa 3.5).
 */
export interface InclusionMorphismDescriptor {
  readonly sourceTheoryUri: string;
  readonly targetTheoryUri: string;
  readonly sourceDomainId: number;
  readonly targetDomainId: number;
  /** Pontes cirúrgicas que cruzam a fronteira (sourceTheory -> targetTheory) */
  readonly frontierBridges: ReadonlyArray<{
    readonly edgeId: number;
    readonly exportedNode: EpistemicNodeDescriptor;
    readonly mediatingOrTargetNode: EpistemicNodeDescriptor;
    readonly targetConceptNode?: EpistemicNodeDescriptor;
    readonly epistemicRole: EpistemicEdgeRole;
  }>;
}
