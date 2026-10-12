# Changelog - JARVIS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Marco 4] - 2026-10-12
### Status: Concluído
**Interface Web Local (Vite + React + Tailwind CSS), Chat SSE e Visualizador de Diffs**
- Especificação executiva do Marco 4 concluída e ratificada (`especifica_o_executiva_marco_4_interface_web_local.md`).
- Ratificação e implementação integral das 6 decisões de arquitetura e design:
  1. Hospedagem: Cenário híbrido (Vite dev server porta 5173 com proxy + Fastify servindo estáticos compilados em porta 4173 nativamente sem dependências pesadas).
  2. Autenticação: Input na UI com modal, persistência em `localStorage` e fallback opcional via `VITE_JARVIS_TOKEN` no `.env`.
  3. Visualizador de Diff: Componente artesanal em Tailwind puro sem dependências pesadas externas.
  4. Modelos: Modelo padrão no perfil SQLite + escolha livre por sessão no `/api/chat` + opção de persistir novo padrão.
  5. Propostas de Edição: Formato híbrido (card compacto inline na conversa + expansão completa via modal/drawer).
  6. Design System: Dark mode nativo estilo cockpit inteligente (Slate/Zinc com acentos em Cyan/Emerald e tipografia moderna).
- **Fase 4.1 (Concluída):**
  - Criação do pacote `packages/web` integrado aos NPM Workspaces raiz.
  - Setup completo de Vite, React 18, TypeScript (`tsconfig.json` com tipagem estrita) e Tailwind CSS utilitário.
  - Implementação da folha de estilos base (`index.css`) com design tokens da identidade visual cockpit, scrollbars estilizadas e glassmorphism.
  - Configuração do proxy de desenvolvimento em `vite.config.ts` apontando chamadas `/api` para `http://127.0.0.1:4173`.
  - Adição dos scripts `npm run dev:web` e `npm run build:web` no `package.json` raiz.
  - Validação de build em produção (`tsc && vite build`) e suíte de testes (50 testes aprovados no monorepo).
- **Fase 4.2 (Concluída):**
  - Implementação dos tipos tipados de API e contratos em `src/types/api.ts` com lista de modelos curados (`CURATED_MODELS`).
  - Serviço de autenticação `src/services/auth-storage.ts` com persistência em `localStorage` e suporte defensivo a `VITE_JARVIS_TOKEN`.
  - Cliente REST autenticado `src/services/api-client.ts` com injeção automática de Bearer Token e tratamento de erros HTTP.
  - Cliente SSE de streaming de chat `src/services/sse-client.ts` com parsing robusto de linhas, eventos e buffers incompletos.
  - Hooks reativos: `useDaemonHealth` (monitoramento de conectividade), `useProfiles` (gestão e ativação de perfis), `useSessions` (CRUD e paginação de sessões) e `useChat` (streaming SSE, agregação de tokens, estado de ferramentas e propostas).
  - Backend Fastify estendido com rota `PATCH /api/profiles/:id` e parâmetro `model?: string` dinâmico em `POST /api/chat`.
  - Testes unitários para serviços adicionados (`services.test.ts`), totalizando 53 testes 100% aprovados e build limpo.
- **Fase 4.3 (Concluída):**
  - Implementação do layout cockpit completo com estética escura premium, glassmorphism e micro-animações.
  - Componente `Sidebar.tsx`: busca de conversas, listagem dinâmica do SQLite, botão de nova sessão, indicador de uptime do daemon e colapso responsivo.
  - Componente `Header.tsx`: seleção e alternância dinâmica de perfis, seletor suspenso de modelos curados (Gemini, Claude, GPT-4o) com ação direta de "definir como padrão do perfil" e badge de token.
  - Componente `MainLayout.tsx`: orquestrador de interface centralizando layout, responsividade e modais globais.
  - Modais: `AuthTokenModal.tsx` (configuração do Bearer token com cópia de caminho) e `ProfileModal.tsx` (criação de novo perfil com validações de cofre e modelo).
