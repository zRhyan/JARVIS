// packages/core/src/epistemic-network.ts

import {
  extractCanonicalWikilink,
  parseEpistemicHeader,
  type EpistemicHeader
} from './epistemic-header-parser.js';
import {
  DEFAULT_DOC_URI,
  MMTUriResolver,
  UNASSIGNED_DOMAIN,
  type TripartiteMMTUri,
  type VaultNoteSymbolInfo
} from './epistemic-uri.js';
import {
  AIFEdgeType,
  AIFNodePartition,
  AIFRuleModality,
  AIFSchemeSubType,
  EpistemicEdgeRole,
  type CanonicalNoteType,
  type EpistemicEdgeDescriptor,
  type EpistemicNodeDescriptor,
  type RawVaultNoteInput
} from './epistemic-types.js';
import {
  breakCyclesEadesBipartite,
  type CycleBreakResult
} from './epistemic-cycle-breaker.js';
import {
  buildAcyclicEpistemicProjection,
  computeTropicalBVisitLevels,
  type TropicalBVisitResult
} from './epistemic-tropical-sort.js';
import {
  extractInclusionMorphism,
  inspectDomainBoundary,
  listIncomingInclusionMorphisms
} from './epistemic-boundary.js';
import {
  queryEpistemicNetwork,
  type EpistemicNetworkQueryOptions,
  type EpistemicNetworkQueryResult
} from './epistemic-prompt-builder.js';
import type {
  BoundaryAnchorReport,
  DAGProjectionResult,
  InclusionMorphismDescriptor
} from './epistemic-types.js';

/**
 * Classifica deterministicamente o tipo canônico e a modalidade lógica (ASPIC+)
 * de uma nota a partir do seu título/símbolo ou tags.
 */
export function inferCanonicalNoteType(
  titleOrSym: string,
  tags: ReadonlyArray<string> = []
): { canonicalNoteType: CanonicalNoteType; ruleModality: AIFRuleModality } {
  const clean = extractCanonicalWikilink(titleOrSym).trim();
  const lower = clean.toLowerCase();

  if (lower.startsWith('axiom -') || lower.startsWith('axioma -')) {
    return {
      canonicalNoteType: 'axiom',
      ruleModality: AIFRuleModality.INVIOLABLE_PREMISE_K_N
    };
  }
  if (lower.startsWith('def -') || lower.startsWith('definição -') || lower.startsWith('definicao -')) {
    return {
      canonicalNoteType: 'definition',
      ruleModality: AIFRuleModality.STRICT_R_S
    };
  }
  if (lower.startsWith('theo -') || lower.startsWith('teorema -') || lower.startsWith('prop -')) {
    return {
      canonicalNoteType: 'theorem',
      ruleModality: AIFRuleModality.STRICT_R_S
    };
  }
  if (lower.startsWith('conj -') || lower.startsWith('conjectura -')) {
    return {
      canonicalNoteType: 'conjecture',
      ruleModality: AIFRuleModality.DEFEASIBLE_R_D
    };
  }
  if (lower.startsWith('obs -') || lower.startsWith('observação -') || lower.startsWith('observacao -')) {
    return {
      canonicalNoteType: 'observation',
      ruleModality: AIFRuleModality.EMPIRICAL_PREMISE_K_P
    };
  }
  if (lower.startsWith('law -') || lower.startsWith('lei -')) {
    return {
      canonicalNoteType: 'law',
      ruleModality: AIFRuleModality.DEFEASIBLE_R_D
    };
  }
  if (lower.startsWith('hyp -') || lower.startsWith('hipótese -') || lower.startsWith('hipotese -')) {
    return {
      canonicalNoteType: 'hypothesis',
      ruleModality: AIFRuleModality.DEFEASIBLE_R_D
    };
  }
  if (lower.startsWith('tese -') || lower.startsWith('thesis -')) {
    return {
      canonicalNoteType: 'thesis',
      ruleModality: AIFRuleModality.DEFEASIBLE_R_D
    };
  }
  if (lower.startsWith('obj -') || lower.startsWith('objeção -') || lower.startsWith('objecao -')) {
    return {
      canonicalNoteType: 'objection',
      ruleModality: AIFRuleModality.CONFLICT_ATTACK
    };
  }
  if (lower.startsWith('quest -') || lower.startsWith('questão -') || lower.startsWith('quaestio -')) {
    return {
      canonicalNoteType: 'quaestio',
      ruleModality: AIFRuleModality.INQUIRY_SYNTHESIS
    };
  }
  if (
    lower.startsWith('prac -') ||
    lower.startsWith('prat -') ||
    lower.startsWith('prático -') ||
    lower.startsWith('pratico -')
  ) {
    return {
      canonicalNoteType: 'practical',
      ruleModality: AIFRuleModality.PROCEDURAL
    };
  }
  if (
    lower.startsWith('field -') ||
    lower.startsWith('campo -') ||
    tags.some(t => t.toLowerCase() === 'area' || t.toLowerCase() === 'field')
  ) {
    return {
      canonicalNoteType: 'field',
      ruleModality: AIFRuleModality.NONE
    };
  }

  return {
    canonicalNoteType: 'generic',
    ruleModality: AIFRuleModality.STRICT_R_S
  };
}

