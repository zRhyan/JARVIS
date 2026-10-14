import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import type { Profile, VaultStats } from '../types/api';

export interface DaemonHealthState {
  isOnline: boolean;
  isLoading: boolean;
  uptimeSeconds: number;
  activeProfile: Profile | null;
  vaultStats: VaultStats | null;
  error: string | null;
  checkHealth: () => Promise<void>;
}

export function useDaemonHealth(pollIntervalMs = 6000): DaemonHealthState {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await apiClient.getHealth();
      setIsOnline(true);
      setUptimeSeconds(res.uptimeSeconds);
      setActiveProfile(res.activeProfile);
      setVaultStats(res.vault ?? null);
      setError(null);
    } catch (err: any) {
      setIsOnline(false);
      setError(err.message || 'Daemon inacessível');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, pollIntervalMs]);

  return {
    isOnline,
    isLoading,
    uptimeSeconds,
    activeProfile,
    vaultStats,
    error,
    checkHealth
  };
}
