// packages/core/src/epistemic-cycle-breaker.ts

import {
  AIFEdgeType,
  AIFNodePartition,
  EpistemicEdgeRole,
  type EpistemicCycleWarning,
  type EpistemicEdgeDescriptor
} from './epistemic-types.js';
import type { EpistemicAIFEngine } from './epistemic-network.js';

export interface CycleBreakResult {
  readonly feedbackArcSet: ReadonlyArray<EpistemicEdgeDescriptor>;
  readonly nonTrivialSccCount: number;
  readonly cycleWarnings: ReadonlyArray<EpistemicCycleWarning>;
}

/**
 * Isola todos os Componentes Fortemente Conexos (SCCs) não-triviais (|C| >= 2)
 * do subgrafo dedutivo (`STRICT_DEDUCTIVE`) em tempo linear O(|V| + |E|) usando o algoritmo de Tarjan.
 */
export function computeNonTrivialSCCs(engine: EpistemicAIFEngine): number[][] {
  const n = engine.getNodeCount();
  if (n === 0) return [];

  const edges = engine.getAllEdges();
  const dfn = new Int32Array(n).fill(-1);
  const low = new Int32Array(n).fill(-1);
  const onStack = new Uint8Array(n);
  const tarjanStack: number[] = [];
  const nonTrivialSCCs: number[][] = [];
  let timer = 0;

  const dfs = (u: number): void => {
    dfn[u] = low[u] = timer++;
    tarjanStack.push(u);
    onStack[u] = 1;

    const outE = engine.getOutEdgeIds(u);
    for (let i = 0; i < outE.length; i++) {
      const edge = edges[outE[i]!]!;
      if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

      const v = edge.targetId;
      if (dfn[v] === -1) {
        dfs(v);
        if (low[v]! < low[u]!) {
          low[u] = low[v]!;
        }
      } else if (onStack[v] === 1) {
        if (dfn[v]! < low[u]!) {
          low[u] = dfn[v]!;
        }
      }
    }

    if (low[u] === dfn[u]) {
      const scc: number[] = [];
      while (true) {
        const w = tarjanStack.pop()!;
        onStack[w] = 0;
        scc.push(w);
        if (w === u) break;
      }
      // Em um grafo bipartido AIF sem auto-laços, qualquer ciclo real possui |C| >= 2
      if (scc.length >= 2) {
        nonTrivialSCCs.push(scc);
      }
    }
  };

  for (let u = 0; u < n; u++) {
    if (dfn[u] === -1) {
      dfs(u);
    }
  }

  return nonTrivialSCCs;
}

/**
 * Executa a quebra não-destrutiva de ciclos em memória em tempo O(|V| + |E|) usando:
 * 1. Decomposição Tarjan SCC (|C| >= 2).
 * 2. Heurística de Eades (GreedyFAS) com buckets duplamente ligados e prioridade bipartida (V_I > V_S).
 * 3. Transferência Invariante B-Hipergrafo (I -> S => S -> I), garantindo matematicamente que
 *    100% das arestas rebaixadas para `ASSOCIATIVE_FEEDBACK` sejam arestas de conclusão (S -> I),
 *    nunca mutilando premissas conjuntas.
 */
