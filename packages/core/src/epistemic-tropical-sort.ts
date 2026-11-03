// packages/core/src/epistemic-tropical-sort.ts

import {
  AIFNodePartition,
  AIFSchemeSubType,
  EpistemicEdgeRole,
  type DAGProjectionResult
} from './epistemic-types.js';
import type { EpistemicAIFEngine } from './epistemic-network.js';
import {
  breakCyclesEadesBipartite,
  type CycleBreakResult
} from './epistemic-cycle-breaker.js';

export interface TropicalBVisitResult {
  readonly linearOrdering: Int32Array;
  readonly topologicalLevels: Int32Array;
  readonly maxTopologicalLevel: number;
  /** URIs canônicos de todos os I-Nodes primitivos (nível topológico 0) */
  readonly primitives: ReadonlyArray<string>;
  /** Agrupamento de URIs canônicos de I-Nodes por nível topológico (0, 1, 2...) */
  readonly layers: ReadonlyMap<number, ReadonlyArray<string>>;
}

const TROPICAL_INFINITY = 0x7fffffff;

/**
 * Executa o algoritmo B-Visit Assimétrico com Álgebra Tropical em TypedArrays sobre a projeção
 * acíclica do grafo bipartido AIF ($G_{\text{DAG}} = (V, E \setminus F)$) em tempo $O(|V| + |E|)$.
 *
 * Regras do Semi-Anel Tropical Bipartido Assimétrico:
 * - Primitivos ($I\text{-Nodes}$ com $d^-_{\text{DAG}}(i) = 0$): $\mathcal{L}(i) = 0$
 * - Conjunção em $S\text{-Nodes}$ ($I \to S$): $\mathcal{L}(s) = \max_{p \in N^-(s)}(\mathcal{L}(p)) + 1$,
 *   disparando apenas quando `dagInDeg[s] === 0` (propriedade B-visit).
 * - Disjunção em $I\text{-Nodes}$ derivados ($S \to I$): $\mathcal{L}(c) = \min_{s \in N^-(c)}(\mathcal{L}(s)) + 0$,
 *   sem incremento duplo por salto e assumindo a via mais elementar.
 */
