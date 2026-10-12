// packages/web/src/hooks/useSessions.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import type { Session } from '../types/api';

export interface UseSessionsResult {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (id: string | null) => void;
  createSession: (title?: string) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export function useSessions(activeProfileId?: string): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getSessions();
      setSessions(res.sessions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar sessões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recarrega sessões quando o perfil ativo muda
  useEffect(() => {
    refreshSessions();
  }, [activeProfileId, refreshSessions]);

  const selectSession = useCallback((id: string | null) => {
    setActiveSessionId(id);
  }, []);

  const createSession = useCallback(async (title?: string): Promise<Session> => {
    setIsLoading(true);
    try {
      const created = await apiClient.createSession(title);
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      return created;
    } catch (err: any) {
      setError(err.message || 'Falha ao criar sessão');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setActiveSessionId((current) => (current === id ? null : current));
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir sessão');
      throw err;
    }
  }, []);

  return {
    sessions,
    activeSessionId,
    isLoading,
    error,
    selectSession,
    createSession,
    deleteSession,
    refreshSessions
  };
}
