// packages/web/src/types/api.ts

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ProposalStatus = 'PENDING' | 'APPLIED' | 'REJECTED' | 'STALE';

export type CanonicalNoteArchetype =
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
  | 'field';

export type EpistemicModality =
  | 'inviolable_premise'
  | 'strict'
  | 'defeasible'
  | 'empirical_premise'
  | 'conflict'
  | 'inquiry'
  | 'procedural'
  | 'theory_module';

export interface NoteTypeConfig {
  prefix: string;
  templateFile: string;
  canonicalType: CanonicalNoteArchetype;
  modality: EpistemicModality;
  slotRuleOverrides?: Record<string, string>;
}

export interface VaultConventionsConfig {
  templatesDir: string;
  noteTypes: Record<CanonicalNoteArchetype, NoteTypeConfig>;
}

export interface PartialVaultConventionsConfig {
  templatesDir?: string;
  noteTypes?: Partial<Record<CanonicalNoteArchetype, Partial<NoteTypeConfig>>>;
}

export interface SlotRuleDefinition {
  slotName: string;
  required: boolean;
  isTaxonomyMocSlot?: boolean;
  description: string;
  instructions: string;
  formatHint?: string;
}

export interface NoteSlotContract {
  archetype: CanonicalNoteArchetype;
  displayNamePt: string;
  defaultPrefix: string;
  defaultTemplateFile: string;
  modality: EpistemicModality;
  epistemicSummary: string;
  globalWritingRules: string[];
  slots: SlotRuleDefinition[];
}

export interface ProfileConventionsResponse {
  profileId: string;
  overrides: PartialVaultConventionsConfig | null;
  resolvedConventions: VaultConventionsConfig;
  contracts: Record<CanonicalNoteArchetype, NoteSlotContract>;
}

export interface Profile {
  id: string;
  name: string;
  vaultPath: string;
  model: string;
  apiKey: string | null; // Mascarada pelo daemon
  isActive: boolean;
  conventions?: PartialVaultConventionsConfig | null;
  resolvedConventions?: VaultConventionsConfig;
}

export interface SlashCommandOption {
  id: string;
  archetype: CanonicalNoteArchetype;
  labelPt: string;
  prefix: string;
  templateFile: string;
  modalityLabel: string;
  shortDescription: string;
  badgeColor: string;
  keywords: string[];
}

