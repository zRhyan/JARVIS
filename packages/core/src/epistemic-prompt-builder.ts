// packages/core/src/epistemic-prompt-builder.ts

import { extractCanonicalWikilink } from './epistemic-header-parser.js';
import {
  DEFAULT_DOC_URI,
  MMTUriResolver,
  UNASSIGNED_DOMAIN
} from './epistemic-uri.js';
import {
  AIFEdgeType,
  AIFNodePartition,
  AIFSchemeSubType,
  EpistemicEdgeRole,
  type EpistemicCycleWarning,
  type EpistemicNodeDescriptor
} from './epistemic-types.js';
import type { EpistemicAIFEngine } from './epistemic-network.js';

export interface EpistemicNetworkQueryOptions {
  readonly targetNote?: string;
  readonly domainField?: string;
  readonly depth?: number;
  readonly includeBoundaryAnchors?: boolean;
  readonly docUri?: string;
}

export interface StratifiedConceptEntry {
  readonly uri: string;
  readonly symbolName: string;
  readonly domainField: string;
  readonly canonicalNoteType: string;
  readonly topologicalLevel: number;
  readonly isLocalPrimitive: boolean;
  readonly isExternallyGroundedPrimitive: boolean;
  readonly isPlaceholder: boolean;
  readonly physicalFilePath: string;
  readonly excerpt: string;
  readonly presupposedByScheme: ReadonlyArray<{
    readonly schemeUri: string;
    readonly ruleModality: string;
    readonly premises: ReadonlyArray<string>;
  }>;
}

export interface ExternalBoundaryAnchorEntry {
  readonly uri: string;
  readonly symbolName: string;
  readonly sourceDomain: string;
  readonly requiredByConcepts: ReadonlyArray<string>;
}

export interface DialecticalConflictEntry {
  readonly schemeUri: string;
  readonly objectionUri: string;
  readonly objectionName: string;
  readonly attackedTargetUri: string;
  readonly attackedTargetName: string;
  readonly excerpt: string;
}

export interface EpistemicNetworkQueryResult {
  readonly mode: 'concept' | 'domain';
  readonly targetUri: string;
  readonly requestedTargetNote?: string;
  readonly domainField: string;
  readonly targetExists: boolean;
  readonly maxTopologicalLevel: number;
  readonly stratifiedConcepts: ReadonlyArray<StratifiedConceptEntry>;
  readonly layers: Readonly<Record<number, ReadonlyArray<StratifiedConceptEntry>>>;
  readonly localPrimitives: ReadonlyArray<string>;
  readonly externalBoundaryAnchors: ReadonlyArray<ExternalBoundaryAnchorEntry>;
  readonly dialecticalConflicts: ReadonlyArray<DialecticalConflictEntry>;
  readonly cycleWarnings: ReadonlyArray<EpistemicCycleWarning>;
  readonly llmContextXml: string;
}

function escapeXmlAttr(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlText(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanSymbolCandidate(raw: string): string {
  const fromWikilink = extractCanonicalWikilink(raw).trim();
  const base = fromWikilink.replace(/\\/g, '/').split('/').pop() || fromWikilink;
  return base.replace(/\.md$/i, '').trim();
}

function resolveTargetINode(
  engine: EpistemicAIFEngine,
  rawTarget: string,
  preferredDomain?: string,
  docUri: string = DEFAULT_DOC_URI
): EpistemicNodeDescriptor | undefined {
  const trimmed = rawTarget.trim();
  if (!trimmed) return undefined;

  // 1. Se já for um URI canônico tripartido completo
  if (trimmed.includes('?')) {
    try {
      const byUri = engine.getNodeByUri(trimmed);
      if (byUri && byUri.partition === AIFNodePartition.I_NODE) {
        return byUri;
      }
    } catch {}
  }

  const cleanSym = cleanSymbolCandidate(trimmed);
  const lowerSym = cleanSym.toLowerCase();
  const cleanDomain = preferredDomain ? extractCanonicalWikilink(preferredDomain).trim() : undefined;
  const lowerDomain = cleanDomain?.toLowerCase();

  // 2. Se houver domínio preferencial, tenta lookup exato (doc?domain?sym)
  if (cleanDomain) {
    try {
      const candidateUri = MMTUriResolver.buildNoteUri(cleanSym, cleanDomain, docUri);
      const exactNode = engine.getNodeByUri(candidateUri);
      if (exactNode && exactNode.partition === AIFNodePartition.I_NODE) {
        return exactNode;
      }
    } catch {}
  }

  // 3. Busca case-insensitive entre todos os I-Nodes (priorizando o domínio solicitado e notas reais sobre placeholders)
  const allNodes = engine.getAllNodes();
  let fallbackMatch: EpistemicNodeDescriptor | undefined;

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i]!;
    if (node.partition !== AIFNodePartition.I_NODE) continue;

    const matchesSym =
      node.uri.sym.toLowerCase() === lowerSym ||
      node.physicalFilePath.toLowerCase() === trimmed.replace(/\\/g, '/').toLowerCase() ||
      node.physicalFilePath
        .replace(/\\/g, '/')
        .replace(/\.md$/i, '')
        .toLowerCase() === trimmed.replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase();

    if (!matchesSym) continue;

    if (lowerDomain && node.uri.mod.toLowerCase() === lowerDomain) {
      return node;
    }

    if (!fallbackMatch || (fallbackMatch.isPlaceholder && !node.isPlaceholder)) {
      fallbackMatch = node;
    }
  }

  return fallbackMatch;
}

