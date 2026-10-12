// packages/web/src/services/auth-storage.ts

const TOKEN_KEY = 'jarvis_auth_token';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Ignore restricted storage environments
  }
  return null;
}

export function getAuthToken(): string {
  // 1. Tenta recuperar do localStorage (se disponível no ambiente)
  const storage = getStorage();
  if (storage) {
    const saved = storage.getItem(TOKEN_KEY);
    if (saved && saved.trim()) return saved.trim();
  }

  // 2. Fallback de desenvolvimento configurado via .env (VITE_JARVIS_TOKEN)
  try {
    const envToken = import.meta.env?.VITE_JARVIS_TOKEN;
    if (typeof envToken === 'string' && envToken.trim()) {
      return envToken.trim();
    }
  } catch {
    // ignore
  }

  return '';
}

export function setAuthToken(token: string): void {
  const storage = getStorage();
  if (!storage) return;

  if (token && token.trim()) {
    storage.setItem(TOKEN_KEY, token.trim());
  } else {
    clearAuthToken();
  }
}

export function clearAuthToken(): void {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(TOKEN_KEY);
  }
}

export function hasAuthToken(): boolean {
  return getAuthToken().length > 0;
}