export const CANONICAL_ARCHETYPE_CATALOG: SlashCommandOption[] = [
  {
    id: 'definition',
    archetype: 'definition',
    labelPt: 'Definição',
    prefix: 'Def - ',
    templateFile: 'Def -.md',
    modalityLabel: 'R_s • Conjunção Semântica Estrita',
    shortDescription: 'Fixação essencial, construtiva, operacional ou nominal por Domínio (A–E).',
    badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800/80',
    keywords: ['def', 'definition', 'definicao', 'definição', 'conceito']
  },
  {
    id: 'axiom',
    archetype: 'axiom',
    labelPt: 'Axioma / Postulado',
    prefix: 'Axiom - ',
    templateFile: 'Axiom -.md',
    modalityLabel: 'K_n • Premissa Básica Inviolável',
    shortDescription: 'Ponto de partida indemonstrável e primitivo de um sistema dedutivo.',
    badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-800/80',
    keywords: ['axiom', 'axioma', 'postulado']
  },
  {
    id: 'theorem',
    archetype: 'theorem',
    labelPt: 'Teorema / Proposição',
    prefix: 'Theo - ',
    templateFile: 'Theo -.md',
    modalityLabel: 'R_s • Dedução Estrita Necessária',
    shortDescription: 'Proposição formal acompanhada de demonstração dedutiva (Q.E.D.) e corolários.',
    badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-800/80',
    keywords: ['theo', 'theorem', 'teorema', 'proposicao', 'proposição', 'lema']
  },
  {
    id: 'conjecture',
    archetype: 'conjecture',
    labelPt: 'Conjectura',
    prefix: 'Conj - ',
    templateFile: 'Conj -.md',
    modalityLabel: 'R_d • Proposição Sob Investigação Formal',
    shortDescription: 'Proposição matemática com evidência formal/computacional sem prova fechada.',
    badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-800/80',
    keywords: ['conj', 'conjecture', 'conjectura']
  },
  {
    id: 'observation',
    archetype: 'observation',
    labelPt: 'Observação / Evidência',
    prefix: 'Obs - ',
    templateFile: 'Obs -.md',
    modalityLabel: 'K_p • Premissa de Fato Empírica',
    shortDescription: 'Registro de medições empíricas, dados experimentais e condições de contorno.',
    badgeColor: 'text-sky-300 bg-sky-950/80 border-sky-800/80',
    keywords: ['obs', 'observation', 'observacao', 'observação', 'evidencia', 'evidência']
  },
  {
    id: 'law',
    archetype: 'law',
    labelPt: 'Lei Empírica',
    prefix: 'Law - ',
    templateFile: 'Law -.md',
    modalityLabel: 'R_d • Princípio Físico / Regra Derrotável',
    shortDescription: 'Relação funcional invariante induzida de observações com limites de validade.',
    badgeColor: 'text-indigo-300 bg-indigo-950/80 border-indigo-800/80',
    keywords: ['law', 'lei', 'principio', 'princípio']
  },
  {
    id: 'hypothesis',
    archetype: 'hypothesis',
    labelPt: 'Hipótese',
    prefix: 'Hyp - ',
    templateFile: 'Hyp -.md',
    modalityLabel: 'R_d • Conjectura Científica Explicativa',
    shortDescription: 'Mecanismo causal proposto com predições falseáveis e experimento crucial.',
    badgeColor: 'text-teal-300 bg-teal-950/80 border-teal-800/80',
    keywords: ['hyp', 'hypothesis', 'hipotese', 'hipótese']
  },
  {
    id: 'thesis',
    archetype: 'thesis',
    labelPt: 'Tese / Doutrina',
    prefix: 'Tese - ',
    templateFile: 'Tese -.md',
    modalityLabel: 'R_d • Asserção Filosófica / Teológica',
    shortDescription: 'Posição doutrinária articulada com silogismos principais e respostas a objeções.',
    badgeColor: 'text-rose-300 bg-rose-950/80 border-rose-800/80',
    keywords: ['tese', 'thesis', 'doutrina']
  },
  {
    id: 'objection',
    archetype: 'objection',
    labelPt: 'Objeção Dialética',
    prefix: 'Obj - ',
    templateFile: 'Obj -.md',
    modalityLabel: 'CA-node • Nó de Conflito Dialético',
    shortDescription: 'Ataque formal (rebutting, undercutting ou undermining) contra tese ou hipótese.',
    badgeColor: 'text-orange-300 bg-orange-950/80 border-orange-800/80',
    keywords: ['obj', 'objection', 'objecao', 'objeção', 'refutacao', 'refutação']
  },
  {
    id: 'quaestio',
    archetype: 'quaestio',
    labelPt: 'Questão / Quaestio',
    prefix: 'Quest - ',
    templateFile: 'Quest -.md',
    modalityLabel: 'IBIS • Inquérito Racional / Síntese',
    shortDescription: 'Investigação comparativa que contrasta conceitos coordenados e sintetiza trade-offs.',
    badgeColor: 'text-violet-300 bg-violet-950/80 border-violet-800/80',
    keywords: ['quest', 'quaestio', 'questao', 'questão', 'pergunta']
  },
  {
    id: 'practical',
    archetype: 'practical',
    labelPt: 'Prático / Operacional',
    prefix: 'Prac - ',
    templateFile: 'Prac -.md',
    modalityLabel: 'Procedural • Conhecimento Operacional',
    shortDescription: 'Diretrizes passo a passo, receitas de engenharia, implementação e armadilhas.',
    badgeColor: 'text-lime-300 bg-lime-950/80 border-lime-800/80',
    keywords: ['prac', 'prat', 'practical', 'pratico', 'prático', 'procedimento']
  },
  {
    id: 'field',
    archetype: 'field',
    labelPt: 'Campo / Área (MOC)',
    prefix: 'Field - ',
    templateFile: 'Field -.md',
    modalityLabel: 'MMT Σ • Teoria Modular / Mapa de Área',
    shortDescription: 'Mapa estrutural de uma área do conhecimento, objeto central, maquinário e subáreas.',
    badgeColor: 'text-yellow-300 bg-yellow-950/80 border-yellow-800/80',
    keywords: ['field', 'campo', 'area', 'área', 'moc']
  }
];

/**
 * Retorna a lista dos 12 tipos canônicos mesclando eventuais prefixos/templates customizados
 * no perfil ativo e filtrando pelo texto digitado após `/`.
 */