export function computeTropicalBVisitLevels(engine: EpistemicAIFEngine): TropicalBVisitResult {
  const n = engine.getNodeCount();
  if (n === 0) {
    return {
      linearOrdering: new Int32Array(0),
      topologicalLevels: new Int32Array(0),
      maxTopologicalLevel: 0,
      primitives: [],
      layers: new Map()
    };
  }

  const nodes = engine.getAllNodes();
  const edges = engine.getAllEdges();
  const m = edges.length;

  const dagInDeg = new Int32Array(n);
  const levels = new Int32Array(n);
  const kahnQueue = new Int32Array(n);

  // Passo 1: Contabilizar graus de entrada exclusivamente para arestas STRICT_DEDUCTIVE ativas no DAG
  for (let e = 0; e < m; e++) {
    const edge = edges[e]!;
    if (edge.epistemicRole === EpistemicEdgeRole.STRICT_DEDUCTIVE) {
      dagInDeg[edge.targetId]!++;
    }
  }

  // Passo 2: Inicializar níveis tropicais e enfileirar raízes no buffer contíguo kahnQueue
  let qHead = 0;
  let qTail = 0;

  for (let u = 0; u < n; u++) {
    const node = nodes[u]!;
    if (node.partition === AIFNodePartition.I_NODE) {
      if (dagInDeg[u] === 0) {
        levels[u] = 0;
        kahnQueue[qTail++] = u;
      } else {
        // Elemento neutro da adição tropical (min)
        levels[u] = TROPICAL_INFINITY;
      }
    } else {
      // S-Node: acumulador para o máximo das premissas + 1
      levels[u] = 0;
      if (
        dagInDeg[u] === 0 &&
        node.schemeSubType === AIFSchemeSubType.RA_DEFINITION
      ) {
        levels[u] = 1;
        kahnQueue[qTail++] = u;
      }
    }
  }

  // Passo 3: Propagação B-Visit Assimétrica no loop principal (Zero Object Allocation)
  let maxTopologicalLevel = 0;

  while (qHead < qTail) {
    const u = kahnQueue[qHead++]!;
    const nodeU = nodes[u]!;
    const levelU = levels[u]!;

    if (nodeU.partition === AIFNodePartition.I_NODE && levelU < TROPICAL_INFINITY) {
      if (levelU > maxTopologicalLevel) {
        maxTopologicalLevel = levelU;
      }
    }

    const outE = engine.getOutEdgeIds(u);
    const outLen = outE.length;

    if (nodeU.partition === AIFNodePartition.I_NODE) {
      // Transição I -> S (Conjunção / Multiplicação Tropical: max(premissas) + 1)
      const candidateLevel = levelU + 1;
      for (let i = 0; i < outLen; i++) {
        const edge = edges[outE[i]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

        const s = edge.targetId;
        if (candidateLevel > levels[s]!) {
          levels[s] = candidateLevel;
        }
        dagInDeg[s]!--;
        if (dagInDeg[s] === 0) {
          // Propriedade B-visit: S-node só dispara quando TODAS as premissas conjuntas foram satisfeitas
          kahnQueue[qTail++] = s;
        }
      }
    } else {
      // Transição S -> I (Disjunção / Adição Tropical: min(esquemas) + 0)
      for (let i = 0; i < outLen; i++) {
        const edge = edges[outE[i]!]!;
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

        const c = edge.targetId;
        if (levelU < levels[c]!) {
          levels[c] = levelU;
        }
        dagInDeg[c]!--;
        if (dagInDeg[c] === 0) {
          kahnQueue[qTail++] = c;
        }
      }
    }
  }

  // Passo 4: Normalizar eventuais nós não visitados (ex: CA-Nodes isolados do DAG dedutivo) e montar camadas de I-Nodes
  const primitives: string[] = [];
  const layers = new Map<number, string[]>();

  for (let u = 0; u < n; u++) {
    const node = nodes[u]!;
    if (levels[u] === TROPICAL_INFINITY) {
      levels[u] = 0;
    }
    if (node.partition === AIFNodePartition.I_NODE) {
      const lvl = levels[u]!;
      if (lvl === 0) {
        primitives.push(node.uri.canonical);
      }
      let layerList = layers.get(lvl);
      if (!layerList) {
        layerList = [];
        layers.set(lvl, layerList);
      }
      layerList.push(node.uri.canonical);
    }
  }

  const linearOrdering = kahnQueue.length === qTail ? kahnQueue : kahnQueue.slice(0, qTail);

  return {
    linearOrdering,
    topologicalLevels: levels,
    maxTopologicalLevel,
    primitives,
    layers
  };
}

/**
 * Executa o pipeline completo de projeção acíclica sobre o motor em memória:
 * 1. Quebra não-destrutiva de ciclos com Tarjan SCC + Eades Bipartido ($S \to I$ invariant).
 * 2. Estratificação topológica B-Visit com Álgebra Tropical Assimétrica em `TypedArrays`.
 */
export function buildAcyclicEpistemicProjection(
  engine: EpistemicAIFEngine,
  existingCycleResult?: CycleBreakResult
): DAGProjectionResult {
  const cycleResult = existingCycleResult ?? breakCyclesEadesBipartite(engine);
  const tropicalResult = computeTropicalBVisitLevels(engine);

  return {
    feedbackArcSet: cycleResult.feedbackArcSet,
    linearOrdering: tropicalResult.linearOrdering,
    topologicalLevels: tropicalResult.topologicalLevels,
    maxTopologicalLevel: tropicalResult.maxTopologicalLevel,
    nonTrivialSccCount: cycleResult.nonTrivialSccCount,
    cycleWarnings: cycleResult.cycleWarnings
  };
}
