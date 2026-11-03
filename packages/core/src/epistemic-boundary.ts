// packages/core/src/epistemic-boundary.ts

import {
  AIFEdgeType,
  AIFNodePartition,
  AIFSchemeSubType,
  EpistemicEdgeRole,
  type BoundaryAnchorReport,
  type EpistemicNodeDescriptor,
  type InclusionMorphismDescriptor
} from './epistemic-types.js';
import { DEFAULT_DOC_URI } from './epistemic-uri.js';
import type { EpistemicAIFEngine } from './epistemic-network.js';

/**
 * Normaliza um identificador de domínio (nome curto como "Teoria dos Grafos" ou URI "jarvis://vault?Teoria dos Grafos")
 * para o formato de `theoryUri` registrado no `EpistemicAIFEngine`.
 */
export function resolveCanonicalTheoryUri(
  theoryUriOrDomain: string,
  docUri: string = DEFAULT_DOC_URI
): string {
  const trimmed = theoryUriOrDomain.trim();
  if (trimmed.includes('?')) {
    // Se já veio como jarvis://vault?Domínio ou jarvis://vault?Domínio?Símbolo, extrai apenas doc?mod
    const firstQ = trimmed.indexOf('?');
    const secondQ = trimmed.indexOf('?', firstQ + 1);
    return secondQ === -1 ? trimmed : trimmed.slice(0, secondQ);
  }
  return `${docUri}?${trimmed}`;
}

/**
 * Inspeciona cirurgicamente a fronteira modular de um Domínio/Teoria MMT em tempo $O(|V_{\text{domínio}}|)$,
 * sem achatar o cofre inteiro em memória (*zero eager flattening*).
 *
 * No grafo bipartido AIF:
 * - Os `RA-Nodes` ($S$) que concluem um conceito $I \in \Sigma_A$ residem em $\Sigma_A$.
 * - Portanto, as premissas intra-domínio vs inter-domínio de um `I-Node` $I \in \Sigma_A$ são
 *   aferidas tanto pelas arestas diretas de $I$ quanto pelos contadores $d^-_{\text{intra}}(S)$ e
 *   $d^-_{\text{inter}}(S)$ dos seus `RA-Nodes` de entrada!
 */
