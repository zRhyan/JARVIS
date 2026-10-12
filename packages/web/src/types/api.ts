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
  notePath: string;
  baseHash: string;
  searchBlock: string;
  replaceBlock: string;
  unifiedDiff: string;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  activeProfile: Profile | null;
}

// Modelos curados padrão para alternância rápida na UI
export interface CuratedModel {
  id: string;
  name: string;
  provider: string;
  badge: 'Flash' | 'Haiku' | 'Flagship' | 'Reasoning';
  description: string;
}

export const CURATED_MODELS: CuratedModel[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Flash',
    description: 'Extremamente veloz e com ampla janela de contexto.'
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Haiku',
    description: 'Excelente custo-benefício e resposta rápida.'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Flagship',
    description: 'Referência em raciocínio, escrita e seguimento estrito de regras.'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'Flagship',
    description: 'Modelo versátil de alta capacidade multimodal.'
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
