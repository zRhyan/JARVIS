// packages/web/src/services/sse-client.ts

import type { Proposal } from '../types/api';
import { getAuthToken } from './auth-storage';
import { ApiError } from './api-client';

export interface ChatStreamCallbacks {
  onSession?: (data: { sessionId: string; isNew: boolean }) => void;
  onToken?: (text: string) => void;
  onToolStart?: (tool: string, args: any) => void;
  onToolEnd?: (tool: string, isSuccess: boolean, error?: string) => void;
  onProposal?: (proposal: Proposal) => void;
  onDone?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface SendMessageOptions {
  message: string;
  sessionId?: string;
  model?: string;
  signal?: AbortSignal;
}

export async function sendChatMessageStream(
  options: SendMessageOptions,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: options.message,
      sessionId: options.sessionId,
      model: options.model
    }),
    signal: options.signal
  });

  if (!response.ok) {
    let errorMsg = `Erro ${response.status}: ${response.statusText}`;
    try {
      const json = await response.json();
      if (json.error) errorMsg = json.error;
    } catch {
      // ignore
    }
    const err = new ApiError(response.status, errorMsg);
    callbacks.onError?.(err);
    throw err;
  }

  if (!response.body) {
    const err = new Error('Corpo de resposta de stream SSE vazio.');
    callbacks.onError?.(err);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split('\n\n');
      // O último elemento pode estar incompleto e permanece no buffer
      buffer = messages.pop() ?? '';

      for (const rawMsg of messages) {
        if (!rawMsg.trim()) continue;
        const lines = rawMsg.split('\n');
        let currentEvent = 'message';
        let dataString = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace(/^event:\s*/, '').trim();
          } else if (line.startsWith('data:')) {
            dataString = line.replace(/^data:\s*/, '').trim();
          }
        }

        if (!dataString) continue;

        try {
          const parsedData = JSON.parse(dataString);

          switch (currentEvent) {
            case 'session':
              callbacks.onSession?.(parsedData);
              break;
            case 'token':
              if (parsedData.text) callbacks.onToken?.(parsedData.text);
              break;
            case 'tool_start':
              callbacks.onToolStart?.(parsedData.tool, parsedData.args);
              break;
            case 'tool_end':
              callbacks.onToolEnd?.(parsedData.tool, parsedData.isSuccess, parsedData.error);
              break;
            case 'proposal':
              callbacks.onProposal?.(parsedData);
              break;
            case 'done':
              callbacks.onDone?.(parsedData.sessionId);
              break;
            case 'error':
              callbacks.onError?.(new Error(parsedData.message || 'Erro durante a inferência do agente.'));
              break;
            default:
              break;
          }
        } catch (parseError: any) {
          console.warn('[SSE] Falha ao fazer parse do payload SSE:', dataString, parseError);
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return; // Cancelamento intencional
    }
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}
