# JARVIS — Especificação Executiva: File Watcher Automático e Sincronização do Grafo

**Foco:** Detecção em tempo real de alterações em arquivos Markdown no cofre ativo, atualização reativa do Grafo Semântico (`GraphIndex`) e garantia de consistência de estado para o Agente sem intervenção do usuário  
**Status:** CONCLUÍDO  
**Data:** 2026-10-14  

---

## 1. Contexto e Motivação do Problema

Durante os testes de uso contínuo do JARVIS, identificou-se um desalinhamento crítico entre o estado físico do cofre do Obsidian e o modelo mental do agente:

1. **Sintoma Observado:**
   - O usuário solicitou ao JARVIS listar todas as notas de conceito (`Def - *`) conectadas às notas de campo (`Field - Operational Systems OS` ou `Field - Computer Architecture`).
   - O agente executou `get_graph_neighborhood` e retornou a lista correta no momento.
   - Em seguida, sem fechar a conversa, o usuário criou novas notas no Obsidian e as conectou via `[[wikilinks]]` aos referidos campos.
   - Ao pedir nova verificação no mesmo chat (*"Por favor, realize a mesma operação novamente, pois adicionei mais notas e preciso da lista atualizada."*), o JARVIS retornou exatamente a mesma lista anterior, alegando textualmente que as listas permaneciam as mesmas e que nenhuma nota adicional havia sido conectada.

2. **Causa Raiz Identificada:**
   - O objeto `GraphIndex` é construído uma única vez na inicialização do daemon através de `initVaultContext(profile.vaultPath)` -> `graph.buildIndex(sandbox)`.
   - As únicas vias de mutação do grafo em execução eram internas do próprio JARVIS: `propose_create` e a aprovação de propostas em `ProposalStateManager.approve`.
   - Modificações, adições e exclusões externas feitas diretamente pelo usuário no Obsidian ou no sistema operacional não eram monitoradas nem notificadas ao Daemon.
   - O `activeCtx` armazenado em memória em `server.ts` mantinha uma visão congelada no tempo, induzindo o agente a tirar conclusões equivocadas com base em dados obsoletos.

3. **Objetivo Desta Feature:**
   - Tornar a sincronização **completamente automática, silenciosa e imperceptível**, liberando o usuário de qualquer obrigação de acionar botões ou enviar comandos para o JARVIS atualizar seu estado interno.
   - Exibir na interface Web local, de forma discreta no rodapé da Sidebar, a quantidade atualizada de notas indexadas e a data/hora da última sincronização detectada.

---

## 2. Decisões Arquiteturais Ratificadas

| # | Tópico | Decisão Ratificada | Racional |
|---|--------|---------------------|----------|
| **1** | **Mecanismo de Watcher** | **`chokidar`** (`^3.6.0` ou `^4.0.0`) | Biblioteca consagrada que normaliza eventos de SO (inotify no Linux, fsevents no macOS e ReadDirectoryChangesW no Windows). Evita inconsistências de eventos duplicados do `fs.watch` nativo. |
| **2** | **Janela de Debounce** | **200 ms** | Janela ideal para consolidar múltiplos eventos de digitação do Obsidian, garantindo que o descritor de arquivo seja liberado antes da leitura. |
| **3** | **Indicador Visual na Web UI** | **Atualização discreta no rodapé da Sidebar** | Exibição de: 1) Total de notas indexadas (ex: `124 notas`), 2) Data/hora da última sincronização (`Último sync: 10:32:15`). A atualização ocorre de forma limpa via polling de `/api/health` ou endpoint dedicado, sem modais ou pop-ups invasivos. |
| **4** | **Falhas Transitórias de Leitura** | **1 retentativa automática (retry de 50ms)** | Protege contra casos em que o sistema operacional reporta o evento enquanto o Obsidian ainda está finalizando o flush atômico em disco. |

---

## 3. Detalhamento da Feature (Arquitetura & Funcionamento)

A solução baseia-se no serviço **`VaultWatcherService`** atrelado ao ciclo de vida do cofre ativo no Daemon:

