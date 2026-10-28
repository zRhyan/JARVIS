// packages/core/src/epistemic-header-parser.ts

/**
 * Representa um caminho de derivação para conceitos pressupostos.
 * Se múltiplos conceitos estiverem na mesma linha (ex: [[A]], [[B]]),
 * a derivação é conjuntiva (A E B são necessários).
 * Linhas distintas sob Presupposed Concept representam caminhos alternativos (OU).
 */
export interface EpistemicDerivationPath {
  isConjunction: boolean;
  prerequisites: string[];
}

/**
 * Representação estruturada extraída do cabeçalho canônico do Obsidian.
 */
export interface EpistemicHeader {
  hasHeader: boolean;
  tags: string[];
  status?: string;
  domainFields: string[];
  presupposedPaths: EpistemicDerivationPath[];
  coordinate: string[];
  derived: string[];
  related: string[];
  rawHeader?: string;
}

/**
 * Limpa e extrai o alvo canônico de um wikilink Obsidian.
 * Ex: "[[Def - Grafo|Grafo]]" -> "Def - Grafo"
 * Ex: "[[Def - Vértice.md]]" -> "Def - Vértice"
 */
export function extractCanonicalWikilink(linkStr: string): string {
  let clean = linkStr.trim();
  if (clean.startsWith('[[')) clean = clean.slice(2);
  if (clean.endsWith(']]')) clean = clean.slice(0, -2);
  
  // Trata alias: [[Target|Alias]]
  if (clean.includes('|')) {
    clean = clean.split('|')[0]!.trim();
  }

  // Remove extensão .md caso o usuário tenha colocado
  if (clean.toLowerCase().endsWith('.md')) {
    clean = clean.slice(0, -3);
  }

  return clean.trim();
}

/**
 * Extrai todos os wikilinks canônicos de uma linha de texto.
 */
export function extractWikilinksFromLine(line: string): string[] {
  const matches = line.match(/\[\[(.*?)\]\]/g);
  if (!matches) return [];
  return matches.map(extractCanonicalWikilink).filter(Boolean);
}

/**
 * Extrai tags (#tag) de uma linha de texto ou bloco.
 */
export function extractTagsFromText(text: string): string[] {
  // Regex para tags Obsidian (ex: #review, #difficulty, #teenager, #area/subarea)
  // Ignora cabeçalhos markdown (# Título) garantindo que a tag não esteja no início da linha isolada com espaço
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-\/]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    if (match[1]) {
      tags.push(match[1]);
    }
  }
  return Array.from(new Set(tags));
}

/**
 * Parser determinístico de cabeçalho epistêmico em Markdown puro.
 * Inspeciona o bloco "## Map of Content / Tags:" e extrai a taxonomia de profundidade 1.
 */
export function parseEpistemicHeader(markdownContent: string): EpistemicHeader {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return {
      hasHeader: false,
      tags: [],
      domainFields: [],
      presupposedPaths: [],
      coordinate: [],
      derived: [],
      related: []
    };
  }

  // Identifica o bloco de cabeçalho
  // O bloco vai de "## Map of Content / Tags:" até o próximo divisor "---" duplo ou cabeçalho nível 2 "## "
  const mocHeaderRegex = /##\s+Map of Content\s*\/\s*Tags:?([\s\S]*?)(?=\n---\s*\n---\s*|\n##\s+|\n#\s+|$)/i;
  const match = mocHeaderRegex.exec(markdownContent);

  // Também extrai tags globais do preâmbulo (antes do MOC)
  const preambule = markdownContent.slice(0, match ? match.index : 500);
  const globalTags = extractTagsFromText(preambule);

  // Extrai status: (ex: Status: #teenager ou Status: teenager)
  let status: string | undefined = undefined;
  const statusMatch = preambule.match(/Status:\s*#?([a-zA-Z0-9_\-]+)/i);
  if (statusMatch && statusMatch[1]) {
    status = statusMatch[1].trim();
  }

  if (!match) {
    return {
      hasHeader: false,
      tags: globalTags,
      status,
      domainFields: [],
      presupposedPaths: [],
      coordinate: [],
      derived: [],
      related: []
    };
  }

  const rawHeaderContent = match[1] || '';
  const lines = rawHeaderContent.split('\n');

  const domainFields: string[] = [];
  const presupposedPaths: EpistemicDerivationPath[] = [];
  const coordinate: string[] = [];
  const derived: string[] = [];
  const related: string[] = [];

  let currentSection: 'none' | 'presupposed' | 'coordinate' | 'derived' | 'related' | 'domain' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Domain Field(s)
    if (trimmed.match(/^[-*]\s+\*\*Domain Fields?\*\*:?/i)) {
      currentSection = 'domain';
      const inlineLinks = extractWikilinksFromLine(trimmed);
      domainFields.push(...inlineLinks);
      continue;
    }

    // 2. Presupposed Concept(s)
    if (trimmed.match(/^[-*]\s+\*\*Presupposed Concepts?\*\*:?/i)) {
      currentSection = 'presupposed';
      const inlineLinks = extractWikilinksFromLine(trimmed);
      if (inlineLinks.length > 0) {
        presupposedPaths.push({
          isConjunction: inlineLinks.length > 1,
          prerequisites: inlineLinks
        });
      }
      continue;
    }

    // 3. Coordinate Concept(s)
    if (trimmed.match(/^[-*]\s+\*\*Coordinate Concepts?\*\*:?/i)) {
      currentSection = 'coordinate';
      const inlineLinks = extractWikilinksFromLine(trimmed);
      coordinate.push(...inlineLinks);
      continue;
    }

    // 4. Derived Concept(s)
    if (trimmed.match(/^[-*]\s+\*\*Derived Concepts?\*\*:?/i)) {
      currentSection = 'derived';
      const inlineLinks = extractWikilinksFromLine(trimmed);
      derived.push(...inlineLinks);
      continue;
    }

    // 5. Related (ou Related Concept(s))
    if (trimmed.match(/^[-*]\s+\*\*Related(?:\s+Concepts?)?\*\*:?/i)) {
      currentSection = 'related';
      const inlineLinks = extractWikilinksFromLine(trimmed);
      related.push(...inlineLinks);
      continue;
    }

    // Se encontramos outra seção principal que não é sub-item
    if (trimmed.match(/^[-*]\s+\*\*[A-Za-z\s]+\*\*:?/i)) {
      currentSection = 'none';
      continue;
    }

    // Se for sub-item (começa com hífen ou asterisco recuado)
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const subLinks = extractWikilinksFromLine(trimmed);
      if (subLinks.length > 0) {
        if (currentSection === 'presupposed') {
          presupposedPaths.push({
            isConjunction: subLinks.length > 1,
            prerequisites: subLinks
          });
        } else if (currentSection === 'coordinate') {
          coordinate.push(...subLinks);
        } else if (currentSection === 'derived') {
          derived.push(...subLinks);
        } else if (currentSection === 'related') {
          related.push(...subLinks);
        } else if (currentSection === 'domain') {
          domainFields.push(...subLinks);
        }
      }
    }
  }

  // Tags presentes no próprio header
  const headerTags = extractTagsFromText(rawHeaderContent);
  const allTags = Array.from(new Set([...globalTags, ...headerTags]));

  return {
    hasHeader: true,
    tags: allTags,
    status,
    domainFields: Array.from(new Set(domainFields)),
    presupposedPaths,
    coordinate: Array.from(new Set(coordinate)),
    derived: Array.from(new Set(derived)),
    related: Array.from(new Set(related)),
    rawHeader: match[0]
  };
}