export function inspectDomainBoundary(
  engine: EpistemicAIFEngine,
  theoryUriOrDomain: string,
  docUri: string = DEFAULT_DOC_URI
): BoundaryAnchorReport {
  const theoryUri = resolveCanonicalTheoryUri(theoryUriOrDomain, docUri);
  const domainId = engine.getDomainId(theoryUri);

  if (domainId === undefined) {
    return {
      theoryUri,
      domainId: -1,
      absoluteLocalPrimitives: [],
      externallyGroundedPrimitives: [],
      exportedBoundaryAnchors: [],
      importedBoundaryAnchors: [],
      externalPremiseNodes: []
    };
  }

  const nodes = engine.getAllNodes();
  const edges = engine.getAllEdges();
  const domainNodeIds = engine.getDomainNodeIds(domainId);

  const absoluteLocalPrimitives: EpistemicNodeDescriptor[] = [];
  const externallyGroundedPrimitives: EpistemicNodeDescriptor[] = [];
  const exportedBoundaryAnchors: EpistemicNodeDescriptor[] = [];
  const importedBoundaryAnchors: EpistemicNodeDescriptor[] = [];
  const externalPremiseNodeIds = new Set<number>();

  for (let idx = 0; idx < domainNodeIds.length; idx++) {
    const nodeId = domainNodeIds[idx]!;
    const node = nodes[nodeId]!;

    if (node.partition !== AIFNodePartition.I_NODE) {
      continue;
    }

    // 1. Inspeciona todos os RA-Nodes dedutivos que entram neste I-Node
    const inEdgeIds = engine.getInEdgeIds(nodeId);
    let effectiveIntraIn = 0;
    let effectiveInterIn = 0;

    for (let i = 0; i < inEdgeIds.length; i++) {
      const inEdge = edges[inEdgeIds[i]!]!;
      if (inEdge.epistemicRole === EpistemicEdgeRole.DIALECTICAL_CONFLICT) continue;

      const sNode = nodes[inEdge.sourceId]!;
      if (
        sNode.partition === AIFNodePartition.S_NODE &&
        sNode.schemeSubType === AIFSchemeSubType.RA_DEFINITION
      ) {
        if (sNode.domainId === domainId) {
          // O RA-Node reside no próprio domínio; verifica as premissas (I -> S) que alimentam este RA-Node
          const sDeg = engine.getNodeDegrees(sNode.internalId);
          effectiveIntraIn += sDeg.intraInDeg;
          effectiveInterIn += sDeg.interInDeg;

          if (sDeg.interInDeg > 0) {
            const sInEdgeIds = engine.getInEdgeIds(sNode.internalId);
            for (let k = 0; k < sInEdgeIds.length; k++) {
              const premiseEdge = edges[sInEdgeIds[k]!]!;
              if (premiseEdge.epistemicRole === EpistemicEdgeRole.DIALECTICAL_CONFLICT) continue;
              const premiseNode = nodes[premiseEdge.sourceId]!;
              if (
                premiseNode.partition === AIFNodePartition.I_NODE &&
                premiseNode.domainId !== domainId
              ) {
                externalPremiseNodeIds.add(premiseNode.internalId);
              }
            }
          }
        } else {
          // O próprio RA-Node veio de outro domínio
          effectiveInterIn++;
          const sInEdgeIds = engine.getInEdgeIds(sNode.internalId);
          for (let k = 0; k < sInEdgeIds.length; k++) {
            const premiseEdge = edges[sInEdgeIds[k]!]!;
            if (premiseEdge.epistemicRole === EpistemicEdgeRole.DIALECTICAL_CONFLICT) continue;
            const premiseNode = nodes[premiseEdge.sourceId]!;
            if (
              premiseNode.partition === AIFNodePartition.I_NODE &&
              premiseNode.domainId !== domainId
            ) {
              externalPremiseNodeIds.add(premiseNode.internalId);
            }
          }
        }
      }
    }

    // Classificação de Primitivos Locais vs Ancorados vs Importados
    if (effectiveIntraIn === 0 && effectiveInterIn === 0) {
      absoluteLocalPrimitives.push(node);
    } else if (effectiveIntraIn === 0 && effectiveInterIn > 0) {
      externallyGroundedPrimitives.push(node);
      importedBoundaryAnchors.push(node);
    } else if (effectiveInterIn > 0) {
      importedBoundaryAnchors.push(node);
    }

    // 2. Verifica se este I-Node é exportado como premissa para esquemas/conceitos de OUTROS domínios
    const deg = engine.getNodeDegrees(nodeId);
    let isExported = deg.interOutDeg > 0;

    if (!isExported) {
      // Caso um RA-Node no mesmo domínio aponte para uma conclusão em outro domínio
      const outEdgeIds = engine.getOutEdgeIds(nodeId);
      for (let i = 0; i < outEdgeIds.length; i++) {
        const outEdge = edges[outEdgeIds[i]!]!;
        if (outEdge.epistemicRole === EpistemicEdgeRole.DIALECTICAL_CONFLICT) continue;
        const sNode = nodes[outEdge.targetId]!;
        const sDeg = engine.getNodeDegrees(sNode.internalId);
        if (sDeg.interOutDeg > 0) {
          isExported = true;
          break;
        }
      }
    }

    if (isExported) {
      exportedBoundaryAnchors.push(node);
    }
  }

  const externalPremiseNodes = Array.from(externalPremiseNodeIds).map(id => nodes[id]!);

  return {
    theoryUri,
    domainId,
    absoluteLocalPrimitives,
    externallyGroundedPrimitives,
    exportedBoundaryAnchors,
    importedBoundaryAnchors,
    externalPremiseNodes
  };
}

/**
 * Extrai cirurgicamente o Morfismo de Inclusão ($\iota: \Sigma_{\text{source}} \hookrightarrow \Sigma_{\text{target}}$)
 * em tempo proporcional exclusivamente ao número de arestas que cruzam a fronteira entre as duas teorias,
 * usando o `boundaryCutIndex` de 32 bits `(srcDomainId << 16) | dstDomainId`.
 */
