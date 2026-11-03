// packages/core/src/contracts/slot-sanitizer.ts

import { extractCanonicalWikilink } from '../epistemic-header-parser.js';
import { getSlotContract } from './contract-registry.js';
import type {
  CanonicalNoteArchetype,
  NoteSlotContract,
  SlotRuleDescriptor,
  VaultConventionsConfig
} from './contract-types.js';
import { DEFAULT_VAULT_CONVENTIONS } from './vault-conventions.js';

/**
 * Limpa qualquer wikilink em uma string para remover caminhos de pastas (`6 - Main Notes/...`)
 * e extensões `.md`, preservando eventuais aliases (`[[Alvo|Alias]]`).
 */
export function sanitizeWikilinksInText(text: string): string {
  if (!text) return '';
  return text.replace(/\[\[(.*?)\]\]/g, (_, inner: string) => {
    const parts = inner.split('|');
    const rawTarget = (parts[0] ?? '').trim();
    const alias = parts.length > 1 ? parts.slice(1).join('|').trim() : undefined;

    // Remove diretórios caso a LLM tenha colocado caminho relativo (ex: "6 - Main Notes/Def - X.md")
    const baseName = rawTarget.split('/').pop() ?? rawTarget;
    const cleanTarget = extractCanonicalWikilink(baseName);

    if (!cleanTarget) return '';
    return alias ? `[[${cleanTarget}|${alias}]]` : `[[${cleanTarget}]]`;
  });
}

/**
 * Converte um token individual (ex: `"Def - Conjunto"`, `"[[6 - Main Notes/Def - Conjunto.md]]"`)
 * em um wikilink canônico formatado `[[Def - Conjunto]]`.
 */
export function normalizeWikilinkToken(token: string): string {
  const trimmed = token.trim().replace(/^[-*]\s+/, '').trim();
  if (!trimmed) return '';

  // Se já contém wikilinks internos, sanitiza-os
  if (trimmed.includes('[[')) {
    return sanitizeWikilinksInText(trimmed);
  }

  const baseName = trimmed.split('/').pop() ?? trimmed;
  const clean = extractCanonicalWikilink(baseName);
  return clean ? `[[${clean}]]` : '';
}

/**
 * Extrai todos os wikilinks (ou tokens separados por vírgula) de uma linha
 * e os retorna como `[[Nota 1]], [[Nota 2]]`.
 */
export function formatInlineWikilinksSlot(rawVal: unknown): string {
  if (rawVal === null || rawVal === undefined) return '';

  const tokens: string[] = [];

  if (Array.isArray(rawVal)) {
    for (const item of rawVal) {
      if (typeof item === 'string') {
        tokens.push(item);
      }
    }
  } else if (typeof rawVal === 'string') {
    const str = rawVal.trim();
    if (!str) return '';
    const existingMatches = str.match(/\[\[.*?\]\]/g);
    if (existingMatches && existingMatches.length > 0) {
      tokens.push(...existingMatches);
    } else {
      tokens.push(...str.split(','));
    }
  }

  const formatted = Array.from(
    new Set(tokens.map(normalizeWikilinkToken).filter(Boolean))
  );
  return formatted.join(', ');
}

/**
 * Formata deterministicamente o slot `MOC_PRESUPPOSED` segundo a gramática booleana do cofre:
 * - Cada linha começa com `\t\t- `;
 * - Múltiplos wikilinks na mesma linha = Conjunção (`AND`, ex: `\t\t- [[Def - A]], [[Def - B]]`);
 * - Linhas separadas = Disjunção (`OR`, caminhos alternativos de derivação);
 * - Se `requiresZeroInDegree` for `true` (`axiom` ou `observation`), retorna sempre `""`
 *   para blindar $d^- = 0$ e $\mathcal{L} = 0$ na Rede Epistêmica!
 */
export function formatMocPresupposedSlot(
  rawVal: unknown,
  requiresZeroInDegree: boolean = false
): string {
  if (requiresZeroInDegree) {
    return '';
  }
  if (rawVal === null || rawVal === undefined) {
    return '';
  }

  const disjunctiveLines: string[] = [];

  if (Array.isArray(rawVal)) {
    for (const entry of rawVal) {
      if (Array.isArray(entry)) {
        // Array de arrays: cada sub-array é uma conjunção (AND)
        const conjLinks = Array.from(
          new Set(entry.map( item => normalizeWikilinkToken(String(item))).filter(Boolean))
        );
        if (conjLinks.length > 0) {
          disjunctiveLines.push(`\t\t- ${conjLinks.join(', ')}`);
        }
      } else if (typeof entry === 'string') {
        const lineLinks = extractLinksFromMocLine(entry);
        if (lineLinks.length > 0) {
          disjunctiveLines.push(`\t\t- ${lineLinks.join(', ')}`);
        }
      }
    }
  } else if (typeof rawVal === 'string') {
    const rawLines = rawVal.split(/\r?\n/);
    for (const line of rawLines) {
      const lineLinks = extractLinksFromMocLine(line);
      if (lineLinks.length > 0) {
        disjunctiveLines.push(`\t\t- ${lineLinks.join(', ')}`);
      }
    }
  }

  return disjunctiveLines.join('\n');
}

function extractLinksFromMocLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // Ignora comentários ou marcadores de vazio ("Nenhum", "Vazio", "N/A")
  if (/^(?:[-*]\s*)?(?:nenhum|vazio|n\/a|none|null|\(vazio\))$/i.test(trimmed)) {
    return [];
  }

  const matches = trimmed.match(/\[\[.*?\]\]/g);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches.map(normalizeWikilinkToken).filter(Boolean)));
  }

  // Caso a LLM tenha enviado nomes separados por vírgula sem colchetes
  const cleanedLine = trimmed.replace(/^[-*]\s+/, '').trim();
  if (!cleanedLine) return [];

  return Array.from(
    new Set(
      cleanedLine
        .split(',')
        .map(normalizeWikilinkToken)
        .filter(Boolean)
    )
  );
}

/**
 * Formata listas de wikilinks do MOC (`MOC_COORDINATE`, `MOC_DERIVED`, `MOC_BROADER_FIELDS`, etc.)
 * ou `MOC_RELATED` com a indentação exata do template.
 */
export function formatMocWikilinkListSlot(
  rawVal: unknown,
  indentPrefix: '\t\t- ' | '\t- ' = '\t\t- '
): string {
  if (rawVal === null || rawVal === undefined) return '';

  const rawItems: string[] = [];
  if (Array.isArray(rawVal)) {
    for (const item of rawVal) {
      if (typeof item === 'string') rawItems.push(...item.split(/\r?\n/));
    }
  } else if (typeof rawVal === 'string') {
    rawItems.push(...rawVal.split(/\r?\n/));
  }

  const formattedLines: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of rawItems) {
    const links = extractLinksFromMocLine(rawLine);
    for (const link of links) {
      if (!seen.has(link)) {
        seen.add(link);
        formattedLines.push(`${indentPrefix}${link}`);
      }
    }
  }

  return formattedLines.join('\n');
}

/**
 * Sanitiza slots que residem dentro de callouts (`callout_multiline_bullets`),
 * removendo prefixos `>` redundantes que a LLM eventualmente tenha colocado
 * (pois `fillTemplateSlots` em `template-engine.ts` propaga `\n> ` automaticamente).
 */
export function sanitizeCalloutMultilineSlot(rawVal: unknown): string {
  const str = coerceToString(rawVal);
  if (!str) return '';

  const lines = str
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*>\s?/, '').trimEnd())
    .filter(line => line.trim() !== '');

  return sanitizeWikilinksInText(lines.join('\n'));
}

/**
 * Sanitiza listas de bullets indentados do corpo (`\t- `) ou referências (`REF_*`).
 */
export function sanitizeIndentedBulletsSlot(rawVal: unknown): string {
  const str = coerceToString(rawVal);
  if (!str) return '';

  const rawLines = str.split(/\r?\n/);
  const result: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    // Ignora cabeçalhos Markdown repetidos acidentalmente pela LLM
    if (/^#{1,6}\s+/.test(trimmed)) continue;

    const bulletContent = trimmed.replace(/^[-*]\s+/, '').trim();
    if (!bulletContent) continue;

    result.push(`\t- ${sanitizeWikilinksInText(bulletContent)}`);
  }

  return result.join('\n');
}

/**
 * Sanitiza o conteúdo do slot `TAXONOMIA_MERMAID`:
 * - Remove cercas ```mermaid e ``` caso a LLM as tenha incluído;
 * - Garante `graph TD` na primeira linha;
 * - Remove colchetes duplos `[[` e `]]` acidentais de dentro dos rótulos dos nós
 *   para evitar erro de sintaxe no renderizador Pele / Mermaid 12.1.0.
 */
export function sanitizeMermaidSlot(rawVal: unknown): string {
  const str = coerceToString(rawVal);
  if (!str) return '';

  let cleaned = str
    .replace(/^```(?:mermaid)?\s*\r?\n?/i, '')
    .replace(/\r?\n?```\s*$/i, '')
    .trim();

  if (!cleaned) return '';

  // Remove [[ e ]] que a LLM eventualmente coloque dentro de rótulos ["[[Def - X]]"]
  cleaned = cleaned.replace(/\[\[(.*?)\]\]/g, '$1');

  const lines = cleaned
    .split(/\r?\n/)
    .map(l => l.trimEnd())
    .filter(l => l.trim() !== '');

  if (lines.length === 0) return '';

  const firstLine = lines[0]!.trim();
  if (!/^(?:graph|flowchart)\s+(?:TD|TB|LR|RL|BT)/i.test(firstLine)) {
    lines.unshift('graph TD');
  }

  return lines.join('\n');
}