function resolveDomainIdCaseInsensitive(
  engine: EpistemicAIFEngine,
  domainField: string,
  docUri: string = DEFAULT_DOC_URI
): { domainId: number | undefined; canonicalDomainName: string; theoryUri: string } {
  const cleanDomain = extractCanonicalWikilink(domainField)
    .trim()
    .replace(/\.md$/i, '');

  const exactTheoryUri = cleanDomain.includes('?')
    ? cleanDomain
    : `${docUri}?${cleanDomain}`;

  const exactId = engine.getDomainId(exactTheoryUri);
  if (exactId !== undefined) {
    const modName = exactTheoryUri.split('?')[1] || cleanDomain;
    return {
      domainId: exactId,
      canonicalDomainName: modName,
      theoryUri: exactTheoryUri
    };
  }

  const lowerTarget = cleanDomain.toLowerCase();
  const allTheories = engine.getAllTheoryUris();
  for (let id = 0; id < allTheories.length; id++) {
    const tUri = allTheories[id]!;
    const modPart = tUri.split('?')[1] ?? tUri;
    if (
      modPart.toLowerCase() === lowerTarget ||
      modPart.toLowerCase() === `field - ${lowerTarget}` ||
      lowerTarget === `field - ${modPart.toLowerCase()}`
    ) {
      return {
        domainId: id,
        canonicalDomainName: modPart,
        theoryUri: tUri
      };
    }
  }

  return {
    domainId: undefined,
    canonicalDomainName: cleanDomain,
    theoryUri: exactTheoryUri
  };
}

/**
 * Executa a consulta unificada da Rede Epistêmica em **Modo Conceito** ou **Modo Campo**:
 * - **Modo Conceito**: `targetNote` existe no grafo $\to$ extrai o cone dedutivo reverso estratificado de `targetNote`,
 *   isolando premissas de outros domínios como `<ancoras_de_fronteira_externa>` (*Lazy Flattening*).
 * - **Modo Campo**: `domainField` informado (com `targetNote` omitido OU ainda não criado em disco, como no `/create`)
 *   $\to$ não falha e extrai toda a árvore estratificada do `domainField`.
 */
