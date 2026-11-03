import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CANONICAL_ARCHETYPE_CATALOG,
  filterSlashCommands,
  buildSlashCreateCommandSnippet,
  type VaultConventionsConfig
} from '../src/types/api';
import { apiClient } from '../src/services/api-client';

describe('Etapa 6 — Slash Command Autocomplete & Profile Conventions Client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve listar todos os 12 arquétipos canônicos quando o usuário digita "/" ou "/create"', () => {
    expect(CANONICAL_ARCHETYPE_CATALOG).toHaveLength(12);

    const allFromSlash = filterSlashCommands('/');
    expect(allFromSlash).toHaveLength(12);

    const allFromCreate = filterSlashCommands('/create ');
    expect(allFromCreate).toHaveLength(12);

    expect(filterSlashCommands('texto normal sem barra')).toHaveLength(0);
  });

  it('deve filtrar os arquétipos por nome, keyword ou prefixo customizado do perfil', () => {
    const defMatches = filterSlashCommands('/def');
    expect(defMatches.some((m) => m.archetype === 'definition')).toBe(true);

    const questMatches = filterSlashCommands('/create quaestio');
    expect(questMatches).toHaveLength(1);
    expect(questMatches[0].archetype).toBe('quaestio');

    // Simula override de prefixo no perfil ativo (ex: "Prat - " para practical)
    const customConventions = {
      templatesDir: 'Custom Templates',
      noteTypes: {
        practical: {
          prefix: 'Receita - ',
          templateFile: 'Receita -.md',
          canonicalType: 'practical',
          modality: 'procedural'
        }
      }
    } as unknown as VaultConventionsConfig;

    const customMatches = filterSlashCommands('/receita', customConventions);
    expect(customMatches).toHaveLength(1);
    expect(customMatches[0].archetype).toBe('practical');
    expect(customMatches[0].prefix).toBe('Receita - ');
    expect(customMatches[0].templateFile).toBe('Receita -.md');
  });

  it('deve gerar o comando /create com o cursor posicionado exatamente entre as aspas de note: ""', () => {
    const { commandText, cursorOffset } = buildSlashCreateCommandSnippet('theorem');
    expect(commandText).toBe('/create note: "" type: "theorem" field: "[[Field - ]]"');
    expect(commandText.slice(0, cursorOffset)).toBe('/create note: "');
    expect(commandText.slice(cursorOffset)).toBe('" type: "theorem" field: "[[Field - ]]"');
  });

  it('deve consultar e atualizar convenções do perfil via GET e PUT /api/profiles/:id/conventions', async () => {
    const mockPayload = {
      profileId: 'prof-1',
      overrides: { templatesDir: '7 - Templates' },
      resolvedConventions: { templatesDir: '7 - Templates', noteTypes: {} },
      contracts: {}
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockPayload)
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => 'token-123',
        setItem: () => {},
        removeItem: () => {}
      }
    });

    const getRes = await apiClient.getProfileConventions('prof-1');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/prof-1/conventions',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect(getRes.profileId).toBe('prof-1');

    const putRes = await apiClient.updateProfileConventions('prof-1', {
      templatesDir: 'Meus Templates'
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/prof-1/conventions',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ conventions: { templatesDir: 'Meus Templates' } })
      })
    );
    expect(putRes.profileId).toBe('prof-1');
  });
});