/**
 * Remove cabeçalhos Markdown de nível 1 ou 2 duplicados no topo de slots de corpo
 * e sanitiza wikilinks internos.
 */
export function sanitizeMarkdownBodySlot(rawVal: unknown): string {
  const str = coerceToString(rawVal);
  if (!str) return '';

  const lines = str.split(/\r?\n/);
  while (lines.length > 0 && /^#{1,3}\s+/.test(lines[0]!.trim())) {
    lines.shift();
  }

  return sanitizeWikilinksInText(lines.join('\n').trim());
}

function coerceToString(rawVal: unknown): string {
  if (rawVal === null || rawVal === undefined) return '';
  if (Array.isArray(rawVal)) {
    return rawVal.map(item => String(item)).join('\n');
  }
  return String(rawVal).trim();
}

/**
 * Sanitiza e normaliza deterministicamente todo o payload de slots retornado pela LLM
 * segundo o contrato formal do arquétipo canônico.
 */
export function sanitizeSlotPayload(
  archetype: CanonicalNoteArchetype,
  rawPayload: Record<string, unknown>,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS,
  customContract?: NoteSlotContract
): Record<string, string> {
  const contract = customContract ?? getSlotContract(archetype, conventions);

  // Mapa de regras indexado por slotId normalizado (UPPERCASE)
  const ruleBySlotId = new Map<string, SlotRuleDescriptor>();
  for (const rule of contract.slots) {
    ruleBySlotId.set(rule.slotId.toUpperCase(), rule);
  }

  // Mapa de valores brutos enviados pela LLM indexado por chave normalizada (UPPERCASE)
  const rawByUpperKey = new Map<string, unknown>();
  for (const [k, v] of Object.entries(rawPayload || {})) {
    const normKey = k.trim().toUpperCase().replace(/[\s\-]+/g, '_');
    rawByUpperKey.set(normKey, v);
  }

  const sanitized: Record<string, string> = {};

  for (const [slotId, rule] of ruleBySlotId.entries()) {
    const rawVal = rawByUpperKey.get(slotId);

    switch (rule.syntaxKind) {
      case 'status_tag': {
        const val = coerceToString(rawVal);
        if (!val) {
          sanitized[slotId] = '#teenager';
        } else {
          // Garante que cada token de tag comece com #
          sanitized[slotId] = val
            .split(/\s+/)
            .filter(Boolean)
            .map(t => (t.startsWith('#') ? t : `#${t}`))
            .join(' ');
        }
        break;
      }

      case 'inline_wikilinks': {
        sanitized[slotId] = formatInlineWikilinksSlot(rawVal);
        break;
      }

      case 'moc_presupposed_tree': {
        sanitized[slotId] = formatMocPresupposedSlot(rawVal, contract.requiresZeroInDegree);
        break;
      }

      case 'moc_wikilink_list': {
        sanitized[slotId] = formatMocWikilinkListSlot(rawVal, '\t\t- ');
        break;
      }

      case 'moc_related_list': {
        sanitized[slotId] = formatMocWikilinkListSlot(rawVal, '\t- ');
        break;
      }

      case 'callout_multiline_bullets': {
        sanitized[slotId] = sanitizeCalloutMultilineSlot(rawVal);
        break;
      }

      case 'markdown_bullets':
      case 'reference_list': {
        sanitized[slotId] = sanitizeIndentedBulletsSlot(rawVal);
        break;
      }

      case 'mermaid_graph_td': {
        sanitized[slotId] = sanitizeMermaidSlot(rawVal);
        break;
      }

      case 'markdown_body':
      case 'markdown_table_and_body': {
        sanitized[slotId] = sanitizeMarkdownBodySlot(rawVal);
        break;
      }

      case 'inline_text':
      default: {
        const inlineStr = coerceToString(rawVal)
          .replace(/\r?\n+/g, ' ')
          .replace(/^\s*>\s*/, '')
          .trim();
        sanitized[slotId] = sanitizeWikilinksInText(inlineStr);
        break;
      }
    }
  }

  // Preserva também quaisquer slots extras customizados que o usuário tenha adicionado ao template
  for (const [extraKey, rawVal] of rawByUpperKey.entries()) {
    if (!ruleBySlotId.has(extraKey)) {
      sanitized[extraKey] = sanitizeWikilinksInText(coerceToString(rawVal));
    }
  }

  return sanitized;
}