export function extractInclusionMorphism(
  engine: EpistemicAIFEngine,
  sourceTheoryOrDomain: string,
  targetTheoryOrDomain: string,
  docUri: string = DEFAULT_DOC_URI
): InclusionMorphismDescriptor {
  const sourceTheoryUri = resolveCanonicalTheoryUri(sourceTheoryOrDomain, docUri);
  const targetTheoryUri = resolveCanonicalTheoryUri(targetTheoryOrDomain, docUri);

  const sourceDomainId = engine.getDomainId(sourceTheoryUri) ?? -1;
  const targetDomainId = engine.getDomainId(targetTheoryUri) ?? -1;

  if (sourceDomainId === -1 || targetDomainId === -1 || sourceDomainId === targetDomainId) {
    return {
      sourceTheoryUri,
      targetTheoryUri,
      sourceDomainId,
      targetDomainId,
      frontierBridges: []
    };
  }

  const nodes = engine.getAllNodes();
  const edges = engine.getAllEdges();
  const cutEdgeIds = engine.getBoundaryCutEdgeIds(sourceDomainId, targetDomainId);

  const frontierBridges: Array<{
    readonly edgeId: number;
    readonly exportedNode: EpistemicNodeDescriptor;
    readonly mediatingOrTargetNode: EpistemicNodeDescriptor;
    readonly targetConceptNode?: EpistemicNodeDescriptor;
    readonly epistemicRole: EpistemicEdgeRole;
  }> = [];

  for (let i = 0; i < cutEdgeIds.length; i++) {
    const edgeId = cutEdgeIds[i]!;
    const edge = edges[edgeId]!;
    const exportedNode = nodes[edge.sourceId]!;
    const mediatingOrTargetNode = nodes[edge.targetId]!;

    let targetConceptNode: EpistemicNodeDescriptor | undefined;
    if (mediatingOrTargetNode.partition === AIFNodePartition.S_NODE) {
      const sOutEdges = engine.getOutEdgeIds(mediatingOrTargetNode.internalId);
      for (let k = 0; k < sOutEdges.length; k++) {
        const outEdge = edges[sOutEdges[k]!]!;
        if (outEdge.edgeType === AIFEdgeType.CONCLUSION_S_TO_I) {
          targetConceptNode = nodes[outEdge.targetId]!;
          break;
        }
      }
    } else {
      targetConceptNode = mediatingOrTargetNode;
    }

    frontierBridges.push({
      edgeId: edge.edgeId,
      exportedNode,
      mediatingOrTargetNode,
      targetConceptNode,
      epistemicRole: edge.epistemicRole
    });
  }

  return {
    sourceTheoryUri,
    targetTheoryUri,
    sourceDomainId,
    targetDomainId,
    frontierBridges
  };
}

/**
 * Lista todos os Morfismos de Inclusão não-vazios que entram em `targetTheoryOrDomain`
 * a partir de qualquer outra teoria registrada no motor.
 */
export function listIncomingInclusionMorphisms(
  engine: EpistemicAIFEngine,
  targetTheoryOrDomain: string,
  docUri: string = DEFAULT_DOC_URI
): InclusionMorphismDescriptor[] {
  const targetTheoryUri = resolveCanonicalTheoryUri(targetTheoryOrDomain, docUri);
  const targetDomainId = engine.getDomainId(targetTheoryUri);
  if (targetDomainId === undefined) return [];

  const allTheories = engine.getAllTheoryUris();
  const morphisms: InclusionMorphismDescriptor[] = [];

  for (let srcId = 0; srcId < allTheories.length; srcId++) {
    if (srcId === targetDomainId) continue;
    const cutEdges = engine.getBoundaryCutEdgeIds(srcId, targetDomainId);
    if (cutEdges.length > 0) {
      morphisms.push(
        extractInclusionMorphism(engine, allTheories[srcId]!, targetTheoryUri, docUri)
      );
    }
  }

  return morphisms;
}