```
      SISTEMA EXTERNO (Obsidian / Editor / SO)
                         │
        Cria / Edita / Exclui notas (.md)
                         │
                         ▼
             SISTEMA DE ARQUIVOS (Vault)
                         │
                         ▼ (eventos fs com debounce de 200ms)
┌─────────────────────────────────────────────────────────────────┐
│ JARVIS DAEMON                                                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ VaultWatcherService (via chokidar)                        │  │
│  │ - Ignora diretórios: .git, .obsidian, .jarvis, tmp       │  │
│  │ - Filtra exclusivamente arquivos *.md                     │  │
│  │ - Mantém 'lastSyncAt' (ISO timestamp) e total de notas   │  │
│  └─────────────┬─────────────────────────────────────────────┘  │
│                │ Dispara mutações incrementais                   │
│                ▼                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ GraphIndex (em memória)                                   │  │
│  │ - addNote(relativePath, content) (add / change)           │  │
│  │ - removeNote(relativePath)       (unlink)                 │  │
│  └─────────────┬──────────────────────────┬──────────────────┘  │
│                │                          │                     │
│                ▼                          ▼                     │
│  ┌───────────────────────────┐  ┌────────────────────────────┐  │
│  │ ToolExecutor              │  │ GET /api/health            │  │
│  │ Agente consulta grafo     │  │ Retorna:                   │  │
│  │ 100% atualizado!          │  │ { vaultStats: {            │  │
│  │                           │  │     indexedNotes: 124,     │  │
│  │                           │  │     lastSyncAt: "..." } }  │  │
│  └───────────────────────────┘  └─────────────┬──────────────┘  │
└───────────────────────────────────────────────┼─────────────────┘
                                                │ Polling regular
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ JARVIS WEB UI (Sidebar.tsx)                                     │
│  [●] Daemon Local :4173                                         │
│  📚 124 notas indexadas • Sync: 10:32:15                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1. Módulos e Responsabilidades

#### A. Camada `@jarvis/core`: Expansão do `GraphIndex`
- Implementar o método `removeNote(relativePath: string): boolean`:
  - Normaliza o caminho.
  - Verifica se o nó existe na tabela `nodes`. Se não existir, retorna `false`.
  - Remove as referências de backlinks que partiam deste nó (`removeBacklinksForSource`).
  - Deleta a entrada do nó em `this.nodes`.
  - Retorna `true`.
- Testes unitários cobrindo adição, remoção de nó, e limpeza de backlinks e outlinks órfãos.

#### B. Camada `@jarvis/daemon`: `VaultWatcherService`
- Classe `VaultWatcherService` gerenciando a instância do `chokidar.FSWatcher`.
- Configuração do watcher:
  - `ignored`: pastas protegidas (`**/.git/**`, `**/.obsidian/**`, `**/.jarvis/**`, `**/node_modules/**`, `**/.jarvis-tmp/**`).
  - `ignoreInitial: true` (pois o `buildIndex` inicial já é executado na carga do cofre).
  - `awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }` (debounce nativo robusto do chokidar).
- Tratamento de Eventos:
  - `add` e `change`:
    - Verifica se termina com `.md`.
    - Lê via `sandbox.readNote(relativePath)`.
    - Executa `graph.addNote(relativePath, content)`.
    - Se o arquivo alterado for `VAULT.md`, atualiza `ctx.vaultConventions = content`.
    - Atualiza `lastSyncAt = new Date().toISOString()`.
  - `unlink`:
    - Executa `graph.removeNote(relativePath)`.
    - Atualiza `lastSyncAt = new Date().toISOString()`.
- Ciclo de vida:
  - Método `close()` assíncrono para liberar watchers ao trocar de perfil ou desligar o daemon.

#### C. Exposição no Daemon Fastify (`GET /api/health`)
- Estender a resposta do `/api/health`:
  ```json
  {
    "status": "ok",
    "uptimeSeconds": 1420,
    "activeProfile": { ... },
    "vault": {
      "indexedNotes": 124,
      "lastSyncAt": "2026-10-14T10:32:15.123Z"
    }
  }
  ```

#### D. Camada `@jarvis/web`: Atualização Discreta na Sidebar
- Estender o hook `useDaemonHealth` para incluir `vaultStats: { indexedNotes: number; lastSyncAt: string | null }`.
- No rodapé da `Sidebar.tsx`, logo abaixo do status do daemon, renderizar uma linha discreta em `font-mono text-[10px] text-slate-500`:
  - Ícone sutil de cofre/documento (`Files` ou `Database`).
  - Texto: `{indexedNotes} notas • Sync: {formatTime(lastSyncAt)}`.
  - Sem alertas sonoros, modais ou toasts — atualização 100% orgânica e discreta.

---

## 4. Plano de Tarefas de Implementação

- [x] **Fase 1: `@jarvis/core` — Suporte a Remoção de Notas no Grafo**
  - [x] Implementar `GraphIndex.removeNote(relativePath: string): boolean` em `packages/core/src/graph-index.ts`.
  - [x] Criar testes unitários em `packages/core/test/graph-index.test.ts` cobrindo adição, remoção e validação de consistência dos backlinks.
  - [x] Validar suíte de testes do `@jarvis/core`.

- [x] **Fase 2: `@jarvis/daemon` — Serviço `VaultWatcherService` e Integração**
  - [x] Adicionar dependência `chokidar` no `packages/daemon/package.json`.
  - [x] Criar `packages/daemon/src/vault-watcher.ts` com debounce de 200ms, retry e recarga de `VAULT.md`.
  - [x] Integrar o watcher ao ciclo de vida de `VaultContext` em `packages/daemon/src/vault-context.ts` e `server.ts`.
  - [x] Atualizar rota `GET /api/health` para expor `indexedNotes` e `lastSyncAt`.
  - [x] Garantir encerramento correto do watcher em troca de perfis e shutdown do processo (`SIGINT`/`SIGTERM`).
  - [x] Criar testes automatizados de integração em `packages/daemon/test/vault-watcher.test.ts`.

- [x] **Fase 3: `@jarvis/web` — Exibição Discreta na Sidebar**
  - [x] Atualizar tipagem em `packages/web/src/types/api.ts` para refletir `vault` no `/api/health`.
  - [x] Atualizar o hook `useDaemonHealth.ts` para expor as estatísticas do cofre.
  - [x] Ajustar o rodapé de `Sidebar.tsx` para apresentar a contagem de notas e o timestamp da última sincronização.
  - [x] Validar build e testes do monorepo (`npm run test`, `npm run build:web`).
