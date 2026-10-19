// packages/web/src/types/api.ts

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ProposalStatus = 'PENDING' | 'APPLIED' | 'REJECTED' | 'STALE';

export interface Profile {
  id: string;
  name: string;
  vaultPath: string;
  model: string;
  apiKey: string | null; // Mascarada pelo daemon
  isActive: boolean;
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
