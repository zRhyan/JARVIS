// packages/core/src/epistemic-uri.ts

import { extractCanonicalWikilink } from './epistemic-header-parser.js';

/**
 * Prefixo padrão de pacote/documento para URIs MMT do JARVIS.
 */
export const DEFAULT_DOC_URI = 'jarvis://vault';

/**
 * Módulo de fallback para notas que não declaram Domain Fields no header canônico.
 */
export const UNASSIGNED_DOMAIN = '__unassigned__';

/**
 * Representação imutável de um identificador canônico tripartido MMT (`doc?mod?sym`).
 */
export interface TripartiteMMTUri {
  /** Identificador lógico do pacote/cofre sem query ou fragment (ex: "jarvis://vault") */
  readonly doc: string;
  /** Caminho do módulo/domínio teórico separado por '/' (ex: "Teoria dos Grafos" ou "Matemática/Álgebra") */
  readonly mod: string;
  /** Nome qualificado do símbolo ou esquema (ex: "Def - Vértice" ou "Def - Grafo/$ra_0") */
  readonly sym: string;
  /** Representação canônica serializada: `doc?mod?sym` */
  readonly canonical: string;
  /** Identificador canônico da Teoria/Domínio: `doc?mod` */
  readonly theoryUri: string;
}

/**
 * Metadados de uma nota indexada no cofre para resolução contextual de Wikilinks.
 */
export interface VaultNoteSymbolInfo {
  /** Nome canônico do símbolo/nota (ex: "Def - Conjunto") */
  readonly symbolName?: string;
  /** Lista de Domain Fields declarados no header da nota alvo */
  readonly domainFields: ReadonlyArray<string>;
}

/**
 * Provedor de busca de símbolos no cofre (pode ser uma função ou um Map/Record).
 */
export type VaultSymbolLookup =
  | ((symbolName: string) => VaultNoteSymbolInfo | undefined)
  | ReadonlyMap<string, VaultNoteSymbolInfo>
  | Record<string, VaultNoteSymbolInfo>;

/**
 * Resultado detalhado da resolução contextual de um Wikilink ou referência MMT.
 */
export interface ResolvedSymbolDescriptor {
  readonly uri: TripartiteMMTUri;
  /** true quando a nota referenciada ainda não existe fisicamente no cofre (Ghost Link) */
  readonly isPlaceholder: boolean;
  /** true quando o símbolo resolvido pertence a uma teoria/domínio diferente da nota origem */
  readonly isCrossDomain: boolean;
}

/**
 * Resolvedor, parser e validador de URIs Canônicos MMT (`doc?mod?sym`)
 * adaptado para cofres Obsidian (suporte a Unicode, espaços e Wikilinks contextuais).
 */
