// packages/web/src/hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api-client';
import { sendChatMessageStream } from '../services/sse-client';
import type { Message, Proposal } from '../types/api';

export interface ActiveToolInfo {
  id: string;
  tool: string;
  args: any;
  isDone?: boolean;
  isSuccess?: boolean;
  error?: string;
}

export interface UseChatOptions {
  sessionId: string | null;
  onSessionCreated?: (sessionId: string) => void;
  onSessionUpdated?: () => void;
}

export interface UseChatResult {
  messages: Message[];
  proposals: Proposal[];
  activeTools: ActiveToolInfo[];
  isStreaming: boolean;
  isLoadingSession: boolean;
  error: string | null;
  sendMessage: (text: string, modelOverride?: string) => Promise<void>;
  approveProposal: (proposalId: string) => Promise<Proposal>;
  rejectProposal: (proposalId: string) => Promise<Proposal>;
  abortStream: () => void;
  reloadSession: (targetId?: string) => Promise<void>;
}

export function useChat({ sessionId, onSessionCreated, onSessionUpdated }: UseChatOptions): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTools, setActiveTools] = useState<ActiveToolInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamingSessionIdRef = useRef<string | null>(null);

  const loadSession = useCallback(async (targetId: string) => {
    setIsLoadingSession(true);
    try {
      const [sessionData, proposalsData] = await Promise.all([
        apiClient.getSession(targetId),
        apiClient.getProposals({ sessionId: targetId })
      ]);
      setMessages(sessionData.messages);
      setProposals(proposalsData.proposals);
      setActiveTools([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar mensagens da sessão');
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  const reloadSession = useCallback(async (targetId?: string) => {
    const idToLoad = targetId || sessionId;
    if (idToLoad) {
      await loadSession(idToLoad);
    }
  }, [sessionId, loadSession]);

  // Carrega histórico quando sessionId mudar
  useEffect(() => {
    // Se a sessão que mudou for a que este stream acabou de criar e ainda está processando, não limpa nem busca da API prematuramente
    if (currentStreamingSessionIdRef.current && currentStreamingSessionIdRef.current === sessionId) {
      return;
    }

    if (!sessionId) {
      setMessages([]);
      setProposals([]);
      setActiveTools([]);
      setError(null);
      return;
    }

    loadSession(sessionId);
  }, [sessionId, loadSession]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      currentStreamingSessionIdRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, modelOverride?: string) => {
      if (!text.trim() || isStreaming) return;

      setError(null);
      setIsStreaming(true);
      setActiveTools([]);

      const userMessageId = `temp-user-${Date.now()}`;
      const assistantMessageId = `temp-assistant-${Date.now()}`;

      const userMessage: Message = {
        id: userMessageId,
        sessionId: sessionId || 'pending',
        seq: messages.length + 1,
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString()
      };

      const pendingAssistantMessage: Message = {
        id: assistantMessageId,
        sessionId: sessionId || 'pending',
        seq: messages.length + 2,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await sendChatMessageStream(
          {
            message: text.trim(),
            sessionId: sessionId || undefined,
            model: modelOverride,
            signal: controller.signal
          },
          {
            onSession: (data) => {
              currentStreamingSessionIdRef.current = data.sessionId;
              if (data.isNew && onSessionCreated) {
                onSessionCreated(data.sessionId);
              }
            },
            onToken: (chunk) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              );
            },
            onToolStart: (tool, args) => {
              const toolItem: ActiveToolInfo = {
                id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                tool,
                args,
                isDone: false
              };
              setActiveTools((prev) => [...prev, toolItem]);
            },
            onToolEnd: (tool, isSuccess, toolError) => {
              setActiveTools((prev) =>
                prev.map((t) =>
                  t.tool === tool && !t.isDone
                    ? { ...t, isDone: true, isSuccess, error: toolError }
                    : t
                )
              );
            },
            onProposal: (newProposal) => {
              setProposals((prev) => {
                const filtered = prev.filter((p) => p.id !== newProposal.id);
                return [...filtered, newProposal];
              });
            },
            onDone: async (finalSessionId) => {
              setIsStreaming(false);
              const targetId = finalSessionId || currentStreamingSessionIdRef.current || sessionId;
              currentStreamingSessionIdRef.current = null;
              onSessionUpdated?.();

              // Sincroniza estado final persistido no SQLite
              if (targetId) {
                try {
                  const [sessionData, proposalsData] = await Promise.all([
                    apiClient.getSession(targetId),
                    apiClient.getProposals({ sessionId: targetId })
                  ]);
                  setMessages(sessionData.messages);
                  setProposals(proposalsData.proposals);
                } catch {
                  // Silently keep current in-memory messages if sync fails
                }
              }
            },
            onError: (err) => {
              const errMsg = err.message || 'Erro durante a geração';
              setError(errMsg);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId && !m.content
                    ? { ...m, content: `⚠️ **Ocorreu um erro ao processar sua solicitação:** ${errMsg}` }
                    : m
                )
              );
              setIsStreaming(false);
              currentStreamingSessionIdRef.current = null;
            }
          }
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          const errMsg = err.message || 'Erro ao enviar mensagem';
          setError(errMsg);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId && !m.content
                ? { ...m, content: `⚠️ **Ocorreu um erro ao enviar mensagem:** ${errMsg}` }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, isStreaming, messages.length, onSessionCreated, onSessionUpdated]
  );

  const approveProposal = useCallback(
    async (proposalId: string): Promise<Proposal> => {
      try {
        const res = await apiClient.approveProposal(proposalId);
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? res.proposal : p))
        );
        return res.proposal;
      } catch (err: any) {
        // Se deu erro de STALE ou conflito, recarrega a proposta
        const updated = await apiClient.getProposals({ sessionId: sessionId || undefined });
        const found = updated.proposals.find((p) => p.id === proposalId);
        if (found) {
          setProposals((prev) =>
            prev.map((p) => (p.id === proposalId ? found : p))
          );
        }
        setError(err.message || 'Falha ao aprovar proposta');
        throw err;
      }
    },
    [sessionId]
  );

  const rejectProposal = useCallback(
    async (proposalId: string): Promise<Proposal> => {
      try {
        const res = await apiClient.rejectProposal(proposalId);
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? res.proposal : p))
        );
        return res.proposal;
      } catch (err: any) {
        setError(err.message || 'Falha ao rejeitar proposta');
        throw err;
      }
    },
    []
  );

  return {
    messages,
    proposals,
    activeTools,
    isStreaming,
    isLoadingSession,
    error,
    sendMessage,
    approveProposal,
    rejectProposal,
    abortStream,
    reloadSession
  };
}