export function breakCyclesEadesBipartite(engine: EpistemicAIFEngine): CycleBreakResult {
  const n = engine.getNodeCount();
  const nodes = engine.getAllNodes();
  const edges = engine.getAllEdges();
  const m = edges.length;

  // Passo 0: Restaurar todas as arestas dedutivas (não-conflito) para STRICT_DEDUCTIVE antes do cálculo
  for (let e = 0; e < m; e++) {
    const edge = edges[e]!;
    if (edge.epistemicRole !== EpistemicEdgeRole.DIALECTICAL_CONFLICT) {
      edge.epistemicRole = EpistemicEdgeRole.STRICT_DEDUCTIVE;
    }
  }

  if (n === 0 || m === 0) {
    return {
      feedbackArcSet: [],
      nonTrivialSccCount: 0,
      cycleWarnings: []
    };
  }

  // Passo 1: Decompor em SCCs não-triviais
  const sccs = computeNonTrivialSCCs(engine);
  if (sccs.length === 0) {
    return {
      feedbackArcSet: [],
      nonTrivialSccCount: 0,
      cycleWarnings: []
    };
  }

  const feedbackArcSet: EpistemicEdgeDescriptor[] = [];
  const downgradedEdgeIdsSet = new Set<number>();
  const cycleWarnings: EpistemicCycleWarning[] = [];

  // Buffers reutilizáveis no nível do grafo para complexidade espacial O(|V|)
  const localOrderPos = new Int32Array(n).fill(-1);
  const activeMask = new Uint8Array(n);
  const localInDeg = new Int32Array(n);
  const localOutDeg = new Int32Array(n);
  const prevInBucket = new Int32Array(n).fill(-1);
  const nextInBucket = new Int32Array(n).fill(-1);

  // Passo 2: Executar Eades Bipartido sobre cada SCC não-trivial
  for (let c = 0; c < sccs.length; c++) {
    const component = sccs[c]!;
    const compSize = component.length;

    let maxDeg = 0;
    for (let i = 0; i < compSize; i++) {
      activeMask[component[i]!] = 1;
    }

    // Calcular graus induzidos exclusivamente dentro do SCC atual
    for (let i = 0; i < compSize; i++) {
      const u = component[i]!;
      let dOut = 0;
      const outE = engine.getOutEdgeIds(u);
      for (let j = 0; j < outE.length; j++) {
        const edge = edges[outE[j]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;
        if (activeMask[edge.targetId] === 1) dOut++;
      }

      let dIn = 0;
      const inE = engine.getInEdgeIds(u);
      for (let j = 0; j < inE.length; j++) {
        const edge = edges[inE[j]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;
        if (activeMask[edge.sourceId] === 1) dIn++;
      }

      localOutDeg[u] = dOut;
      localInDeg[u] = dIn;
      if (dOut > maxDeg) maxDeg = dOut;
      if (dIn > maxDeg) maxDeg = dIn;
    }

    // Buckets duplamente ligados indexados por delta(u) = d+(u) - d-(u) em [-maxDeg, +maxDeg]
    const offset = maxDeg;
    const numBuckets = 2 * maxDeg + 1;
    const bucketHead = new Int32Array(numBuckets).fill(-1);
    const bucketTail = new Int32Array(numBuckets).fill(-1);

    const sinkStack: number[] = [];
    const sourceQueue: number[] = [];

    const insertIntoBucket = (u: number, delta: number): void => {
      const bIdx = delta + offset;
      prevInBucket[u] = -1;
      nextInBucket[u] = -1;

      if (bucketHead[bIdx] === -1) {
        bucketHead[bIdx] = u;
        bucketTail[bIdx] = u;
      } else if (nodes[u]!.partition === AIFNodePartition.I_NODE) {
        // Prioridade Bipartida (V_I > V_S): I-nodes entram na CABEÇA do bucket
        const oldHead = bucketHead[bIdx]!;
        nextInBucket[u] = oldHead;
        prevInBucket[oldHead] = u;
        bucketHead[bIdx] = u;
      } else {
        // S-nodes entram na CAUDA do bucket
        const oldTail = bucketTail[bIdx]!;
        prevInBucket[u] = oldTail;
        nextInBucket[oldTail] = u;
        bucketTail[bIdx] = u;
      }
    };

    const removeFromBucket = (u: number, delta: number): void => {
      const bIdx = delta + offset;
      const prev = prevInBucket[u]!;
      const next = nextInBucket[u]!;

      if (prev !== -1) {
        nextInBucket[prev] = next;
      } else {
        bucketHead[bIdx] = next;
      }

      if (next !== -1) {
        prevInBucket[next] = prev;
      } else {
        bucketTail[bIdx] = prev;
      }

      prevInBucket[u] = -1;
      nextInBucket[u] = -1;
    };

    let maxBucketIdx = 0;

    for (let i = 0; i < compSize; i++) {
      const u = component[i]!;
      if (localOutDeg[u] === 0) {
        activeMask[u] = 2;
        sinkStack.push(u);
      } else if (localInDeg[u] === 0) {
        activeMask[u] = 2;
        sourceQueue.push(u);
      } else {
        const delta = localOutDeg[u]! - localInDeg[u]!;
        insertIntoBucket(u, delta);
        if (delta + offset > maxBucketIdx) {
          maxBucketIdx = delta + offset;
        }
      }
    }

    const s1: number[] = [];
    const s2Reversed: number[] = [];

    const removeNodeAndUpdateNeighbors = (u: number): void => {
      activeMask[u] = 0;

      // Atualiza predecessores ativos (reduz d+(v))
      const inE = engine.getInEdgeIds(u);
      for (let j = 0; j < inE.length; j++) {
        const edge = edges[inE[j]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;
        const v = edge.sourceId;
        if (activeMask[v] === 1) {
          const oldDelta = localOutDeg[v]! - localInDeg[v]!;
          removeFromBucket(v, oldDelta);
          localOutDeg[v]!--;

          if (localOutDeg[v] === 0) {
            activeMask[v] = 2;
            sinkStack.push(v);
          } else {
            const newDelta = localOutDeg[v]! - localInDeg[v]!;
            insertIntoBucket(v, newDelta);
            if (newDelta + offset > maxBucketIdx) {
              maxBucketIdx = newDelta + offset;
            }
          }
        }
      }

      // Atualiza sucessores ativos (reduz d-(w))
      const outE = engine.getOutEdgeIds(u);
      for (let j = 0; j < outE.length; j++) {
        const edge = edges[outE[j]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;
        const w = edge.targetId;
        if (activeMask[w] === 1) {
          const oldDelta = localOutDeg[w]! - localInDeg[w]!;
          removeFromBucket(w, oldDelta);
          localInDeg[w]!--;

          if (localInDeg[w] === 0) {
            activeMask[w] = 2;
            sourceQueue.push(w);
          } else {
            const newDelta = localOutDeg[w]! - localInDeg[w]!;
            insertIntoBucket(w, newDelta);
            if (newDelta + offset > maxBucketIdx) {
              maxBucketIdx = newDelta + offset;
            }
          }
        }
      }
    };

    let remaining = compSize;
    let sourceHead = 0;

    while (remaining > 0) {
      // 2.1 Poda de sorvedouros (sinks -> prefixados em s2)
      while (sinkStack.length > 0) {
        const u = sinkStack.pop()!;
        if (activeMask[u] === 0) continue;
        s2Reversed.push(u);
        removeNodeAndUpdateNeighbors(u);
        remaining--;
      }

      // 2.2 Poda de fontes (sources -> anexadas em s1)
      while (sourceHead < sourceQueue.length) {
        const u = sourceQueue[sourceHead++]!;
        if (activeMask[u] === 0) continue;
        s1.push(u);
        removeNodeAndUpdateNeighbors(u);
        remaining--;
        if (sinkStack.length > 0) break;
      }

      if (sinkStack.length > 0 || sourceHead < sourceQueue.length) {
        continue;
      }

      // 2.3 Escolha gulosa: vértice u* com máximo delta(u), priorizando I-Nodes (cabeça do bucket)
      if (remaining > 0) {
        while (maxBucketIdx >= 0 && bucketHead[maxBucketIdx] === -1) {
          maxBucketIdx--;
        }
        if (maxBucketIdx >= 0) {
          const uStar = bucketHead[maxBucketIdx]!;
          const deltaStar = maxBucketIdx - offset;
          removeFromBucket(uStar, deltaStar);
          s1.push(uStar);
          removeNodeAndUpdateNeighbors(uStar);
          remaining--;
        }
      }
    }

    // Concatena s = s1 || s2 e registra a posição linear de cada vértice do SCC
    let rank = 0;
    for (let i = 0; i < s1.length; i++) {
      localOrderPos[s1[i]!] = rank++;
    }
    for (let i = s2Reversed.length - 1; i >= 0; i--) {
      localOrderPos[s2Reversed[i]!] = rank++;
    }

    const sccDowngradedEdges: EpistemicEdgeDescriptor[] = [];

    const markConclusionEdgeAsFeedback = (edge: EpistemicEdgeDescriptor): void => {
      if (!downgradedEdgeIdsSet.has(edge.edgeId)) {
        edge.epistemicRole = EpistemicEdgeRole.ASSOCIATIVE_FEEDBACK;
        downgradedEdgeIdsSet.add(edge.edgeId);
        feedbackArcSet.push(edge);
        sccDowngradedEdges.push(edge);
      }
    };

    // Passo 3: Identificar arestas de retorno (pos(u) > pos(v)) aplicando a
    // Transferência Invariante B-Hipergrafo (I -> S => S -> I)
    for (let i = 0; i < compSize; i++) {
      const u = component[i]!;
      const posU = localOrderPos[u]!;
      const outE = engine.getOutEdgeIds(u);

      for (let j = 0; j < outE.length; j++) {
        const edge = edges[outE[j]!]!;
        if (edge.epistemicRole === EpistemicEdgeRole.DIALECTICAL_CONFLICT) continue;

        const v = edge.targetId;
        if (localOrderPos[v] !== -1 && posU > localOrderPos[v]!) {
          if (edge.edgeType === AIFEdgeType.CONCLUSION_S_TO_I) {
            markConclusionEdgeAsFeedback(edge);
          } else if (edge.edgeType === AIFEdgeType.DATA_SUPPLYING_I_TO_S) {
            // Transferência Invariante: preserva a premissa (I -> S) intacta e
            // rebaixa a única aresta de saída (S -> I_c) do esquema S!
            const sNodeOutEdges = engine.getOutEdgeIds(v);
            for (let k = 0; k < sNodeOutEdges.length; k++) {
              const outConclusionEdge = edges[sNodeOutEdges[k]!]!;
              if (outConclusionEdge.edgeType === AIFEdgeType.CONCLUSION_S_TO_I) {
                markConclusionEdgeAsFeedback(outConclusionEdge);
              }
            }
          }
        }
      }
    }

    // Limpa localOrderPos do SCC atual em O(compSize)
    for (let i = 0; i < compSize; i++) {
      localOrderPos[component[i]!] = -1;
    }

    // Passo 4: Construir diagnóstico estruturado cycleWarning para o SCC atual
    const sccINodes = component
      .map(id => nodes[id]!)
      .filter(node => node.partition === AIFNodePartition.I_NODE);

    const involvedConceptUris = sccINodes.map(n => n.uri.canonical);
    const involvedConceptNames = sccINodes.map(n => n.uri.sym);

    const downgradedDetails = sccDowngradedEdges.map(edge => {
      const sNode = nodes[edge.sourceId]!;
      const targetNode = nodes[edge.targetId]!;
      const premiseInEdges = engine.getInEdgeIds(sNode.internalId);
      const sourcePremiseNames = premiseInEdges.map(
        inEdgeId => nodes[edges[inEdgeId]!.sourceId]!.uri.sym
      );

      return {
        edgeId: edge.edgeId,
        schemeUri: sNode.uri.canonical,
        targetConceptUri: targetNode.uri.canonical,
        targetConceptName: targetNode.uri.sym,
        sourcePremiseNames
      };
    });

    cycleWarnings.push({
      sccIndex: c,
      involvedConceptUris,
      involvedConceptNames,
      downgradedEdges: downgradedDetails,
      message: `Ciclo epistêmico detectado entre [${involvedConceptNames.join(
        ' <-> '
      )}]. Derivação para [${downgradedDetails
        .map(d => d.targetConceptName)
        .join(', ')}] rebaixada em memória para associação (S->I) preservando a aciclicidade.`
    });
  }

  return {
    feedbackArcSet,
    nonTrivialSccCount: sccs.length,
    cycleWarnings
  };
}
