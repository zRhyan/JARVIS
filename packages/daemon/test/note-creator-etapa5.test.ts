// packages/daemon/test/note-creator-etapa5.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/db.js';
import { buildServer, type AgentLike } from '../src/server.js';
import { initVaultContext } from '../src/vault-context.js';
import { ToolExecutor } from '../src/tool-executor.js';
import { parseCreateCommand } from '../src/note-creator.js';
import { parseEpistemicHeader } from '@jarvis/core';

const TEST_TOKEN = 'test-token-etapa5-1234567890';
const AUTH = { authorization: `Bearer ${TEST_TOKEN}` };

describe('Etapa 5 (RFC-008): Pipeline Single-Roundtrip /create, create_note_from_template & Convenções por Perfil', () => {
  let tmpVault: string;

  beforeEach(() => {
    tmpVault = mkdtempSync(join(tmpdir(), 'jarvis-etapa5-vault-'));
    mkdirSync(join(tmpVault, '1 - Fields'), { recursive: true });
    mkdirSync(join(tmpVault, '6 - Main Notes'), { recursive: true });
    mkdirSync(join(tmpVault, '7 - Templates'), { recursive: true });

    // Cria o template físico real Def -.md no cofre de teste
    writeFileSync(
      join(tmpVault, '7 - Templates', 'Def -.md'),
      [
        '#review #difficulty',
        '<!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250-->',
        '{{date}} {{time}}',
        '',
        'Status: <!-- SLOT:STATUS -->',
        '',
        '---',
        '',
        '## Map of Content / Tags:',
        '',
        '- **Domain Fields**: <!-- SLOT:MOC_DOMAIN_FIELDS -->',
        '',
        '- Concept Taxonomy:',
        '\t- **Presupposed Concept**:',
        '<!-- SLOT:MOC_PRESUPPOSED -->',
        '\t- **Coordinate Concepts**:',
        '<!-- SLOT:MOC_COORDINATE -->',
        '\t- **Derived Concepts**:',
        '<!-- SLOT:MOC_DERIVED -->',
        '',
        '- **Related**:',
        '<!-- SLOT:MOC_RELATED -->',
        '',
        '---',
        '---',
        '',
        '## 1. Definição',
        '',
        '> [!abstract]- Metadados & Taxonomia',
        '> - **Domínio:** <!-- SLOT:META_DOMINIO -->',
        '> - **Tipo:** <!-- SLOT:META_TIPO -->',
        '> - **Status:** <!-- SLOT:META_STATUS -->',
        '> - **Distinguo:** <!-- SLOT:META_DISTINGUO -->',
        '',
        '> [!def] Definição 1 — <!-- SLOT:CONCEITO_NOME -->',
        '> <!-- SLOT:DEFINICAO_ENUNCIADO -->',
        '> ',
        '> ---',
        '> **Decomposição Analítica:**',
        '> <!-- SLOT:DECOMPOSICAO_ANALITICA -->',
        '',
        '---',
        '',
        '## 2. Taxonomia & Linhagem Ontológica',
        '',
        '- **Hiperônimo (Gênero Superior):** <!-- SLOT:TAXONOMIA_HIPERONIMO -->',
        '- **Parâmetros Livres (Eixos de Determinação):**',
        '<!-- SLOT:TAXONOMIA_PARAMETROS_LIVRES -->',
        '- **Hipônimos (Espécies Derivadas por Restrição de Parâmetro):**',
        '<!-- SLOT:TAXONOMIA_HIPONIMOS -->',
        '- **Fronteira Coordenada (Irmãos de Gênero & Critério de Corte):**',
        '<!-- SLOT:TAXONOMIA_FRONTEIRA_COORDENADA -->',
        '',
        '```mermaid',
        '<!-- SLOT:TAXONOMIA_MERMAID -->',
        '```',
        '',
        '---',
        '',
        '## 3. Instanciações & Casos de Teste',
        '',
        '- **Exemplar Canônico:** <!-- SLOT:INSTANCIACAO_EXEMPLAR -->',
        '- **Não-Exemplo Limítrofe (*Counter-model*):** <!-- SLOT:INSTANCIACAO_NAO_EXEMPLO -->',
        '',
        '---',
        '---',
        '',
        '## Modificar',
        '',
        '- ',
        '',
        '---',
        '',
        '## References:',
        '',
        '- Sources:',
        '<!-- SLOT:REF_SOURCES -->',
        '',
        '- Main Notes:',
        '<!-- SLOT:REF_MAIN_NOTES -->',
        '',
        '- Investigations:',
        '<!-- SLOT:REF_INVESTIGATIONS -->'
      ].join('\n'),
      'utf-8'
    );

    // Cria uma nota primitiva no cofre para testar a Rede Epistêmica
    writeFileSync(
      join(tmpVault, '6 - Main Notes', 'Def - Grafo.md'),
      [
        '## Map of Content / Tags: #teenager',
        '',
        '- **Domain Fields**: [[Field - Teoria dos Grafos]]',
        '',
        '- Concept Taxonomy:',
        '\t- **Presupposed Concept**:',
        '\t- **Coordinate Concepts**:',
        '\t- **Derived Concepts**:',
        '',
        '---',
        '---',
        '',
        '## 1. Definição',
        'Um grafo é um par ordenado $G = (V, E)$.'
      ].join('\n'),
      'utf-8'
    );
  });

  afterEach(() => {
    rmSync(tmpVault, { recursive: true, force: true });
  });

  it('1. parseCreateCommand analisa corretamente o comando /create em múltiplos formatos e valida erros', () => {
    const cmd1 = parseCreateCommand(
      '/create note: "Grafo Conexo" type: "definition" field: "[[Field - Teoria dos Grafos]]" instructions: "Usar caminhos entre vértices"'
    );
    expect(cmd1).not.toBeNull();
    expect(cmd1?.isValid).toBe(true);
    expect(cmd1?.rawNoteTitle).toBe('Grafo Conexo');
    expect(cmd1?.archetype).toBe('definition');
    expect(cmd1?.domainFields).toEqual(['Field - Teoria dos Grafos']);
    expect(cmd1?.instructions).toBe('Usar caminhos entre vértices');

    // Infere tipo pelo prefixo do título caso type seja omitido
    const cmd2 = parseCreateCommand(
      '/create note: "Prac - Busca em Profundidade" field: "Teoria dos Grafos, Algoritmos"'
    );
    expect(cmd2?.isValid).toBe(true);
    expect(cmd2?.archetype).toBe('practical');
    expect(cmd2?.domainFields).toEqual(['Teoria dos Grafos', 'Algoritmos']);

    // Comando inválido sem note:
    const cmdErr = parseCreateCommand('/create type: "theorem"');
    expect(cmdErr?.isCreateCommand).toBe(true);
    expect(cmdErr?.isValid).toBe(false);
    expect(cmdErr?.errorMessage).toContain('note:');

    // Mensagem comum de chat retorna null
    expect(parseCreateCommand('Olá JARVIS, explique o que é um grafo')).toBeNull();
  });

  it('2. ToolExecutor executa get_note_slot_contract e create_note_from_template com sanitização determinística', async () => {
    const ctx = await initVaultContext(tmpVault);
    const executor = new ToolExecutor(ctx);

    // 1. Consulta contrato de definition sob demanda
    const contractRes = await executor.execute('get_note_slot_contract', {
      noteType: 'definition'
    });
    expect(contractRes.isSuccess).toBe(true);
    expect(contractRes.data.archetype).toBe('definition');
    expect(contractRes.data.templatePathUsed).toBe('7 - Templates/Def -.md');
    expect(contractRes.data.activeSlots).toContain('DECOMPOSICAO_ANALITICA');

    // 2. Cria uma nota via create_note_from_template
    const createRes = await executor.execute('create_note_from_template', {
      noteTitle: 'Grafo Bipartido',
      noteType: 'definition',
      domainFields: ['[[Field - Teoria dos Grafos]]'],
      slots: {
        STATUS: 'teenager',
        MOC_PRESUPPOSED: [['[[6 - Main Notes/Def - Grafo.md]]']],
        META_DOMINIO: 'Domínio B — Matemática e Ciência da Computação',
        META_TIPO: 'Definição Estrutural [B.2]',
        META_STATUS: 'Subespécie de Grafo',
        META_DISTINGUO: 'Não confundir com grafo desconexo.',
        DEFINICAO_ENUNCIADO: 'Um [[Def - Grafo]] $G=(V,E)$ cujo conjunto de vértices admite partição $V = V_1 \\cup V_2$.',
        DECOMPOSICAO_ANALITICA: [
          '- **Portadores (Carriers):** Conjunto $V = V_1 \\sqcup V_2$.',
          '- **Operações / Relações Primitivas:** Arestas $E \\subseteq V_1 \\times V_2$.',
          '- **Axiomas Constitutivos da Estrutura:** Nenhuma aresta conecta vértices da mesma partição.'
        ].join('\n'),
        TAXONOMIA_MERMAID: '```mermaid\ngraph TD\n    G["[[Def - Grafo]]"] --> GB["[[Def - Grafo Bipartido]]"]\n    class G,GB internal-link;\n```'
      }
    });

    expect(createRes.isSuccess).toBe(true);
    expect(createRes.data.path).toBe('6 - Main Notes/Def - Grafo Bipartido.md');

    // Lê a nota gravada em disco e verifica cabeçalho e callout
    const readRes = await ctx.sandbox.readNote('6 - Main Notes/Def - Grafo Bipartido.md');
    expect(readRes.content).toContain('> [!def] Definição 1 — Grafo Bipartido');
    expect(readRes.content).toContain('> - **Operações / Relações Primitivas:** Arestas $E \\subseteq V_1 \\times V_2$.');
    expect(readRes.content).toContain('G["Def - Grafo"] --> GB["Def - Grafo Bipartido"]');

    const header = parseEpistemicHeader(readRes.content);
    expect(header.domainFields).toEqual(['Field - Teoria dos Grafos']);
    expect(header.presupposedPaths).toEqual([
      { isConjunction: false, prerequisites: ['Def - Grafo'] }
    ]);
  });

  it('3. Server: persiste convenções por Perfil (GET/PUT /api/profiles/:id/conventions) e executa /create em Single-Roundtrip no /api/chat', async () => {
    const db = openDatabase(':memory:', true);
    let capturedPromptMessages: any[] = [];

    const fakeAgent: AgentLike = {
      async *execute(messages) {
        capturedPromptMessages = messages;
        const jsonPayload = JSON.stringify({
          STATUS: '#adult',
          MOC_PRESUPPOSED: [['[[Def - Grafo]]']],
          MOC_COORDINATE: ['[[Def - Grafo Desconexo]]'],
          META_DOMINIO: 'Domínio B — Matemática',
          META_TIPO: 'Definição Analítica [A.2]',
          META_STATUS: 'Conceito Derivado',
          META_DISTINGUO: 'Distinguir de conexidade forte em digrafos.',
          DEFINICAO_ENUNCIADO: 'Um [[Def - Grafo]] em que existe caminho entre qualquer par de vértices.',
          DECOMPOSICAO_ANALITICA: '- **Portadores:** $G=(V,E)$.\n- **Condição:** $\\forall u,v \\in V$, existe caminho.',
          TAXONOMIA_HIPERONIMO: '[[Def - Grafo]]',
          TAXONOMIA_PARAMETROS_LIVRES: '- Número de caminhos independentes ($k$-conexidade).',
          TAXONOMIA_HIPONIMOS: '- [[Def - Árvore]]',
          TAXONOMIA_FRONTEIRA_COORDENADA: '- vs. [[Def - Grafo Desconexo]]',
          TAXONOMIA_MERMAID: 'graph TD\n    G["Def - Grafo"] --> GC["Def - Grafo Conexo"]\n    class G,GC internal-link;',
          INSTANCIACAO_EXEMPLAR: 'Ciclo $C_n$.',
          INSTANCIACAO_NAO_EXEMPLO: 'União disjunta $K_2 \\sqcup K_2$.'
        });

        yield {
          id: 'single-turn-1',
          choices: [{ delta: { content: jsonPayload }, finish_reason: 'stop' }]
        } as any;
      }
    };

    const app = await buildServer({
      db,
      token: TEST_TOKEN,
      agentFactory: () => fakeAgent
    });

    // 1. Cria um perfil ativo apontando para tmpVault
    const createProfRes = await app.inject({
      method: 'POST',
      url: '/api/profiles',
      headers: AUTH,
      payload: {
        name: 'Cofre Matemática',
        vaultPath: tmpVault,
        model: 'google/gemini-3.8-flash',
        apiKey: 'sk-or-v1-testkey123456'
      }
    });
    expect(createProfRes.statusCode).toBe(201);
    const profileId = createProfRes.json().id;

    // 2. Consulta convenções default do perfil
    const getConvRes = await app.inject({
      method: 'GET',
      url: `/api/profiles/${profileId}/conventions`,
      headers: AUTH
    });
    expect(getConvRes.statusCode).toBe(200);
    expect(getConvRes.json().resolvedConventions.templatesDir).toBe('7 - Templates');
    expect(getConvRes.json().contracts.definition.defaultTemplateFile).toBe('Def -.md');

    // 3. Atualiza override de regra de slot via PUT /api/profiles/:id/conventions
    const putConvRes = await app.inject({
      method: 'PUT',
      url: `/api/profiles/${profileId}/conventions`,
      headers: AUTH,
      payload: {
        noteTypes: {
          definition: {
            slotRuleOverrides: {
              INSTANCIACAO_EXEMPLAR: 'Diretriz customizada pelo perfil para o exemplar canônico.'
            }
          }
        }
      }
    });
    expect(putConvRes.statusCode).toBe(200);

    // 4. Dispara o comando /create via POST /api/chat
    const chatRes = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: AUTH,
      payload: {
        message: '/create note: "Grafo Conexo" type: "definition" field: "[[Field - Teoria dos Grafos]]"'
      }
    });
    expect(chatRes.statusCode).toBe(200);
    expect(chatRes.body).toContain('event: tool_start');
    expect(chatRes.body).toContain('create_note_from_template');
    expect(chatRes.body).toContain('Nota canônica criada com sucesso em Single-Roundtrip');

    // 5. Verifica que o prompt enviado à LLM em Single-Roundtrip continha:
    //    - A Rede Epistêmica do campo ("Def - Grafo")
    //    - Apenas o contrato de 'definition' com o override customizado do perfil!
    const userPromptContent = String(capturedPromptMessages[1]?.content || '');
    expect(userPromptContent).toContain('<contexto_epistemico_modular');
    expect(userPromptContent).toContain('Def - Grafo');
    expect(userPromptContent).toContain('Diretriz customizada pelo perfil para o exemplar canônico.');
    expect(userPromptContent).not.toContain('PROVA_CORPO');

    await app.close();
    db.close();
  });
});
