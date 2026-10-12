// packages/web/src/hooks/useProfiles.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import type { Profile } from '../types/api';

export interface UseProfilesResult {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfiles: () => Promise<void>;
  activateProfile: (id: string) => Promise<void>;
  setDefaultModel: (profileId: string, model: string) => Promise<void>;
  createProfile: (data: { id?: string; name: string; vaultPath: string; model: string; apiKey?: string }) => Promise<Profile>;
}

export function useProfiles(): UseProfilesResult {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getProfiles();
      setProfiles(res.profiles);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar perfis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const activeProfile = profiles.find((p) => p.isActive) ?? null;

  const activateProfile = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.activateProfile(id);
      await refreshProfiles();
    } catch (err: any) {
      setError(err.message || 'Falha ao ativar perfil');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfiles]);

  const setDefaultModel = useCallback(async (profileId: string, model: string) => {
    try {
      await apiClient.updateProfile(profileId, { model });
      await refreshProfiles();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar modelo padrão');
      throw err;
    }
  }, [refreshProfiles]);

  const createProfile = useCallback(async (data: { id?: string; name: string; vaultPath: string; model: string; apiKey?: string }) => {
    setIsLoading(true);
    try {
      const created = await apiClient.createProfile(data);
      await refreshProfiles();
      return created;
    } catch (err: any) {
      setError(err.message || 'Falha ao criar perfil');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfiles]);

  return {
    profiles,
    activeProfile,
    isLoading,
    error,
    refreshProfiles,
    activateProfile,
    setDefaultModel,
    createProfile
  };
}