- **Fase 4.4 (Concluída):**
  - Implementação do feed de mensagens conversacional com `react-markdown` e `remark-gfm`.
  - Componente `WikilinkText.tsx`: detecção e renderização estética de `[[wikilinks]]` e aliases do Obsidian com links interativos.
  - Componente `MessageBubble.tsx`: balões estilizados com blocos de código com botão de cópia de um clique, avatares distintos e animação de cursor durante streaming SSE.
  - Componente `ToolCallBadge.tsx`: chips de ferramentas interativos com ícones específicos para cada operação do agente (`search_notes`, `get_graph_neighborhood`, `read_note`, etc.), estados em execução e expansão de argumentos JSON.
  - Componente `MessageInput.tsx`: entrada auto-expansível com atalhos de envio (`Enter`/`Shift+Enter`) e botão de interrupção de streaming (`AbortController`).
  - Componente `ChatContainer.tsx`: feed integrado com auto-scroll reativo, botão flutuante para descer e tela acolhedora de onboarding com prompt starters.
- **Fase 4.5 (Concluída):**
  - Componente `DiffViewer.tsx`: renderizador artesanal puro em Tailwind CSS para Unified Diffs Git (`+` esmeralda, `-` vermelho suave, `@@` cabeçalhos de hunk e contexto).
  - Componente `ProposalActions.tsx`: botões `[Rejeitar]` e `[Aprovar & Aplicar]` com estados reativos e feedback de proteção contra conflito de edição (`STALE`).
  - Componente `ProposalCard.tsx` (Formato 3 Híbrido): card inline no feed de conversa com preview condensado das primeiras linhas e integração direta com o fluxo de chat.
  - Componente `DiffModal.tsx`: modal amplo em tela cheia com visualização completa do diff, hash SHA-256 base e ações de confirmação atômica.
  - Testes unitários para lógica de diff (`diff.test.ts`), elevando o monorepo para 54 testes 100% aprovados.
- **Fase 4.6 (Concluída):**
  - Servidor de arquivos estáticos da SPA Web integrado nativamente ao Daemon Fastify com streaming de alta performance e SPA fallback para `index.html`.
  - Liberação de rotas estáticas na raiz (`GET /`, `GET /assets/*`) sem exigência de Bearer token, mantendo proteção estrita com token em `127.0.0.1` para `/api/*`.
  - Todos os 7 critérios de aceitação do Marco 4 homologados e aprovados.
  - Bateria completa de testes automatizados com 55 testes 100% aprovados em todo o monorepo (20 no core, 30 no daemon, 5 no web).

---

## [Marco 3] - 2026-10-09
### Status: Concluído
**Daemon HTTP/SSE Local, Perfis e Persistência SQLite**

### Adicionado
- Servidor HTTP/SSE local com Fastify (`server.ts`) e ponto de entrada (`main.ts`):
  - Escuta exclusivamente em `127.0.0.1` (porta padrão `4173`, configurável via `JARVIS_PORT`), com bloqueio de `Host` não local.
  - CORS restrito a origens `localhost`/`127.0.0.1`, preparando a futura interface Web (Marco 4).
  - Catálogo completo de endpoints: `/api/health`, `/api/profiles` (+ `activate`), `/api/sessions`, `/api/chat`, `/api/proposals` (+ `approve` / `reject`).
  - Chat com streaming SSE (eventos `session`, `token`, `tool_start`, `tool_end`, `proposal`, `done`, `error`) e reconstrução do histórico a partir do banco.
- Autenticação local (`auth.ts`):
  - Token aleatório de 32 bytes (hex) gerado a cada inicialização e salvo em `auth.token`.
  - Validação `Authorization: Bearer` com comparação em tempo constante.
  - Arquivos sensíveis (`auth.token`, `jarvis.db`) criados com permissão `0600` no Linux.
