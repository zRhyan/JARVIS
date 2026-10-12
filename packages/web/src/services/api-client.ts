// packages/web/src/services/api-client.ts

import type { HealthResponse, Profile, Session, Message, Proposal, ProposalStatus } from '../types/api';
import { getAuthToken } from './auth-storage';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, errorMsg);
  }

  return data as T;
}

export const apiClient = {
  // Health
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health');
  },

  // Perfis
  async getProfiles(): Promise<{ profiles: Profile[] }> {
    return request<{ profiles: Profile[] }>('/api/profiles');
  },

  async createProfile(data: { id?: string; name: string; vaultPath: string; model: string; apiKey?: string }): Promise<Profile> {
    return request<Profile>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async activateProfile(id: string): Promise<{ activeProfile: Profile; indexedNotes: number }> {
    return request<{ activeProfile: Profile; indexedNotes: number }>(`/api/profiles/${encodeURIComponent(id)}/activate`, {
      method: 'POST'
    });
  },

  async updateProfile(id: string, patch: { name?: string; vaultPath?: string; model?: string; apiKey?: string }): Promise<Profile> {
    return request<Profile>(`/api/profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },

  // Sessões
  async getSessions(limit = 50, offset = 0): Promise<{ sessions: Session[] }> {
    return request<{ sessions: Session[] }>(`/api/sessions?limit=${limit}&offset=${offset}`);
  },

  async createSession(title?: string): Promise<Session> {
    return request<Session>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(title ? { title } : {})
    });
  },

  async getSession(id: string): Promise<{ session: Session; messages: Message[] }> {
    return request<{ session: Session; messages: Message[] }>(`/api/sessions/${encodeURIComponent(id)}`);
  },

  async deleteSession(id: string): Promise<void> {
    return request<void>(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Propostas
  async getProposals(params?: { status?: ProposalStatus; sessionId?: string }): Promise<{ proposals: Proposal[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ proposals: Proposal[] }>(`/api/proposals${qs}`);
  },

  async approveProposal(id: string): Promise<{ proposal: Proposal }> {
    return request<{ proposal: Proposal }>(`/api/proposals/${encodeURIComponent(id)}/approve`, {
      method: 'POST'
    });
  },

  async rejectProposal(id: string): Promise<{ proposal: Proposal }> {
    return request<{ proposal: Proposal }>(`/api/proposals/${encodeURIComponent(id)}/reject`, {
      method: 'POST'
    });
  }
};