export function queryEpistemicNetwork(
  engine: EpistemicAIFEngine,
  options: EpistemicNetworkQueryOptions
): EpistemicNetworkQueryResult {
  const docUri = options.docUri ?? DEFAULT_DOC_URI;
  const includeBoundaryAnchors = options.includeBoundaryAnchors ?? true;
  const maxDepth =
    typeof options.depth === 'number' && options.depth > 0
      ? Math.floor(options.depth)
      : Number.POSITIVE_INFINITY;

  const rawTargetNote = options.targetNote?.trim();
  const rawDomainField = options.domainField?.trim();

  if (!rawTargetNote && !rawDomainField) {
    throw new Error(
      'Pelo menos um dos parâmetros "targetNote" ou "domainField" deve ser informado em get_epistemic_network.'
    );
  }

  // Passo 1: Executar a projeção acíclica completa (Eades Bipartido + B-Visit Tropical)
  const projection = engine.buildAcyclicProjection();
  const nodes = engine.getAllNodes();
  const edges = engine.getAllEdges();
  const levels = projection.topologicalLevels;

  // Passo 2: Tentar resolver o nó alvo se `targetNote` foi fornecido
  const resolvedTargetNode = rawTargetNote
    ? resolveTargetINode(engine, rawTargetNote, rawDomainField, docUri)
    : undefined;

  const targetExists = Boolean(resolvedTargetNode && !resolvedTargetNode.isPlaceholder);

  // Determina o modo de operação:
  // - Se `resolvedTargetNode` existe (mesmo que placeholder referenciado, a menos que tenhamos domainField e queiramos ver o campo para criar a nota)
  // Regra da RFC-002 (Sub-etapa 3.6):
  // Se `targetNote` existe fisicamente no grafo (ou foi consultado sem `domainField` e existe como nó), opera em Modo Conceito.
  // Se `targetNote` foi omitido OU ainda não existe no cofre e `domainField` foi informado, opera em Modo Campo!
  const useConceptMode =
    resolvedTargetNode !== undefined && (!resolvedTargetNode.isPlaceholder || !rawDomainField);

  let effectiveDomainName: string;
  let effectiveDomainId: number | undefined;
  let effectiveTheoryUri: string;

  if (useConceptMode && resolvedTargetNode) {
    effectiveDomainName = resolvedTargetNode.uri.mod;
    effectiveDomainId = resolvedTargetNode.domainId;
    effectiveTheoryUri = resolvedTargetNode.uri.theoryUri;
  } else {
    const domainCandidate =
      rawDomainField ||
      (resolvedTargetNode ? resolvedTargetNode.uri.mod : UNASSIGNED_DOMAIN);
    const resolvedDom = resolveDomainIdCaseInsensitive(engine, domainCandidate, docUri);
    effectiveDomainId = resolvedDom.domainId;
    effectiveDomainName = resolvedDom.canonicalDomainName;
    effectiveTheoryUri = resolvedDom.theoryUri;
  }

  const boundaryReport = engine.inspectDomainBoundary(effectiveTheoryUri, docUri);
  const localPrimitiveIds = new Set<number>(
    boundaryReport.absoluteLocalPrimitives.map(n => n.internalId)
  );
  const externallyGroundedIds = new Set<number>(
    boundaryReport.externallyGroundedPrimitives.map(n => n.internalId)
  );

  const selectedINodeIds = new Set<number>();
  const externalAnchorsMap = new Map<
    number,
    { node: EpistemicNodeDescriptor; requiredBy: Set<string> }
  >();

  if (useConceptMode && resolvedTargetNode) {
    // MODO CONCEITO: Busca reversa (BFS ascendente) sobre arestas STRICT_DEDUCTIVE dentro do domínio ativo,
    // isolando premissas de outros domínios como Âncoras de Fronteira Externa (Lazy Flattening).
    const visited = new Set<number>([resolvedTargetNode.internalId]);
    const queue: Array<{ nodeId: number; hop: number }> = [
      { nodeId: resolvedTargetNode.internalId, hop: 0 }
    ];
    selectedINodeIds.add(resolvedTargetNode.internalId);

    while (queue.length > 0) {
      const { nodeId, hop } = queue.shift()!;
      if (hop >= maxDepth) continue;

      const currentINode = nodes[nodeId]!;
      const inEdges = engine.getInEdgeIds(nodeId);

      for (let i = 0; i < inEdges.length; i++) {
        const conclusionEdge = edges[inEdges[i]!]!;
        if (conclusionEdge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

        const sNode = nodes[conclusionEdge.sourceId]!;
        if (
          sNode.partition !== AIFNodePartition.S_NODE ||
          sNode.schemeSubType !== AIFSchemeSubType.RA_DEFINITION
        ) {
          continue;
        }

        const premiseInEdges = engine.getInEdgeIds(sNode.internalId);
        for (let k = 0; k < premiseInEdges.length; k++) {
          const premiseEdge = edges[premiseInEdges[k]!]!;
          if (premiseEdge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

          const premiseINode = nodes[premiseEdge.sourceId]!;
          if (premiseINode.partition !== AIFNodePartition.I_NODE) continue;

          if (premiseINode.domainId !== effectiveDomainId) {
            // Lazy Flattening: premissa de outro domínio torna-se Âncora de Fronteira Externa!
            if (includeBoundaryAnchors) {
              let entry = externalAnchorsMap.get(premiseINode.internalId);
              if (!entry) {
                entry = { node: premiseINode, requiredBy: new Set<string>() };
                externalAnchorsMap.set(premiseINode.internalId, entry);
              }
              entry.requiredBy.add(currentINode.uri.sym);
            }
          } else if (!visited.has(premiseINode.internalId)) {
            visited.add(premiseINode.internalId);
            selectedINodeIds.add(premiseINode.internalId);
            queue.push({ nodeId: premiseINode.internalId, hop: hop + 1 });
          }
        }
      }
    }
  } else if (effectiveDomainId !== undefined) {
    // MODO CAMPO: Coleta todos os I-Nodes do domínio (exceto a própria nota Field - se houver outros conceitos, ou inclui tudo do domínio)
    const domainNodeIds = engine.getDomainNodeIds(effectiveDomainId);
    for (let i = 0; i < domainNodeIds.length; i++) {
      const id = domainNodeIds[i]!;
      const node = nodes[id]!;
      if (node.partition === AIFNodePartition.I_NODE && node.canonicalNoteType !== 'field') {
        selectedINodeIds.add(id);
      }
    }

    // Se o domínio só tiver a nota 'field', inclui-a para não retornar vazio
    if (selectedINodeIds.size === 0) {
      for (let i = 0; i < domainNodeIds.length; i++) {
        const id = domainNodeIds[i]!;
        const node = nodes[id]!;
        if (node.partition === AIFNodePartition.I_NODE) {
          selectedINodeIds.add(id);
        }
      }
    }

    if (includeBoundaryAnchors) {
      const incomingMorphisms = engine.listIncomingInclusionMorphisms(effectiveTheoryUri, docUri);
      for (const morph of incomingMorphisms) {
        for (const bridge of morph.frontierBridges) {
          if (bridge.exportedNode.partition === AIFNodePartition.I_NODE) {
            let entry = externalAnchorsMap.get(bridge.exportedNode.internalId);
            if (!entry) {
              entry = { node: bridge.exportedNode, requiredBy: new Set<string>() };
              externalAnchorsMap.set(bridge.exportedNode.internalId, entry);
            }
            if (bridge.targetConceptNode) {
              entry.requiredBy.add(bridge.targetConceptNode.uri.sym);
            }
          }
        }
      }
    }
  }

  // Passo 3: Montar descritores estratificados ordenados por nível topológico crescente (0, 1, 2...)
  const stratifiedConcepts: StratifiedConceptEntry[] = [];
  const layersRecord: Record<number, StratifiedConceptEntry[]> = {};
  let maxSelectedLevel = 0;

  const sortedNodeIds = Array.from(selectedINodeIds).sort((a, b) => {
    const lvlDiff = levels[a]! - levels[b]!;
    if (lvlDiff !== 0) return lvlDiff;
    return nodes[a]!.uri.sym.localeCompare(nodes[b]!.uri.sym);
  });

  for (const nodeId of sortedNodeIds) {
    const node = nodes[nodeId]!;
    const lvl = levels[nodeId]!;
    if (lvl > maxSelectedLevel) {
      maxSelectedLevel = lvl;
    }

    // Extrai os esquemas RA que alimentam este I-Node
    const presupposedByScheme: Array<{
      readonly schemeUri: string;
      readonly ruleModality: string;
      readonly premises: ReadonlyArray<string>;
    }> = [];

    const inEdges = engine.getInEdgeIds(nodeId);
    for (let i = 0; i < inEdges.length; i++) {
      const edge = edges[inEdges[i]!]!;
      if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;
      const sNode = nodes[edge.sourceId]!;
      if (
        sNode.partition === AIFNodePartition.S_NODE &&
        sNode.schemeSubType === AIFSchemeSubType.RA_DEFINITION
      ) {
        const sIn = engine.getInEdgeIds(sNode.internalId);
        const premises = sIn.map(eId => nodes[edges[eId]!.sourceId]!.uri.sym);
        presupposedByScheme.push({
          schemeUri: sNode.uri.canonical,
          ruleModality: sNode.ruleModality === 1 ? 'STRICT_R_S' : 'DEFEASIBLE_R_D',
          premises
        });
      }
    }

    const entry: StratifiedConceptEntry = {
      uri: node.uri.canonical,
      symbolName: node.uri.sym,
      domainField: node.uri.mod,
      canonicalNoteType: node.canonicalNoteType,
      topologicalLevel: lvl,
      isLocalPrimitive: localPrimitiveIds.has(nodeId) || lvl === 0,
      isExternallyGroundedPrimitive: externallyGroundedIds.has(nodeId),
      isPlaceholder: node.isPlaceholder,
      physicalFilePath: node.physicalFilePath,
      excerpt: node.markdownExcerpt,
      presupposedByScheme
    };

    stratifiedConcepts.push(entry);
    if (!layersRecord[lvl]) {
      layersRecord[lvl] = [];
    }
    layersRecord[lvl]!.push(entry);
  }

  // Passo 4: Coletar conflitos dialéticos (CA-Nodes) relevantes para os conceitos selecionados
  const dialecticalConflicts: DialecticalConflictEntry[] = [];
  for (let e = 0; e < edges.length; e++) {
    const edge = edges[e]!;
    if (edge.edgeType !== AIFEdgeType.CONFLICT_ATTACK) continue;

    const caNode = nodes[edge.sourceId]!;
    const attackedNode = nodes[edge.targetId]!;
    const caInEdges = engine.getInEdgeIds(caNode.internalId);
    const objectionNode =
      caInEdges.length > 0 ? nodes[edges[caInEdges[0]!]!.sourceId]! : caNode;

    if (
      selectedINodeIds.has(attackedNode.internalId) ||
      selectedINodeIds.has(objectionNode.internalId)
    ) {
      dialecticalConflicts.push({
        schemeUri: caNode.uri.canonical,
        objectionUri: objectionNode.uri.canonical,
        objectionName: objectionNode.uri.sym,
        attackedTargetUri: attackedNode.uri.canonical,
        attackedTargetName: attackedNode.uri.sym,
        excerpt: objectionNode.markdownExcerpt || caNode.markdownExcerpt
      });
    }
  }

  // Passo 5: Filtrar cycleWarnings relevantes para os conceitos selecionados ou domínio ativo
  const relevantWarnings = projection.cycleWarnings.filter(w =>
    w.involvedConceptUris.some(uri => {
      const n = engine.getNodeByUri(uri);
      return (
        n !== undefined &&
        (selectedINodeIds.has(n.internalId) || n.domainId === effectiveDomainId)
      );
    })
  );

  const externalBoundaryAnchors: ExternalBoundaryAnchorEntry[] = Array.from(
    externalAnchorsMap.values()
  ).map(item => ({
    uri: item.node.uri.canonical,
    symbolName: item.node.uri.sym,
    sourceDomain: item.node.uri.mod,
    requiredByConcepts: Array.from(item.requiredBy)
  }));

  const mode: 'concept' | 'domain' = useConceptMode ? 'concept' : 'domain';
  const targetUri =
    useConceptMode && resolvedTargetNode
      ? resolvedTargetNode.uri.canonical
      : rawTargetNote
        ? MMTUriResolver.buildNoteUri(
            cleanSymbolCandidate(rawTargetNote),
            effectiveDomainName,
            docUri
          ).canonical
        : effectiveTheoryUri;

  const llmContextXml = formatEpistemicContextXml({
    mode,
    targetUri,
    domainField: effectiveDomainName,
    targetExists,
    stratifiedConcepts,
    externalBoundaryAnchors,
    dialecticalConflicts,
    cycleWarnings: relevantWarnings
  });

  return {
    mode,
    targetUri,
    requestedTargetNote: rawTargetNote,
    domainField: effectiveDomainName,
    targetExists,
    maxTopologicalLevel: maxSelectedLevel,
    stratifiedConcepts,
    layers: layersRecord,
    localPrimitives: stratifiedConcepts
      .filter(c => c.isLocalPrimitive)
      .map(c => c.uri),
    externalBoundaryAnchors,
    dialecticalConflicts,
    cycleWarnings: relevantWarnings,
    llmContextXml
  };
}

/**
 * Formata o resultado estratificado em XML de alta densidade informacional
 * conforme a Seção 8 da RFC-002.
 */
export function formatEpistemicContextXml(params: {
  readonly mode: 'concept' | 'domain';
  readonly targetUri: string;
  readonly domainField: string;
  readonly targetExists: boolean;
  readonly stratifiedConcepts: ReadonlyArray<StratifiedConceptEntry>;
  readonly externalBoundaryAnchors: ReadonlyArray<ExternalBoundaryAnchorEntry>;
  readonly dialecticalConflicts: ReadonlyArray<DialecticalConflictEntry>;
  readonly cycleWarnings: ReadonlyArray<EpistemicCycleWarning>;
}): string {
  const lines: string[] = [];
  lines.push(
    `<contexto_epistemico_modular target="${escapeXmlAttr(params.targetUri)}" domain="${escapeXmlAttr(params.domainField)}" mode="${params.mode}" target_exists="${params.targetExists}">`
  );

  lines.push('  <hierarquia_fundacional_dag>');
  for (const concept of params.stratifiedConcepts) {
    const primAttr = concept.isLocalPrimitive ? ' primitivo_local="true"' : '';
    const extGroundAttr = concept.isExternallyGroundedPrimitive
      ? ' ancorado_externamente="true"'
      : '';
    const placeholderAttr = concept.isPlaceholder ? ' placeholder="true"' : '';
    const excerptText = concept.excerpt
      ? escapeXmlText(concept.excerpt)
      : `Conceito ${escapeXmlText(concept.symbolName)}`;

    lines.push(
      `    <conceito nivel_topologico="${concept.topologicalLevel}" uri="${escapeXmlAttr(concept.uri)}" tipo="${escapeXmlAttr(concept.canonicalNoteType)}"${primAttr}${extGroundAttr}${placeholderAttr}>`
    );
    lines.push(`      ${excerptText}`);
    lines.push('    </conceito>');
  }
  lines.push('  </hierarquia_fundacional_dag>');

  if (params.externalBoundaryAnchors.length > 0) {
    lines.push('');
    lines.push('  <ancoras_de_fronteira_externa>');
    for (const anchor of params.externalBoundaryAnchors) {
      const reqBy =
        anchor.requiredByConcepts.length > 0
          ? ` requerido_por="${escapeXmlAttr(anchor.requiredByConcepts.join(', '))}"`
          : '';
      lines.push(
        `    <ancora uri="${escapeXmlAttr(anchor.uri)}" dominio_origem="${escapeXmlAttr(anchor.sourceDomain)}"${reqBy} />`
      );
    }
    lines.push('  </ancoras_de_fronteira_externa>');
  }

  if (params.dialecticalConflicts.length > 0) {
    lines.push('');
    lines.push('  <conflitos_dialeticos_ca>');
    for (const conflict of params.dialecticalConflicts) {
      lines.push(
        `    <ataque objecao="${escapeXmlAttr(conflict.objectionName)}" alvo="${escapeXmlAttr(conflict.attackedTargetName)}" uri_esquema="${escapeXmlAttr(conflict.schemeUri)}" />`
      );
    }
    lines.push('  </conflitos_dialeticos_ca>');
  }

  if (params.cycleWarnings.length > 0) {
    lines.push('');
    lines.push('  <referencias_associativas_ciclo_quebrado>');
    for (const warning of params.cycleWarnings) {
      for (const dEdge of warning.downgradedEdges) {
        const origem = dEdge.sourcePremiseNames.join(', ') || dEdge.schemeUri;
        lines.push(
          `    <associacao origem="${escapeXmlAttr(origem)}" destino="${escapeXmlAttr(dEdge.targetConceptName)}" motivo="Dependência circular rebaixada em memória (S->I) para preservar a aciclicidade da dedução" />`
        );
      }
    }
    lines.push('  </referencias_associativas_ciclo_quebrado>');
  }

  lines.push('</contexto_epistemico_modular>');
  return lines.join('\n');
}

/**
 * Helper direto para construir o bloco XML em Modo Conceito.
 */
export function buildLLMContextForNote(
  engine: EpistemicAIFEngine,
  targetNote: string,
  options: Omit<EpistemicNetworkQueryOptions, 'targetNote'> = {}
): string {
  return queryEpistemicNetwork(engine, {
    ...options,
    targetNote
  }).llmContextXml;
}

/**
 * Helper direto para construir o bloco XML em Modo Campo (ideal para `/create`).
 */
export function buildLLMContextForDomain(
  engine: EpistemicAIFEngine,
  domainField: string,
  options: Omit<EpistemicNetworkQueryOptions, 'domainField'> = {}
): string {
  return queryEpistemicNetwork(engine, {
    ...options,
    domainField
  }).llmContextXml;
}
