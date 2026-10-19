import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getAuthToken, setAuthToken, clearAuthToken, hasAuthToken } from '../src/services/auth-storage';
import { sendChatMessageStream } from '../src/services/sse-client';

describe('Auth Storage Service', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
      key: (_i: number) => null,
      length: 0
    };
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve armazenar e recuperar token corretamente', () => {
    expect(hasAuthToken()).toBe(false);
    setAuthToken('test-secret-token-123');
    expect(hasAuthToken()).toBe(true);
    expect(getAuthToken()).toBe('test-secret-token-123');
  });

  it('deve limpar o token armazenado', () => {
    setAuthToken('another-token');
    clearAuthToken();
    expect(hasAuthToken()).toBe(false);
    expect(getAuthToken()).toBe('');
  });

  it('deve capturar token injetado via window.__JARVIS_BOOTSTRAP_TOKEN__', () => {
    (window as any).__JARVIS_BOOTSTRAP_TOKEN__ = 'bootstrap-token-999';
    expect(getAuthToken()).toBe('bootstrap-token-999');
    expect(mockStore['jarvis_auth_token']).toBe('bootstrap-token-999');
  });

  it('deve capturar token fornecido via query param ?token= e limpar da URL', () => {
    const replaceStateMock = vi.fn();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => mockStore[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStore[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStore[k];
        }
      },
      location: {
        search: '?token=query-token-777&other=1',
        pathname: '/',
        hash: ''
      },
      history: {
        replaceState: replaceStateMock
      }
    });

    expect(getAuthToken()).toBe('query-token-777');
    expect(mockStore['jarvis_auth_token']).toBe('query-token-777');
    expect(replaceStateMock).toHaveBeenCalledWith({}, '', '/?other=1');
  });
});

describe('SSE Client Service', () => {
  it('deve decodificar chunks e disparar callbacks corretamente', async () => {
    const ssePayload =
      'event: session\ndata: {"sessionId":"sess-1","isNew":true}\n\n' +
      'event: token\ndata: {"text":"Olá "}\n\n' +
      'event: token\ndata: {"text":"mundo!"}\n\n' +
      'event: done\ndata: {"sessionId":"sess-1"}\n\n';

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(ssePayload));
          controller.close();
        }
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    );

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const tokens: string[] = [];
    let receivedSessionId = '';
    let isDone = false;

    await sendChatMessageStream(
      { message: 'teste' },
      {
        onSession: (data) => {
          receivedSessionId = data.sessionId;
        },
        onToken: (text) => {
          tokens.push(text);
        },
        onDone: (sid) => {
          isDone = true;
          expect(sid).toBe('sess-1');
        }
      }
    );

    expect(receivedSessionId).toBe('sess-1');
    expect(tokens.join('')).toBe('Olá mundo!');
    expect(isDone).toBe(true);

    vi.unstubAllGlobals();
  });
});

describe('Sound FX Service', () => {
  it('deve alternar status de som e persistir no storage', async () => {
    const { soundFX } = await import('../src/services/sound-effects');
    expect(soundFX.isSoundEnabled()).toBe(true);
    soundFX.setSoundEnabled(false);
    expect(soundFX.isSoundEnabled()).toBe(false);
    soundFX.setSoundEnabled(true);
    expect(soundFX.isSoundEnabled()).toBe(true);
  });

  it('não deve falhar ao disparar sons mesmo sem AudioContext completo no ambiente de teste', async () => {
    const { soundFX } = await import('../src/services/sound-effects');
    expect(() => {
      soundFX.playReactorHum();
      soundFX.playDiagnosticChirp();
      soundFX.playTeletypeClick();
      soundFX.playTransitionWhoosh();
    }).not.toThrow();
  });
});

describe('Intro Config Service', () => {
  it('deve respeitar as configurações de frequência de introdução', async () => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
      key: () => null,
      length: 0
    };
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });

    const { getIntroFrequency, setIntroFrequency, shouldShowIntro, markIntroShownToday } = await import('../src/services/intro-config');

    // Padrão
    expect(getIntroFrequency()).toBe('once_per_day');

    // Configuração never
    setIntroFrequency('never');
    expect(shouldShowIntro()).toBe(false);

    // Configuração always
    setIntroFrequency('always');
    expect(shouldShowIntro()).toBe(true);

    // Configuração once_per_day
    setIntroFrequency('once_per_day');
    markIntroShownToday();
    // Como foi marcado hoje, não deve exibir novamente hoje
    expect(shouldShowIntro()).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe('API Client pickFolder', () => {
  it('deve chamar /api/system/pick-folder via POST e retornar o caminho', async () => {
    const mockResponse = { path: '/home/usuario/Obsidian/MeuCofre' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse)
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiClient } = await import('../src/services/api-client');
    const result = await apiClient.pickFolder();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/system/pick-folder',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.path).toBe('/home/usuario/Obsidian/MeuCofre');

    vi.unstubAllGlobals();
  });
});