export function filterSlashCommands(
  rawInput: string,
  conventions?: VaultConventionsConfig | null
): SlashCommandOption[] {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) return [];

  // Remove a barra inicial e eventual prefixo "create" para permitir filtrar por "/def" ou "/create def"
  const afterSlash = trimmed
    .slice(1)
    .replace(/^create\b/i, '')
    .trim()
    .toLowerCase();

  const mergedCatalog = CANONICAL_ARCHETYPE_CATALOG.map((item) => {
    const custom = conventions?.noteTypes?.[item.archetype];
    return {
      ...item,
      prefix: custom?.prefix || item.prefix,
      templateFile: custom?.templateFile || item.templateFile
    };
  });

  if (!afterSlash) {
    return mergedCatalog;
  }

  return mergedCatalog.filter((item) => {
    if (item.archetype.toLowerCase().includes(afterSlash)) return true;
    if (item.labelPt.toLowerCase().includes(afterSlash)) return true;
    if (item.prefix.toLowerCase().includes(afterSlash)) return true;
    return item.keywords.some((kw) => kw.toLowerCase().includes(afterSlash));
  });
}

/**
 * Constrói o comando `/create` preenchido para um arquétipo e calcula a posição exata do cursor
 * dentro das aspas de `note: ""`.
 */
export function buildSlashCreateCommandSnippet(archetype: CanonicalNoteArchetype): {
  commandText: string;
  cursorOffset: number;
} {
  const prefixPart = '/create note: "';
  const suffixPart = `" type: "${archetype}" field: "[[Field - ]]"`;
  return {
    commandText: `${prefixPart}${suffixPart}`,
    cursorOffset: prefixPart.length
  };
}


export interface Session {
  id: string;
  profileId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  seq: number;
  role: MessageRole;
  content: string;
  toolCalls?: any;
  toolCallId?: string | null;
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
  createdAt: string;
}

export interface Proposal {
  id: string;
  sessionId: string;
  messageId?: string | null;
  notePath: string;
  baseHash: string;
  searchBlock: string;
  replaceBlock: string;
  unifiedDiff: string;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface VaultStats {
  indexedNotes: number;
  lastSyncAt: string | null;
}

export interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  activeProfile: Profile | null;
  vault?: VaultStats | null;
}

// Suporte e configuração de pensamento (Reasoning / Extended Thinking)
export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface ModelReasoningConfig {
  supportedEfforts: ReasoningEffort[];
  defaultEffort: ReasoningEffort;
}

export type ModelServiceId = 'gemini' | 'claude' | 'chatgpt' | 'deepseek_opensource';

export interface ModelServiceCategory {
  id: ModelServiceId;
  name: string;
  tagline: string;
  iconType: 'sparkles' | 'cpu' | 'bot' | 'terminal';
  accentColor: string;
}

export const MODEL_SERVICES: ModelServiceCategory[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    tagline: 'Google DeepMind',
    iconType: 'sparkles',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Anthropic',
    iconType: 'cpu',
    accentColor: 'text-amber-400'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'OpenAI',
    iconType: 'bot',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'deepseek_opensource',
    name: 'DeepSeek & Open Source',
    tagline: 'DeepSeek, Meta & Qwen',
    iconType: 'terminal',
    accentColor: 'text-purple-400'
  }
];

// Modelos curados padrão para alternância rápida na UI
export interface CuratedModel {
  id: string;
  name: string;
  provider: string;
  service: ModelServiceId;
  badge: string;
  description: string;
  contextLength?: string;
  reasoning?: ModelReasoningConfig;
}

