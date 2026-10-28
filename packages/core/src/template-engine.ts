// packages/core/src/template-engine.ts

export interface MacroExpansionContext {
  title?: string;
  domainFields?: string[];
  now?: Date;
  customMacros?: Record<string, string>;
}

export interface SlotInjectionOptions {
  cleanUnfilledSlots?: boolean; // Se true, remove comentários <!-- SLOT:X --> não preenchidos (default: true)
}

/**
 * Formata uma data no formato YYYY-MM-DD local.
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata um horário no formato HH:mm local.
 */
export function formatTimeLocal(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Adiciona N dias a uma data e retorna no formato YYYY-MM-DD local.
 */
export function addDaysFormatLocal(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return formatDateLocal(next);
}

/**
 * Expande macros determinísticas em um template Markdown.
 * Suporta:
 * - {{date}} -> YYYY-MM-DD
 * - {{time}} -> HH:mm
 * - {{title}} -> título da nota
 * - {{domain_fields}} -> [[Campo 1]], [[Campo 2]]
 * - Macros do plugin Spaced Repetition (SR) / Templater:
 *   <!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250--> -> <!--SR:YYYY-MM-DD,3,250-->
 *   <!--SR:{{date_plus_3}},3,250--> -> <!--SR:YYYY-MM-DD,3,250-->
 */
export function expandTemplateMacros(templateContent: string, context: MacroExpansionContext = {}): string {
  if (!templateContent) return '';

  const now = context.now || new Date();
  const dateStr = formatDateLocal(now);
  const timeStr = formatTimeLocal(now);
  const srDatePlus3Str = addDaysFormatLocal(now, 3);
  const titleStr = context.title || '';
  
  let domainFieldsStr = '';
  if (context.domainFields && context.domainFields.length > 0) {
    domainFieldsStr = context.domainFields
      .map(field => field.startsWith('[[') && field.endsWith(']]') ? field : `[[${field}]]`)
      .join(', ');
  }

  let result = templateContent;

  // 1. Resolve macros do Templater/SR nativas do cofre:
  // <% tp.date.now("YYYY-MM-DD", +X) %> ou <% tp.date.now("YYYY-MM-DD", X) %>
  result = result.replace(/<%\s*tp\.date\.now\(\s*["']YYYY-MM-DD["']\s*,\s*\+?(\d+)\s*\)\s*%>/gi, (_, days) => {
    const d = parseInt(days, 10) || 0;
    return addDaysFormatLocal(now, d);
  });

  // 2. Resolve {{date_plus_X}}
  result = result.replace(/\{\{\s*date_plus_(\d+)\s*\}\}/gi, (_, days) => {
    const d = parseInt(days, 10) || 0;
    return addDaysFormatLocal(now, d);
  });

  // 3. Resolve variáveis padrão QuickAdd/Obsidian
  result = result.replace(/\{\{\s*date\s*\}\}/gi, dateStr);
  result = result.replace(/\{\{\s*time\s*\}\}/gi, timeStr);
  result = result.replace(/\{\{\s*title\s*\}\}/gi, titleStr);
  result = result.replace(/\{\{\s*domain_fields\s*\}\}/gi, domainFieldsStr);

  // 4. Resolve macros customizadas fornecidas no contexto
  if (context.customMacros) {
    for (const [key, value] of Object.entries(context.customMacros)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      result = result.replace(regex, value);
    }
  }

  return result;
}

/**
 * Extrai todos os IDs de slots declarados no template no padrão:
 * <!-- SLOT:NOME_DO_SLOT -->
 */
export function extractTemplateSlots(templateContent: string): string[] {
  if (!templateContent) return [];
  const regex = /<!--\s*SLOT:([a-zA-Z0-9_\-]+)\s*-->/g;
  const slots: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(templateContent)) !== null) {
    if (match[1]) {
      slots.push(match[1].trim());
    }
  }
  return Array.from(new Set(slots));
}

/**
 * Injeta o payload JSON fornecido pela LLM nos marcadores invisíveis de slot do template.
 * Cada <!-- SLOT:X --> é substituído pelo respectivo valor de slotValues["X"] (ou chave minúscula/normalizada).
 */
export function fillTemplateSlots(
  templateContent: string,
  slotValues: Record<string, string | string[]>,
  options: SlotInjectionOptions = {}
): string {
  if (!templateContent) return '';

  const cleanUnfilled = options.cleanUnfilledSlots !== false;

  // Normaliza o dicionário de valores para permitir match case-insensitive
  // ex: { formal_definition: "..." } atende tanto <!-- SLOT:FORMAL_DEFINITION --> quanto <!-- SLOT:formal_definition -->
  const normalizedValues = new Map<string, string>();
  for (const [key, rawVal] of Object.entries(slotValues)) {
    const normKey = key.trim().toLowerCase().replace(/[\s\-]+/g, '_');
    let stringVal = '';
    if (Array.isArray(rawVal)) {
      stringVal = rawVal.join('\n');
    } else if (rawVal !== undefined && rawVal !== null) {
      stringVal = String(rawVal);
    }
    normalizedValues.set(normKey, stringVal);
  }

  // Substitui cada marcador <!-- SLOT:NAME -->
  const slotRegex = /<!--\s*SLOT:([a-zA-Z0-9_\-]+)\s*-->/g;

  return templateContent.replace(slotRegex, (fullMatch, slotId) => {
    const normSlotId = slotId.trim().toLowerCase().replace(/[\s\-]+/g, '_');
    const value = normalizedValues.get(normSlotId);

    if (value !== undefined && value.trim() !== '') {
      return value.trim();
    }

    // Se o slot não veio preenchido:
    if (cleanUnfilled) {
      return '';
    }

    return fullMatch;
  });
}
