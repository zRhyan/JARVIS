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

// Modelos curados padrão para alternância rápida na UI
export interface CuratedModel {
  id: string;
  name: string;
  provider: string;
  badge: 'Flash' | 'Haiku' | 'Flagship' | 'Reasoning' | 'Fast' | 'Open Source' | string;
  description: string;
}

export const CURATED_MODELS: CuratedModel[] = [
  {
    id: 'google/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    badge: 'Nova Geração / Thinking',
    description: 'Estado da arte em velocidade, raciocínio ajustável (low/med/high) e 1M de contexto.'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Flash',
    description: 'Extremamente rápido, ideal para o dia a dia e com enorme janela de contexto.'
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    badge: 'Econômico',
    description: 'Excelente equilíbrio de velocidade, custo mínimo e raciocínio ágil.'
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Haiku',
    description: 'Muito ágil, preciso na sintaxe Markdown e seguimento de convenções.'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Flagship',
    description: 'Líder em raciocínio analítico, síntese profunda e qualidade de escrita.'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Rápido',
    description: 'Compacto, barato e com ótima velocidade de processamento.'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'Flagship',
    description: 'Modelo versátil de alta capacidade multimodal.'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'Poderoso',
    description: 'Alta inteligência geral e excelente compreensão de código e lógica.'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    badge: 'Open Source',
    description: 'Excelente para tarefas multilíngues (português/inglês) e raciocínio estruturado.'
  }
];

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