export class MMTUriResolver {
  /**
   * Valida segmentos `mod` e `sym` permitindo caracteres Unicode, espaços internos e símbolos
   * comuns em títulos de notas do Obsidian, proibindo caracteres de controle, `?` e `#`.
   */
  private static readonly SEGMENT_REGEX = /^[^\x00-\x1F?#]+$/u;

  /**
   * Valida o prefixo `doc` (ex: `jarvis://vault`, `pkm://vault/math`), proibindo espaços,
   * caracteres de controle, `?` e `#`.
   */
  private static readonly DOC_REGEX = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\x00-\x20?#]+$/;

  /**
   * Padrão de sufixo para identificar S-Nodes reificados (`/$ra_0`, `/$ca_1`, `/$pa_0`).
   */
  private static readonly SCHEME_SUFFIX_REGEX = /\/\$(ra|ca|pa)_(\d+)$/;

  /**
   * Analisa e valida um URI canônico MMT no formato tripartido `doc?mod?sym`.
   * Garante ausência de colisões entre conceitos homônimos em domínios distintos.
   */
  public static parseCanonical(rawUri: string): TripartiteMMTUri {
    if (!rawUri || typeof rawUri !== 'string') {
      throw new Error('[MMT-URI Inválido] O URI fornecido deve ser uma string não-vazia.');
    }

    const trimmed = rawUri.trim();
    if (trimmed.includes('#')) {
      throw new Error(
        `[MMT-URI Inválido] Fragmento '#' é proibido na gramática MMT-URI: "${rawUri}"`
      );
    }

    const firstQ = trimmed.indexOf('?');
    if (firstQ <= 0) {
      throw new Error(
        `[MMT-URI Inválido] Ausência do delimitador de módulo '?' em: "${rawUri}"`
      );
    }

    const secondQ = trimmed.indexOf('?', firstQ + 1);
    if (secondQ <= firstQ + 1 || secondQ === trimmed.length - 1) {
      throw new Error(
        `[MMT-URI Inválido] Estrutura tripartida 'doc?mod?sym' incompleta em: "${rawUri}"`
      );
    }

    if (trimmed.indexOf('?', secondQ + 1) !== -1) {
      throw new Error(
        `[MMT-URI Inválido] Caracteres '?' excedentes encontrados em: "${rawUri}"`
      );
    }

    const rawDoc = trimmed.slice(0, firstQ).trim().replace(/\/+$/, '');
    const rawMod = trimmed.slice(firstQ + 1, secondQ);
    const rawSym = trimmed.slice(secondQ + 1);

    if (!rawDoc || !this.DOC_REGEX.test(rawDoc)) {
      throw new Error(
        `[MMT-URI Inválido] Segmento de documento 'doc' malformado ("${rawDoc}") em: "${rawUri}"`
      );
    }

    const mod = this.normalizeAndValidateSlashPath(rawMod, 'mod', rawUri);
    const sym = this.normalizeAndValidateSlashPath(rawSym, 'sym', rawUri);

    const theoryUri = `${rawDoc}?${mod}`;
    const canonical = `${theoryUri}?${sym}`;

    return Object.freeze({
      doc: rawDoc,
      mod,
      sym,
      canonical,
      theoryUri
    });
  }

  /**
   * Constrói um URI canônico para uma nota (I-Node) a partir do símbolo, módulo e documento.
   * Caso `mod` seja omitido ou vazio, utiliza `UNASSIGNED_DOMAIN` ("__unassigned__").
   */
  public static buildNoteUri(
    sym: string,
    mod?: string,
    doc: string = DEFAULT_DOC_URI
  ): TripartiteMMTUri {
    const cleanSym = extractCanonicalWikilink(sym);
    const cleanMod = mod ? extractCanonicalWikilink(mod) : '';
    const effectiveMod = cleanMod.length > 0 ? cleanMod : UNASSIGNED_DOMAIN;
    return this.parseCanonical(`${doc}?${effectiveMod}?${cleanSym}`);
  }

  /**
   * Constrói deterministicamente o URI canônico de um S-Node (`$ra_k`, `$ca_k`, `$pa_k`)
   * subordinado à nota hospedeira onde a derivação ou conflito foi declarado.
   */
  public static buildSchemeUri(
    hostNoteUri: TripartiteMMTUri | string,
    kind: 'ra' | 'ca' | 'pa',
    index: number
  ): TripartiteMMTUri {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[MMT-URI Inválido] Índice de S-Node deve ser um inteiro não-negativo, recebido: ${index}`
      );
    }

    const base =
      typeof hostNoteUri === 'string' ? this.parseCanonical(hostNoteUri) : hostNoteUri;

    return this.parseCanonical(`${base.doc}?${base.mod}?${base.sym}/$${kind}_${index}`);
  }

  /**
   * Verifica se o URI fornecido representa um S-Node reificado (`/$ra_k`, `/$ca_k`, `/$pa_k`).
   */
  public static isSchemeUri(uri: TripartiteMMTUri | string): boolean {
    const parsed = typeof uri === 'string' ? this.parseCanonical(uri) : uri;
    return this.SCHEME_SUFFIX_REGEX.test(parsed.sym);
  }

  /**
   * Resolve referências relativas MMT (`??sym0`, `?/mod0?sym0`, `?mod0?sym0`),
   * URIs absolutos (`doc0?mod0?sym0`) ou Wikilinks padrão do Obsidian (`[[Nota]]`)
   * contra o URI canônico da declaração/nota contenedora `baseUri`.
   */
  public static resolveRelative(
    baseUri: TripartiteMMTUri | string,
    reference: string,
    symbolLookup?: VaultSymbolLookup
  ): TripartiteMMTUri {
    return this.resolveWikilink(baseUri, reference, symbolLookup).uri;
  }

  /**
   * Resolve um Wikilink do Obsidian ou referência MMT retornando tanto o URI canônico
   * quanto os indicadores de fronteira (`isCrossDomain`) e nota fantasma (`isPlaceholder`).
   */
  public static resolveWikilink(
    baseUri: TripartiteMMTUri | string,
    rawReference: string,
    symbolLookup?: VaultSymbolLookup
  ): ResolvedSymbolDescriptor {
    const base = typeof baseUri === 'string' ? this.parseCanonical(baseUri) : baseUri;

    if (!rawReference || typeof rawReference !== 'string') {
      throw new Error('[MMT-URI Relativo Inválido] A referência não pode ser vazia.');
    }

    // Extrai o alvo caso venha envelopado em [[...]] ou com alias [[Alvo|Alias]]
    const ref = extractCanonicalWikilink(rawReference);
    if (!ref) {
      throw new Error(
        `[MMT-URI Relativo Inválido] Referência vazia após limpeza de wikilink: "${rawReference}"`
      );
    }

    // Caso 1: Intra-Teoria explícito `??sym0` -> doc?mod?sym0
    if (ref.startsWith('??')) {
      const sym0Raw = ref.slice(2);
      const uri = this.parseCanonical(`${base.doc}?${base.mod}?${sym0Raw}`);
      const isPlaceholder = this.checkIsPlaceholder(uri.sym, symbolLookup);
      return {
        uri,
        isPlaceholder,
        isCrossDomain: false
      };
    }

    // Caso 2: Sub-Teoria Aninhada `?/mod0?sym0` -> doc?mod/mod0?sym0
    if (ref.startsWith('?/')) {
      const rest = ref.slice(2);
      const qIdx = rest.indexOf('?');
      if (qIdx <= 0 || qIdx === rest.length - 1) {
        throw new Error(
          `[MMT-URI Relativo Inválido] Esperado '?/mod0?sym0', recebido: "${rawReference}"`
        );
      }
      const mod0 = this.normalizeAndValidateSlashPath(rest.slice(0, qIdx), 'mod', rawReference);
      const sym0 = this.normalizeAndValidateSlashPath(rest.slice(qIdx + 1), 'sym', rawReference);
      const uri = this.parseCanonical(`${base.doc}?${base.mod}/${mod0}?${sym0}`);
      const isPlaceholder = this.checkIsPlaceholder(uri.sym, symbolLookup);
      return {
        uri,
        isPlaceholder,
        isCrossDomain: uri.theoryUri !== base.theoryUri
      };
    }

    // Caso 3: Inter-Teoria explícito no mesmo documento `?mod0?sym0` -> doc?mod0?sym0
    if (ref.startsWith('?')) {
      const rest = ref.slice(1);
      const qIdx = rest.indexOf('?');
      if (qIdx <= 0 || qIdx === rest.length - 1) {
        throw new Error(
          `[MMT-URI Relativo Inválido] Esperado '?mod0?sym0', recebido: "${rawReference}"`
        );
      }
      const mod0 = this.normalizeAndValidateSlashPath(rest.slice(0, qIdx), 'mod', rawReference);
      const sym0 = this.normalizeAndValidateSlashPath(rest.slice(qIdx + 1), 'sym', rawReference);
      const uri = this.parseCanonical(`${base.doc}?${mod0}?${sym0}`);
      const isPlaceholder = this.checkIsPlaceholder(uri.sym, symbolLookup);
      return {
        uri,
        isPlaceholder,
        isCrossDomain: uri.theoryUri !== base.theoryUri
      };
    }

    // Caso 4: URI Absoluto Completo `doc0?mod0?sym0` (contém delimitador '?')
    if (ref.includes('?')) {
      const uri = this.parseCanonical(ref);
      const isPlaceholder = this.checkIsPlaceholder(uri.sym, symbolLookup);
      return {
        uri,
        isPlaceholder,
        isCrossDomain: uri.theoryUri !== base.theoryUri
      };
    }

    // Caso 5: Wikilink Padrão do Obsidian (ex: "Def - Vértice", "Def - Conjunto")
    const targetInfo = this.lookupSymbol(ref, symbolLookup);
    if (targetInfo) {
      const resolvedSym = targetInfo.symbolName ? extractCanonicalWikilink(targetInfo.symbolName) : ref;
      const cleanedDomains = targetInfo.domainFields
        .map(d => extractCanonicalWikilink(d))
        .filter(Boolean);

      // Multihoming: se a nota alvo já participa do domínio atual da nota base, mantém intra-domínio
      const matchingBaseDomain = cleanedDomains.find(
        d => d.toLowerCase() === base.mod.toLowerCase()
      );

      if (matchingBaseDomain) {
        const uri = this.parseCanonical(`${base.doc}?${base.mod}?${resolvedSym}`);
        return {
          uri,
          isPlaceholder: false,
          isCrossDomain: false
        };
      }

      // Se a nota alvo pertence a outro(s) domínio(s), resolve para o domínio primário externo (Boundary Anchor)
      if (cleanedDomains.length > 0) {
        const primaryExternalDomain = cleanedDomains[0]!;
        const uri = this.parseCanonical(`${base.doc}?${primaryExternalDomain}?${resolvedSym}`);
        return {
          uri,
          isPlaceholder: false,
          isCrossDomain: uri.theoryUri !== base.theoryUri
        };
      }

      // Nota alvo existe no cofre mas não declarou Domain Fields
      const uri = this.parseCanonical(`${base.doc}?${UNASSIGNED_DOMAIN}?${resolvedSym}`);
      return {
        uri,
        isPlaceholder: false,
        isCrossDomain: uri.theoryUri !== base.theoryUri
      };
    }

    // Ghost Link (Nota ainda não criada no cofre) ou resolução sem lookup:
    // Herda o domínio da nota pai para não distorcer os níveis do DAG (Resolução #6 RFC-008)
    const uri = this.parseCanonical(`${base.doc}?${base.mod}?${ref}`);
    return {
      uri,
      isPlaceholder: symbolLookup !== undefined,
      isCrossDomain: false
    };
  }

  private static lookupSymbol(
    sym: string,
    lookup?: VaultSymbolLookup
  ): VaultNoteSymbolInfo | undefined {
    if (!lookup) return undefined;

    const cleanSym = extractCanonicalWikilink(sym);
    const lowerSym = cleanSym.toLowerCase();
    const baseSym = (cleanSym.split('/').pop() || cleanSym).toLowerCase();

    if (typeof lookup === 'function') {
      return lookup(cleanSym);
    }

    if (lookup instanceof Map) {
      const direct = lookup.get(cleanSym) ?? lookup.get(lowerSym);
      if (direct) return direct;
      for (const [k, v] of lookup.entries()) {
        const kClean = extractCanonicalWikilink(k).toLowerCase();
        const kBase = (kClean.split('/').pop() || kClean).toLowerCase();
        if (kClean === lowerSym || kBase === baseSym) {
          return v;
        }
      }
      return undefined;
    }

    const record = lookup as Record<string, VaultNoteSymbolInfo>;
    if (record[cleanSym]) return record[cleanSym];
    if (record[lowerSym]) return record[lowerSym];
    for (const [k, v] of Object.entries(record)) {
      const kClean = extractCanonicalWikilink(k).toLowerCase();
      const kBase = (kClean.split('/').pop() || kClean).toLowerCase();
      if (kClean === lowerSym || kBase === baseSym) {
        return v;
      }
    }
    return undefined;
  }

  private static checkIsPlaceholder(sym: string, lookup?: VaultSymbolLookup): boolean {
    if (!lookup) return false;
    return this.lookupSymbol(sym, lookup) === undefined;
  }

  private static normalizeAndValidateSlashPath(
    rawSegment: string,
    segmentName: 'mod' | 'sym',
    fullUri: string
  ): string {
    const trimmed = rawSegment.trim();
    if (!trimmed) {
      throw new Error(
        `[MMT-URI Inválido] Segmento '${segmentName}' vazio em: "${fullUri}"`
      );
    }

    const rawParts = trimmed.split('/');
    const parts: string[] = [];

    for (const part of rawParts) {
      const cleanPart = part.trim();
      if (cleanPart.length === 0) {
        throw new Error(
          `[MMT-URI Inválido] Sub-segmento vazio (barra duplicada ou extrema) em '${segmentName}'="${rawSegment}" (URI: "${fullUri}")`
        );
      }
      if (!this.SEGMENT_REGEX.test(cleanPart)) {
        throw new Error(
          `[MMT-URI Inválido] Violação léxica no segmento '${segmentName}'="${rawSegment}" (URI: "${fullUri}")`
        );
      }
      parts.push(cleanPart);
    }

    return parts.join('/');
  }
}
