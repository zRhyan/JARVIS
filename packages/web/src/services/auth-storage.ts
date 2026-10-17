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
  const storage = getStorage();

  // 1. Injeção direta pelo Daemon via window.__JARVIS_BOOTSTRAP_TOKEN__
  if (typeof window !== 'undefined') {
    const bootstrapToken = (window as any).__JARVIS_BOOTSTRAP_TOKEN__;
    if (typeof bootstrapToken === 'string' && bootstrapToken.trim()) {
      const cleanToken = bootstrapToken.trim();
      if (storage) {
        storage.setItem(TOKEN_KEY, cleanToken);
      }
      return cleanToken;
    }
  }

  // 2. Passagem opcional via Query Param (?token=...)
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken && urlToken.trim()) {
        const cleanToken = urlToken.trim();
        if (storage) {
          storage.setItem(TOKEN_KEY, cleanToken);
        }
        // Remove o token da URL para não poluir a barra de navegação
        params.delete('token');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        return cleanToken;
      }
    } catch {
      // Ignora erro de parsing em ambientes sem URLSearchParams
    }
  }

  // 3. Tenta recuperar do localStorage (se disponível no ambiente)
  if (storage) {
    const saved = storage.getItem(TOKEN_KEY);
    if (saved && saved.trim()) return saved.trim();
  }

  // 4. Fallback de desenvolvimento configurado via .env (VITE_JARVIS_TOKEN)
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