- Persistência SQLite com `better-sqlite3` (`db.ts`, `session-repo.ts`):
  - Banco `jarvis.db` fora do cofre Obsidian, com tabelas `profiles`, `sessions`, `messages` e `proposals`, chaves estrangeiras e `ON DELETE CASCADE`.
  - Mensagens ordenadas por `seq`, incluindo chamadas e resultados de ferramentas (`tool_calls`, `tool_call_id`).
- Gerenciador de perfis (`profile-repo.ts`):
  - SQLite como fonte da verdade, com `apiKey` armazenada dentro do perfil e sempre mascarada nas respostas da API.
  - Import/export em JSON via `npm run profiles` (`export`, `import`, `list`, `profiles-cli.ts`).
  - Troca de perfil ativo reinicializando o cofre e o grafo em memória; criação automática do perfil `default` a partir do `.env` na primeira execução.
- Máquina de estados de propostas (`proposal-manager.ts`):
  - Transições `PENDING` -> `APPLIED` / `REJECTED` / `STALE`.
  - Validação do hash atual da nota contra o `base_hash` antes de gravar: notas editadas externamente tornam a proposta `STALE`, sem escrita em disco.
  - Aplicação via `VaultFSSandbox.writeAtomic` com atualização do `GraphIndex`.
- Resolução portável do diretório de dados (`paths.ts`): `~/.config/jarvis/` no Linux, `%APPDATA%\jarvis\` no Windows e override via `JARVIS_DATA_DIR`.
- Novos scripts do daemon: `npm run dev` (sobe o daemon HTTP), `npm run chat` (CLI autônomo de depuração) e `npm run profiles`.
- Testes automatizados (`m3-daemon.test.ts`) cobrindo paths, perfis, sessões, estados de proposta, autenticação e o fluxo completo da API, elevando o monorepo para 49 testes 100% aprovados (20 no core, 29 no daemon).

### Alterado
- `tool-executor.ts`: o resultado `PENDING` de `propose_block_replace` agora inclui `searchBlock` e `replaceBlock` efetivos, permitindo persistir a proposta.
- O comando `npm run dev` passou a subir o daemon HTTP; o antigo CLI interativo agora roda por `npm run chat`.

### Dependências
- Adicionados `fastify`, `better-sqlite3@^11` (a v13 exige Node 22 e falha no Node 20) e `@types/better-sqlite3`.

---

## [Marco 2] - 2026-10-05
### Status: Concluído
**Runtime do Agente e Conexão OpenRouter**

### Adicionado
- Gerenciador de contexto do cofre (`vault-context.ts`):
  - Suporte à configuração do cofre em tempo de execução via `VAULT_PATH` no `.env` (com cofre padrão estruturado).
  - Inicialização conjunta do `VaultFSSandbox` e pré-carregamento do `GraphIndex`.
  - Detecção e extração de regras de governança locais a partir de `VAULT.md`.
- Catálogo formal das 6 ferramentas canônicas (`tool-registry.ts`) com JSON Schema estrito:
  - Percepção: `list_notes`, `read_note`, `get_graph_neighborhood`, `search_notes`.
  - Ação / Proposta: `propose_block_replace`, `propose_create`.
- Motor de despacho e execução de ferramentas (`tool-executor.ts`):
  - Execução segura contra a sandbox, busca léxica de notas e cálculo de diffs em memória.
  - Criação atômica de notas e atualização dinâmica do grafo em tempo real.
  - Fluxo de aprovação humana interativo (`onApproval`): transição de estados `PENDING` -> `APPLIED` / `REJECTED`, persistindo atômica e seguramente no disco apenas após confirmação explícita.
  - Suporte resiliente a inserção e adição de conteúdo via tokens `$END` e `$START` no `PatchEngine`.
- Loop ReAct multi-turn com abordagem híbrida (`agent-loop.ts`):
  - Batching silencioso de raciocínio e execução sequencial de `tool_calls`.
  - Streaming contínuo da resposta final conversacional via Server-Sent Events / Async Generator.
  - Injeção contextual das regras do `VAULT.md` no prompt de sistema e blindagem contra alucinações de formato.
- Interface de terminal interativa aprimorada (`chat-cli.ts`):
  - Exibição de cabeçalho com estatísticas do cofre, logs de execução de tools e visualização colorida de Unified Diffs.
  - Prompt interativo no terminal para revisão e aprovação humana de diffs em tempo real (`[S/n]`).
- Bateria completa de testes automatizados para o daemon (`tool-registry.test.ts`, `tool-executor.test.ts`, `vault-context.test.ts`, `agent-loop.test.ts`), elevando o monorepo para 37 testes unitários 100% aprovados (20 no core, 17 no daemon).


---

## [Marco 1] - 2026-10-02

### Status: Concluído
**Indexador de Grafo e Motor de Patches (Diff)**

### Adicionado
- Módulo `GraphIndex` (`graph-index.ts`) implementado em memória para extração de taxonomia.
  - Suporte total ao template da equipe (Notas de Área e Notas de Conceito).
  - Captura hierárquica precisa de `Broader Fields`, `Presupposed Concepts`, `Derived Concepts`, etc.
  - Resolução nativa de aliases e âncoras nos Wikilinks do Obsidian (processa `[[Arquivo|Alias]]` e `[[Arquivo#Seção]]` como `Arquivo`).
  - Mapeamento e consulta flexível de `backlinks` (`getBacklinks`), permitindo expansão de 1-salto no grafo.
  - Varredura e indexação automatizada de todo o cofre em disco (`buildIndex`) integrada ao `VaultFSSandbox`.
  - Classificação semântica tipada de links de saída (`getOutlinks`) via `SemanticLinkType`.
- Módulo `PatchEngine` (`patch-engine.ts`) para aplicação de diffs e edição de arquivos.
  - Implementação do modelo Search/Replace tolerante a espaços em branco e quebras de linha (`\s+`).
  - Tratamento de exceções robusto contra alucinações da IA (`PatchNotFoundError`) e propostas mal delimitadas (`PatchAmbiguousError`).
  - Geração determinística de `unifiedDiff` padrão Git via biblioteca `diff`.
  - Contrato formal `PatchResult` (`isSuccess`, `patchedContent`, `unifiedDiff`, `errorMessage`) para consumo seguro pela UI/Daemon.
- Suítes de testes unitários expandidas (`graph-index.test.ts` e `patch-engine.test.ts`), totalizando 18 testes automatizados no `@jarvis/core`.
- Padronização do runner de testes e checagem estrita de tipos TypeScript (NodeNext) em todo o monorepo.

---

## [Marco 0] - 2026-10-02
### Status: Concluído
**Fundação e Sandbox do Sistema de Arquivos**

### Adicionado
- Estrutura base do monorepo utilizando NPM Workspaces (`packages/core`).
- Configuração base de TypeScript (`tsconfig.json` raiz e pacotes) e Vitest.
- `SecurityErrors` customizados (`PathTraversalError`, `ProtectedDirError`).
- Módulo `VaultFSSandbox` (`vault-fs.ts`) garantindo:
  - Isolamento de *Path Traversal* (fuga de diretórios via `../`).
  - Bloqueio estrito de leitura/escrita em pastas de sistema (`.git`, `.jarvis`, `.obsidian`).
  - Normalização automática de quebras de linha (CRLF para LF).
  - Escrita atômica via manipulação de arquivos temporários e renomeação de sistema (`fs.renameSync`).
  - Geração determinística de Hash (SHA-256) para validação de concorrência.
- Suíte completa de testes unitários para a sandbox (`vault-fs.test.ts`), cobrindo 100% dos cenários críticos de segurança.