export const CURATED_MODELS: CuratedModel[] = [
  // ---- Google (Gemini) ----
  {
    id: 'google/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    service: 'gemini',
    badge: 'Flagship Thinking',
    contextLength: '1M',
    description: 'Estado da arte em velocidade com raciocínio ajustável (Low/Med/High) e enorme janela de 1M tokens.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'google/gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    service: 'gemini',
    badge: 'Thinking Rápido',
    contextLength: '1M',
    description: 'Excelente equilíbrio de agilidade, raciocínio deliberativo e baixo custo.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    service: 'gemini',
    badge: 'Raciocínio Profundo',
    contextLength: '2M',
    description: 'Capacidade analítica máxima para sínteses de múltiplos documentos e notas densas (2M de contexto).',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    service: 'gemini',
    badge: 'Ultrarrápido',
    contextLength: '1M',
    description: 'Ideal para o dia a dia, buscas instantâneas e navegação rápida no grafo do cofre.'
  },

  // ---- Anthropic (Claude) ----
  {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    service: 'claude',
    badge: 'Flagship Reasoning',
    contextLength: '200k',
    description: 'Nova geração líder em precisão de escrita Markdown, raciocínio ajustável e rigor conceitual.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'high'
    }
  },
  {
    id: 'anthropic/claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    provider: 'Anthropic',
    service: 'claude',
    badge: 'Haiku Thinking',
    contextLength: '200k',
    description: 'Velocidade extrema combinada com suporte a raciocínio rápido para triagem e conexões.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    service: 'claude',
    badge: 'Síntese Consagrada',
    contextLength: '200k',
    description: 'Modelo altamente refinado para estruturação de notas atômicas e Maps of Content (MoC).',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    service: 'claude',
    badge: 'Analítico Profundo',
    contextLength: '200k',
    description: 'Poder analítico profundo para deduções lógicas complexas e categorizações taxonômicas.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'high'
    }
  },

  // ---- OpenAI (ChatGPT) ----
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    service: 'chatgpt',
    badge: 'Nova Geração / Reasoning',
    contextLength: '128k',
    description: 'Novo modelo compacto com raciocínio balanceado e excelente inteligência geral.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'openai/o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    service: 'chatgpt',
    badge: 'Raciocínio Lógico',
    contextLength: '128k',
    description: 'Especialista em lógica rigorosa, matemática e estruturação formal de notas técnicas.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    }
  },
  {
    id: 'openai/o1',
    name: 'o1',
    provider: 'OpenAI',
    service: 'chatgpt',
    badge: 'Deliberação Profunda',
    contextLength: '200k',
    description: 'Modelo emblemático de pensamento deliberativo para problemas conceituais desafiadores.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'high'
    }
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    service: 'chatgpt',
    badge: 'Multimodal Flagship',
    contextLength: '128k',
    description: 'Modelo versátil de alta capacidade para conversação fluida e análise ampla.'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    service: 'chatgpt',
    badge: 'Econômico',
    contextLength: '128k',
    description: 'Leve, ágil e muito barato para edições simples e conferência de texto.'
  },

  // ---- DeepSeek & Open Source ----
  {
    id: 'deepseek/deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'DeepSeek',
    service: 'deepseek_opensource',
    badge: 'V4.1 Thinking',
    contextLength: '128k',
    description: 'Alta inteligência geral com raciocínio deliberativo ajustável de altíssimo custo-benefício.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'high'
    }
  },
  {
    id: 'deepseek/deepseek-r1-0528',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    service: 'deepseek_opensource',
    badge: 'Open Reasoning',
    contextLength: '64k',
    description: 'Modelo open-weights de raciocínio profundo focado em matemática e algoritmos.',
    reasoning: {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'high'
    }
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    service: 'deepseek_opensource',
    badge: 'Rápido & Inteligente',
    contextLength: '64k',
    description: 'Excelente para código e estruturação de texto direto sem latência de pensamento.'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    service: 'deepseek_opensource',
    badge: 'Open Weights Flagship',
    contextLength: '128k',
    description: 'O modelo open-weights mais consagrado da Meta, confiável e consistente.'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    service: 'deepseek_opensource',
    badge: 'Multilíngue',
    contextLength: '128k',
    description: 'Excepcional para tarefas em português, raciocínio estruturado e taxonomia de notas.'
  }
];

export function getModelReasoningConfig(modelId: string): ModelReasoningConfig | null {
  const found = CURATED_MODELS.find((m) => m.id === modelId);
  if (found?.reasoning) return found.reasoning;
  const lower = (modelId || '').toLowerCase();
  if (
    lower.includes('gemini-3.8') ||
    lower.includes('gemini-3.5') ||
    lower.includes('gemini-2.5-pro') ||
    lower.includes('gemini-4') ||
    lower.includes('o3-mini') ||
    lower.includes('o1') ||
    lower.includes('o4') ||
    lower.includes('deepseek-r1') ||
    lower.includes('deepseek-v4') ||
    lower.includes('claude-sonnet-5') ||
    lower.includes('claude-haiku-5') ||
    lower.includes('claude-3.7-sonnet') ||
    lower.includes('thinking')
  ) {
    return {
      supportedEfforts: ['low', 'medium', 'high'],
      defaultEffort: 'medium'
    };
  }
  return null;
}

// Eventos emitidos via SSE na rota /api/chat
export interface SSEEventMap {
  session: { sessionId: string; isNew: boolean };
  token: { text: string };
  tool_start: { tool: string; args: any };
  tool_end: { tool: string; isSuccess: boolean; error?: string };
  proposal: Proposal;
  done: { sessionId: string };
  error: { message: string };
}