/**
 * Extrai de forma limpa o resumo/enunciado do corpo da nota Markdown,
 * descartando o preâmbulo (#tags, <!--SR:...-->, Status:) e o bloco
 * "## Map of Content / Tags:" para evitar poluição no contexto XML da LLM.
 */
export function extractCleanBodyExcerpt(
  markdownContent: string,
  maxLength: number = 300
): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  let body = markdownContent;

  // 1. Se houver divisor duplo "--- \n ---" após o Map of Content, corta tudo até depois dele
  const doubleDividerRegex = /##\s+Map of Content\s*\/\s*Tags:?[\s\S]*?\n---\s*\n---\s*/i;
  const doubleMatch = doubleDividerRegex.exec(body);
  if (doubleMatch) {
    body = body.slice(doubleMatch.index + doubleMatch[0].length);
  } else {
    // 2. Caso o bloco MOC termine no próximo cabeçalho "## " ou "# " ou divisor simples "---"
    const mocHeaderRegex =
      /##\s+Map of Content\s*\/\s*Tags:?([\s\S]*?)(?=\n---\s*\n|\n##\s+|\n#\s+|$)/i;
    const mocMatch = mocHeaderRegex.exec(body);
    if (mocMatch) {
      body = body.slice(mocMatch.index + mocMatch[0].length);
    }
  }

  // 3. Remove comentários HTML (ex: <!--SR:...-->, <!-- SLOT:... -->)
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Filtra linhas de metadados residuais, divisores e cabeçalhos Markdown
  const cleanLines: string[] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    // Ignora divisores horizontais
    if (/^---+$/.test(line)) continue;
    // Ignora linhas compostas apenas por tags (#review #difficulty)
    if (/^(#[A-Za-z0-9_\/\-]+\s*)+$/.test(line)) continue;
    // Ignora linha de Status:
    if (/^Status:\s*#?[A-Za-z0-9_\-]+$/i.test(line)) continue;
    // Ignora carimbo de data/hora isolado (YYYY-MM-DD HH:mm)
    if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?$/.test(line)) continue;
    // Ignora títulos de seção Markdown (# Título, ## Definição Formal)
    if (/^#{1,6}\s+/.test(line)) continue;

    cleanLines.push(line);
  }

  const joined = cleanLines.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length <= maxLength) {
    return joined;
  }
  return joined.slice(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Motor em memória do Grafo Bipartido AIF e Grafos de Teorias MMT (@jarvis/core).
 * Opera 100% em RAM com estruturas indexadas por inteiros densos (0..N-1) e sem
 * dependências nativas de banco de dados.
 */
export class EpistemicAIFEngine {
  private nodes: EpistemicNodeDescriptor[] = [];
  private edges: EpistemicEdgeDescriptor[] = [];
  private uriToNodeId = new Map<string, number>();
  private edgeKeyToEdgeId = new Map<string, number>();

  // Internamento de Domínios (Theory Modules) em inteiros de 16 bits para operações O(1)
  private theoryUriToDomainId = new Map<string, number>();
  private domainIdToTheoryUri: string[] = [];
  private domainNodes: number[][] = [];

  // Listas de adjacência em memória (armazenam edgeIds)
  private outEdgeIds: number[][] = [];
  private inEdgeIds: number[][] = [];

  // Contadores de Grau Dedutivo Particionados O(1) (Zero-Overhead Boundary Detection)
  private intraInDeg: number[] = [];
  private interInDeg: number[] = [];
  private intraOutDeg: number[] = [];
  private interOutDeg: number[] = [];

  // Índice Cirúrgico de Corte de Fronteira: chave `(srcDomain << 16) | dstDomain` -> edgeIds[]
  private boundaryCutIndex = new Map<number, number[]>();

  /**
   * Limpa integralmente o grafo em memória.
   */
  public clear(): void {
    this.nodes = [];
    this.edges = [];
    this.uriToNodeId.clear();
    this.edgeKeyToEdgeId.clear();
    this.theoryUriToDomainId.clear();
    this.domainIdToTheoryUri = [];
    this.domainNodes = [];
    this.outEdgeIds = [];
    this.inEdgeIds = [];
    this.intraInDeg = [];
    this.interInDeg = [];
    this.intraOutDeg = [];
    this.interOutDeg = [];
    this.boundaryCutIndex.clear();
  }

  /**
   * Registra ou recupera o identificador inteiro denso de 16 bits de um Domínio (Teoria MMT).
   */
  public getOrRegisterDomainId(theoryUri: string): number {
    let domainId = this.theoryUriToDomainId.get(theoryUri);
    if (domainId === undefined) {
      domainId = this.domainIdToTheoryUri.length;
      if (domainId > 0xffff) {
        throw new Error('Limite de 65.535 domínios excedido para chave de 32 bits.');
      }
      this.theoryUriToDomainId.set(theoryUri, domainId);
      this.domainIdToTheoryUri.push(theoryUri);
      this.domainNodes.push([]);
    }
    return domainId;
  }

  /**
   * Adiciona um vértice (I-node ou S-node) à Rede Epistêmica em memória.
   * Caso o URI já exista como placeholder e a nova chamada traga a nota real,
   * promove o nó existente atualizando seu caminho físico e resumo.
   */
  public addNode(params: {
    rawUri: string | TripartiteMMTUri;
    partition: AIFNodePartition;
    schemeSubType?: AIFSchemeSubType;
    ruleModality?: AIFRuleModality;
    canonicalNoteType?: CanonicalNoteType;
    physicalFilePath: string;
    markdownExcerpt: string;
    isPlaceholder?: boolean;
  }): EpistemicNodeDescriptor {
    const parsedUri =
      typeof params.rawUri === 'string'
        ? MMTUriResolver.parseCanonical(params.rawUri)
        : params.rawUri;

    const existingId = this.uriToNodeId.get(parsedUri.canonical);
    if (existingId !== undefined) {
      const existing = this.nodes[existingId]!;
      if (existing.isPlaceholder && params.isPlaceholder === false) {
        const inferred = inferCanonicalNoteType(parsedUri.sym);
        const upgraded: EpistemicNodeDescriptor = {
          ...existing,
          physicalFilePath: params.physicalFilePath,
          markdownExcerpt: params.markdownExcerpt,
          isPlaceholder: false,
          canonicalNoteType: params.canonicalNoteType ?? inferred.canonicalNoteType,
          ruleModality: params.ruleModality ?? inferred.ruleModality
        };
        this.nodes[existingId] = upgraded;
        return upgraded;
      }
      return existing;
    }

    const internalId = this.nodes.length;
    const domainId = this.getOrRegisterDomainId(parsedUri.theoryUri);
    const inferred = inferCanonicalNoteType(parsedUri.sym);

    const schemeSubType =
      params.schemeSubType ??
      (params.partition === AIFNodePartition.S_NODE
        ? AIFSchemeSubType.RA_DEFINITION
        : AIFSchemeSubType.NONE);

    const ruleModality =
      params.ruleModality ??
      (params.partition === AIFNodePartition.S_NODE &&
      schemeSubType === AIFSchemeSubType.CA_CONFLICT
        ? AIFRuleModality.CONFLICT_ATTACK
        : inferred.ruleModality);

    const descriptor: EpistemicNodeDescriptor = {
      internalId,
      uri: parsedUri,
      domainId,
      partition: params.partition,
      schemeSubType,
      ruleModality,
      canonicalNoteType: params.canonicalNoteType ?? inferred.canonicalNoteType,
      physicalFilePath: params.physicalFilePath,
      markdownExcerpt: params.markdownExcerpt,
      isPlaceholder: params.isPlaceholder ?? false
    };

    this.nodes.push(descriptor);
    this.uriToNodeId.set(parsedUri.canonical, internalId);
    this.domainNodes[domainId]!.push(internalId);

    this.outEdgeIds.push([]);
    this.inEdgeIds.push([]);
    this.intraInDeg.push(0);
    this.interInDeg.push(0);
    this.intraOutDeg.push(0);
    this.interOutDeg.push(0);

    return descriptor;
  }

  /**
   * Adiciona uma aresta direcionada impondo a invariante bipartida estrita do AIF:
   * Conexões diretas I-to-I ou S-to-S são categoricamente proibidas.
   */
  public addBipartiteEdge(
    sourceUriOrId: string | number | TripartiteMMTUri,
    targetUriOrId: string | number | TripartiteMMTUri,
    weight: number = 1.0
  ): EpistemicEdgeDescriptor {
    const u = this.resolveNodeInternalId(sourceUriOrId);
    const v = this.resolveNodeInternalId(targetUriOrId);

    if (u === undefined || v === undefined) {
      throw new Error(
        '[Erro de Integridade AIF] Vértice origem ou destino inexistente na Rede Epistêmica.'
      );
    }

    const nodeU = this.nodes[u]!;
    const nodeV = this.nodes[v]!;

    // 1. Proibição categórica de arestas diretas I -> I
    if (
      nodeU.partition === AIFNodePartition.I_NODE &&
      nodeV.partition === AIFNodePartition.I_NODE
    ) {
      throw new Error(
        `Violação Ontológica AIF: toda conexão entre conceitos deve ser mediada por um S-node ("${nodeU.uri.canonical}" -> "${nodeV.uri.canonical}").`
      );
    }

    // 2. Proibição de arestas S -> S na projeção bipartida estrita
    if (
      nodeU.partition === AIFNodePartition.S_NODE &&
      nodeV.partition === AIFNodePartition.S_NODE
    ) {
      throw new Error(
        `Violação Bipartida AIF: aresta direta S-to-S proibida na projeção bipartida estrita ("${nodeU.uri.canonical}" -> "${nodeV.uri.canonical}").`
      );
    }

    // 3. Deduplicação idempotente de arestas
    const edgeKey = `${u}:${v}`;
    const existingEdgeId = this.edgeKeyToEdgeId.get(edgeKey);
    if (existingEdgeId !== undefined) {
      return this.edges[existingEdgeId]!;
    }

    // 4. Determina tipo e papel epistêmico da aresta
    const isConflictScheme =
      (nodeU.partition === AIFNodePartition.S_NODE &&
        nodeU.schemeSubType === AIFSchemeSubType.CA_CONFLICT) ||
      (nodeV.partition === AIFNodePartition.S_NODE &&
        nodeV.schemeSubType === AIFSchemeSubType.CA_CONFLICT);

    let edgeType: AIFEdgeType;
    if (nodeU.partition === AIFNodePartition.I_NODE) {
      edgeType = AIFEdgeType.DATA_SUPPLYING_I_TO_S;
    } else if (nodeU.schemeSubType === AIFSchemeSubType.CA_CONFLICT) {
      edgeType = AIFEdgeType.CONFLICT_ATTACK;
    } else {
      edgeType = AIFEdgeType.CONCLUSION_S_TO_I;
    }

    const epistemicRole = isConflictScheme
      ? EpistemicEdgeRole.DIALECTICAL_CONFLICT
      : EpistemicEdgeRole.STRICT_DEDUCTIVE;

    const edgeId = this.edges.length;
    const edge: EpistemicEdgeDescriptor = {
      edgeId,
      sourceId: u,
      targetId: v,
      edgeType,
      weight,
      epistemicRole
    };

    this.edges.push(edge);
    this.edgeKeyToEdgeId.set(edgeKey, edgeId);
    this.outEdgeIds[u]!.push(edgeId);
    this.inEdgeIds[v]!.push(edgeId);

    // 5. Atualiza contadores O(1) Intra-Domínio vs Inter-Domínio apenas para arestas dedutivas (RA)
    if (!isConflictScheme) {
      if (nodeU.domainId === nodeV.domainId) {
        this.intraOutDeg[u]!++;
        this.intraInDeg[v]!++;
      } else {
        this.interOutDeg[u]!++;
        this.interInDeg[v]!++;
        const morphismKey = (nodeU.domainId << 16) | nodeV.domainId;
        let cutList = this.boundaryCutIndex.get(morphismKey);
        if (!cutList) {
          cutList = [];
          this.boundaryCutIndex.set(morphismKey, cutList);
        }
        cutList.push(edgeId);
      }
    }

    return edge;
  }

  public getNodeCount(): number {
    return this.nodes.length;
  }

  public getEdgeCount(): number {
    return this.edges.length;
  }

  public getNodeById(internalId: number): EpistemicNodeDescriptor | undefined {
    return this.nodes[internalId];
  }

  public getNodeByUri(uri: string | TripartiteMMTUri): EpistemicNodeDescriptor | undefined {
    const canonical =
      typeof uri === 'string' ? MMTUriResolver.parseCanonical(uri).canonical : uri.canonical;
    const id = this.uriToNodeId.get(canonical);
    return id !== undefined ? this.nodes[id] : undefined;
  }

  public getAllNodes(): ReadonlyArray<EpistemicNodeDescriptor> {
    return this.nodes;
  }

  public getAllEdges(): ReadonlyArray<EpistemicEdgeDescriptor> {
    return this.edges;
  }

  public getOutEdgeIds(nodeId: number): ReadonlyArray<number> {
    return this.outEdgeIds[nodeId] ?? [];
  }

  public getInEdgeIds(nodeId: number): ReadonlyArray<number> {
    return this.inEdgeIds[nodeId] ?? [];
  }

  public getNodeDegrees(nodeId: number): {
    intraInDeg: number;
    interInDeg: number;
    intraOutDeg: number;
    interOutDeg: number;
  } {
    return {
      intraInDeg: this.intraInDeg[nodeId] ?? 0,
      interInDeg: this.interInDeg[nodeId] ?? 0,
      intraOutDeg: this.intraOutDeg[nodeId] ?? 0,
      interOutDeg: this.interOutDeg[nodeId] ?? 0
    };
  }

  public getDomainId(theoryUri: string): number | undefined {
    return this.theoryUriToDomainId.get(theoryUri);
  }

  public getDomainTheoryUri(domainId: number): string | undefined {
    return this.domainIdToTheoryUri[domainId];
  }

  public getAllTheoryUris(): ReadonlyArray<string> {
    return this.domainIdToTheoryUri;
  }

  public getDomainNodeIds(domainId: number): ReadonlyArray<number> {
    return this.domainNodes[domainId] ?? [];
  }

  public getBoundaryCutEdgeIds(srcDomainId: number, dstDomainId: number): ReadonlyArray<number> {
    const morphismKey = (srcDomainId << 16) | dstDomainId;
    return this.boundaryCutIndex.get(morphismKey) ?? [];
  }

  /**
   * Executa a quebra não-destrutiva de ciclos em memória (Tarjan SCC + Eades Bipartido com invariante S -> I).
   */
  public breakCycles(): CycleBreakResult {
    return breakCyclesEadesBipartite(this);
  }

  /**
   * Calcula os níveis topológicos usando B-Visit com Álgebra Tropical Assimétrica em TypedArrays.
   */
  public computeTropicalLevels(): TropicalBVisitResult {
    return computeTropicalBVisitLevels(this);
  }

  /**
   * Executa o pipeline completo de projeção acíclica (Quebra de Ciclos + B-Visit Tropical).
   */
  public buildAcyclicProjection(existingCycleResult?: CycleBreakResult): DAGProjectionResult {
    return buildAcyclicEpistemicProjection(this, existingCycleResult);
  }

  /**
   * Inspeciona a fronteira modular de um Domínio/Teoria MMT em tempo O(|V_domínio|).
   */
  public inspectDomainBoundary(
    theoryUriOrDomain: string,
    docUri: string = DEFAULT_DOC_URI
  ): BoundaryAnchorReport {
    return inspectDomainBoundary(this, theoryUriOrDomain, docUri);
  }

  /**
   * Extrai cirurgicamente o Morfismo de Inclusão entre duas Teorias MMT em tempo proporcional à fronteira.
   */
  public extractInclusionMorphism(
    sourceTheoryOrDomain: string,
    targetTheoryOrDomain: string,
    docUri: string = DEFAULT_DOC_URI
  ): InclusionMorphismDescriptor {
    return extractInclusionMorphism(this, sourceTheoryOrDomain, targetTheoryOrDomain, docUri);
  }

  /**
   * Lista todos os Morfismos de Inclusão que entram em um Domínio/Teoria MMT.
   */
  public listIncomingInclusionMorphisms(
    targetTheoryOrDomain: string,
    docUri: string = DEFAULT_DOC_URI
  ): InclusionMorphismDescriptor[] {
    return listIncomingInclusionMorphisms(this, targetTheoryOrDomain, docUri);
  }

  /**
   * Consulta a Rede Epistêmica em Modo Conceito ou Modo Campo e gera o contexto XML para a LLM.
   */
  public queryEpistemicNetwork(
    options: EpistemicNetworkQueryOptions
  ): EpistemicNetworkQueryResult {
    return queryEpistemicNetwork(this, options);
  }

  private resolveNodeInternalId(
    uriOrId: string | number | TripartiteMMTUri
  ): number | undefined {
    if (typeof uriOrId === 'number') {
      return uriOrId >= 0 && uriOrId < this.nodes.length ? uriOrId : undefined;
    }
    const canonical =
      typeof uriOrId === 'string'
        ? MMTUriResolver.parseCanonical(uriOrId).canonical
        : uriOrId.canonical;
    return this.uriToNodeId.get(canonical);
  }
}

/**
 * Compila um conjunto de notas Markdown do cofre em uma instância populada de `EpistemicAIFEngine`.
 * Respeita:
 * - Multihoming (1 nota em N Domain Fields gera 1 I-Node por domínio).
 * - Prioridade estrita de `Presupposed Concept(s)` sobre `Derived Concept(s)` (evitando curto-circuito de conjunções).
 * - Isolamento de `CA-Nodes` (`Obj - `) para que ataques dialéticos não poluam `dagInDeg` nem criem ciclos falsos.
 * - Links fantasmas marcados com `isPlaceholder: true`.
 */
export function compileVaultToEpistemicEngine(
  notes: ReadonlyArray<RawVaultNoteInput>,
  docUri: string = DEFAULT_DOC_URI
): EpistemicAIFEngine {
  const engine = new EpistemicAIFEngine();

  interface ParsedVaultNote {
    relativePath: string;
    symbolName: string;
    header: EpistemicHeader;
    effectiveDomains: string[];
    excerpt: string;
    canonicalNoteType: CanonicalNoteType;
    ruleModality: AIFRuleModality;
  }

  const parsedNotes: ParsedVaultNote[] = [];
  const symbolLookup = new Map<string, VaultNoteSymbolInfo>();
  const noteByLowerSym = new Map<string, ParsedVaultNote>();

  // Passagem 1: Parsear headers, extrair resumos limpos e montar tabela de símbolos do cofre
  for (const rawNote of notes) {
    const normalizedPath = rawNote.relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
    const fileName = normalizedPath.split('/').pop() || normalizedPath;
    const symbolName = fileName.replace(/\.md$/i, '').trim();
    if (!symbolName || symbolName.toLowerCase() === 'vault') continue;

    const header = parseEpistemicHeader(rawNote.content);
    const { canonicalNoteType, ruleModality } = inferCanonicalNoteType(
      symbolName,
      header.tags
    );
    const excerpt = extractCleanBodyExcerpt(rawNote.content);

    let effectiveDomains = header.domainFields
      .map(d => extractCanonicalWikilink(d))
      .filter(Boolean);

    if (effectiveDomains.length === 0) {
      if (canonicalNoteType === 'field') {
        effectiveDomains = [symbolName];
      } else {
        effectiveDomains = [UNASSIGNED_DOMAIN];
      }
    }

    const parsed: ParsedVaultNote = {
      relativePath: normalizedPath,
      symbolName,
      header,
      effectiveDomains,
      excerpt,
      canonicalNoteType,
      ruleModality
    };

    parsedNotes.push(parsed);
    symbolLookup.set(symbolName, {
      symbolName,
      domainFields: effectiveDomains
    });
    noteByLowerSym.set(symbolName.toLowerCase(), parsed);
  }

  // Passagem 2: Instanciar todos os I-Nodes reais em seus respectivos domínios (suporte a Multihoming)
  for (const note of parsedNotes) {
    for (const domain of note.effectiveDomains) {
      const noteUri = MMTUriResolver.buildNoteUri(note.symbolName, domain, docUri);
      engine.addNode({
        rawUri: noteUri,
        partition: AIFNodePartition.I_NODE,
        canonicalNoteType: note.canonicalNoteType,
        ruleModality: note.ruleModality,
        physicalFilePath: note.relativePath,
        markdownExcerpt: note.excerpt,
        isPlaceholder: false
      });
    }
  }

  // Rastreia quais notas (por URI canônico de I-Node) já receberam RA-Nodes de Presupposed Concept
  const hasPresupposedRa = new Set<string>();

  // Passagem 3: Instanciar RA-Nodes a partir de Presupposed Concept(s) (Fonte Autoritativa)
  for (const note of parsedNotes) {
    // Para notas Quest - sem Presupposed Concept, usa Coordinate Concepts como base comparativa
    const derivationPaths =
      note.header.presupposedPaths.length > 0
        ? note.header.presupposedPaths
        : note.canonicalNoteType === 'quaestio' && note.header.coordinate.length > 0
          ? [{ isConjunction: note.header.coordinate.length > 1, prerequisites: note.header.coordinate }]
          : [];

    for (const domain of note.effectiveDomains) {
      const hostUri = MMTUriResolver.buildNoteUri(note.symbolName, domain, docUri);

      for (let k = 0; k < derivationPaths.length; k++) {
        const path = derivationPaths[k]!;
        if (path.prerequisites.length === 0) continue;

        const raUri = MMTUriResolver.buildSchemeUri(hostUri, 'ra', k);
        const raNode = engine.addNode({
          rawUri: raUri,
          partition: AIFNodePartition.S_NODE,
          schemeSubType: AIFSchemeSubType.RA_DEFINITION,
          ruleModality:
            note.ruleModality === AIFRuleModality.DEFEASIBLE_R_D
              ? AIFRuleModality.DEFEASIBLE_R_D
              : AIFRuleModality.STRICT_R_S,
          canonicalNoteType: note.canonicalNoteType,
          physicalFilePath: note.relativePath,
          markdownExcerpt: `Derivação #${k + 1} de ${note.symbolName}`,
          isPlaceholder: false
        });

        for (const prereqRaw of path.prerequisites) {
          const resolved = MMTUriResolver.resolveWikilink(hostUri, prereqRaw, symbolLookup);
          const prereqNode = engine.addNode({
            rawUri: resolved.uri,
            partition: AIFNodePartition.I_NODE,
            physicalFilePath: resolved.isPlaceholder
              ? `${resolved.uri.sym}.md`
              : noteByLowerSym.get(resolved.uri.sym.toLowerCase())?.relativePath ?? `${resolved.uri.sym}.md`,
            markdownExcerpt: '',
            isPlaceholder: resolved.isPlaceholder
          });

          engine.addBipartiteEdge(prereqNode.internalId, raNode.internalId);
        }

        engine.addBipartiteEdge(raNode.internalId, hostUri);
        hasPresupposedRa.add(hostUri.canonical);
      }

      // Se a nota for uma Objeção (Obj -), instancia CA-Nodes para os alvos atacados em Coordinate/Related
      if (note.canonicalNoteType === 'objection') {
        const attackTargets = Array.from(
          new Set([...note.header.coordinate, ...note.header.related])
        );
        for (let cIdx = 0; cIdx < attackTargets.length; cIdx++) {
          const targetRaw = attackTargets[cIdx]!;
          const resolvedTarget = MMTUriResolver.resolveWikilink(
            hostUri,
            targetRaw,
            symbolLookup
          );
          const targetNode = engine.addNode({
            rawUri: resolvedTarget.uri,
            partition: AIFNodePartition.I_NODE,
            physicalFilePath: resolvedTarget.isPlaceholder
              ? `${resolvedTarget.uri.sym}.md`
              : noteByLowerSym.get(resolvedTarget.uri.sym.toLowerCase())?.relativePath ??
                `${resolvedTarget.uri.sym}.md`,
            markdownExcerpt: '',
            isPlaceholder: resolvedTarget.isPlaceholder
          });

          const caUri = MMTUriResolver.buildSchemeUri(hostUri, 'ca', cIdx);
          const caNode = engine.addNode({
            rawUri: caUri,
            partition: AIFNodePartition.S_NODE,
            schemeSubType: AIFSchemeSubType.CA_CONFLICT,
            ruleModality: AIFRuleModality.CONFLICT_ATTACK,
            canonicalNoteType: 'objection',
            physicalFilePath: note.relativePath,
            markdownExcerpt: `Conflito dialético de ${note.symbolName} contra ${resolvedTarget.uri.sym}`,
            isPlaceholder: false
          });

          engine.addBipartiteEdge(hostUri, caNode.internalId);
          engine.addBipartiteEdge(caNode.internalId, targetNode.internalId);
        }
      }
    }
  }

  // Passagem 4: Fallback para Derived Concept(s) APENAS quando a nota filha NÃO possui Presupposed Concept
  const fallbackCounter = new Map<string, number>();

  for (const parentNote of parsedNotes) {
    if (parentNote.header.derived.length === 0) continue;

    for (const domain of parentNote.effectiveDomains) {
      const parentUri = MMTUriResolver.buildNoteUri(parentNote.symbolName, domain, docUri);

      for (const derivedRaw of parentNote.header.derived) {
        const resolvedChild = MMTUriResolver.resolveWikilink(
          parentUri,
          derivedRaw,
          symbolLookup
        );

        const childNoteInVault = noteByLowerSym.get(resolvedChild.uri.sym.toLowerCase());
        // Se a nota filha já declarou Presupposed Concept(s), NUNCA cria RA-Node paralelo via Derived!
        if (
          (childNoteInVault && childNoteInVault.header.presupposedPaths.length > 0) ||
          hasPresupposedRa.has(resolvedChild.uri.canonical)
        ) {
          continue;
        }

        const childNode = engine.addNode({
          rawUri: resolvedChild.uri,
          partition: AIFNodePartition.I_NODE,
          physicalFilePath: resolvedChild.isPlaceholder
            ? `${resolvedChild.uri.sym}.md`
            : childNoteInVault?.relativePath ?? `${resolvedChild.uri.sym}.md`,
          markdownExcerpt: childNoteInVault?.excerpt ?? '',
          isPlaceholder: resolvedChild.isPlaceholder
        });

        const nextIdx = fallbackCounter.get(resolvedChild.uri.canonical) ?? 0;
        fallbackCounter.set(resolvedChild.uri.canonical, nextIdx + 1);

        const raUri = MMTUriResolver.buildSchemeUri(resolvedChild.uri, 'ra', nextIdx);
        const raNode = engine.addNode({
          rawUri: raUri,
          partition: AIFNodePartition.S_NODE,
          schemeSubType: AIFSchemeSubType.RA_DEFINITION,
          ruleModality: AIFRuleModality.STRICT_R_S,
          canonicalNoteType: childNode.canonicalNoteType,
          physicalFilePath: childNode.physicalFilePath,
          markdownExcerpt: `Derivação inferida via Derived Concepts de ${parentNote.symbolName}`,
          isPlaceholder: false
        });

        engine.addBipartiteEdge(parentUri, raNode.internalId);
        engine.addBipartiteEdge(raNode.internalId, childNode.internalId);
      }
    }
  }

  return engine;
}
