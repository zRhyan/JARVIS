# Changelog - JARVIS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [One-Click Launch, Auto-Open de Navegador e Autenticação Transparente] - 2026-10-17
### Status: Concluído
**Experiência Plug-and-Play para Usuários Finais (Windows & Linux) e Eliminação da Fricção de Token Manual**
- **Autenticação Automática e Transparente de Token:**
  - **Reutilização Persistente (`auth.ts`):** Criada a função `getOrGenerateToken(dataDir)`. O daemon agora preserva o token de segurança em `auth.token` (com permissões `0600`) entre reinicializações, eliminando a invalidação repetida da sessão do usuário.
  - **Auto-Bootstrap na SPA Web (`server.ts` & `auth-storage.ts`):** Ao servir o arquivo `index.html` da Web UI local, o daemon injeta com segurança a tag de script `window.__JARVIS_BOOTSTRAP_TOKEN__`. Além disso, a aplicação web aceita o token via URL (`?token=...`) e limpa a URL em seguida, persistindo no `localStorage`. Usuários nunca mais precisam abrir arquivos no terminal nem copiar/colar tokens manualmente.
- **Abertura Automática do Navegador Padrão (`main.ts`):**
  - Implementada a função `openBrowser(url)` multiplataforma (`start` no Windows, `xdg-open` no Linux, `open` no macOS). Ao iniciar o daemon Fastify, o navegador padrão do usuário abre diretamente no JARVIS (`http://127.0.0.1:4173/?token=...`) de forma instantânea.
- **Launchers e Instaladores de Um Clique:**
  - **Windows (`jarvis.bat`):** Script executável que com um duplo clique no Windows Explorer verifica o Node.js, compila a interface e executa o JARVIS automaticamente.
  - **Linux / macOS (`jarvis.sh`):** Script executável `./jarvis.sh` com fluxo inteligente de inicialização e compilação automática na primeira execução.
  - **Atalho no Menu de Programas do Linux (`scripts/install-desktop-shortcut.sh`):** Instala o atalho `jarvis.desktop` e o ícone vetorial oficial em `~/.local/share/applications`, permitindo abrir o JARVIS pelo menu de aplicativos do Ubuntu/Debian/Fedora.
  - **Ícone Oficial Vetorial (`docs/jarvis-icon.svg`):** Criado design HUD moderno em SVG com reator Arc Reactor neon.
- **Documentação e Onboarding (`README.md`):**
  - Adicionado guia direto de início rápido com instruções de 1 clique para Windows e Linux, facilitando a distribuição pública no GitHub.
- **Qualidade do Monorepo:** 67 testes aprovados e cobertura total das novas funções de autenticação e bootstrap.

---

## [Resolução Inteligente de Caminhos de Notas e Eliminação de Alucinações de Pastas] - 2026-10-16
### Status: Concluído
**Resolução Automática de Notas por Nome Base, Remoção de Pastas Fictícias do Prompt e Proteção contra Sementes em Cofres Reais**
- **Camada Core (`@jarvis/core`):**
  - **Busca Resiliente em `GraphIndex` (`graph-index.ts`):** `getNote(path)` e o novo método `resolveNotePath(nameOrPath)` agora encontram a nota mesmo que o caminho informado omita a extensão `.md`, ou forneça apenas o nome base da nota sem pasta (ex: `"Field - Operational Systems OS"` localiza `"1 - Fields/Field - Operational Systems OS.md"`). Suporta também buscas onde o modelo indicou uma subpasta incorreta ou adivinhada.
- **Camada Daemon (`@jarvis/daemon`):**
  - **Resolução Automática de Caminhos em `ToolExecutor` (`tool-executor.ts`):** Implementado `resolveNotePath(inputPath)` que intercepta as chamadas de `read_note`, `get_graph_neighborhood` e `propose_block_replace`. Se o caminho direto não for encontrado, o executor resolve a nota real no cofre por correspondência de nome base via Grafo e Sandbox, eliminando erros de `ENOENT`.
  - **Proteção contra Sementes em Cofres Existentes (`vault-context.ts`):** Corrigida a lógica de `seedDefaultVault` em `initVaultContext`. O daemon agora verifica se o diretório do cofre possui arquivos reais antes de criar notas de demonstração (`areas/`, `conceitos/`, `VAULT.md`), evitando poluir cofres preexistentes do usuário.
  - **Purificação do Catálogo de Ferramentas (`tool-registry.ts`):** Removidos exemplos artificiais com pastas inexistentes (`"areas/fisica.md"`, `"conceitos/forca.md"`), substituindo-os por diretrizes claras que explicam ao LLM que ele pode fornecer apenas o nome da nota ou o caminho relativo real.
  - **Instruções de Resolução no System Prompt (`agent-loop.ts`):** Adicionada seção explícita `[RESOLUÇÃO DE NOTAS E PASTAS]` instruindo o JARVIS a nunca adivinhar ou inventar pastas fictícias, orientando o uso do nome limpo da nota ou de `search_notes`.
- **Camada Web (`@jarvis/web`):**
  - **Modelos Modernos para o Dia a Dia e Suporte a Raciocínio (`api.ts`):** O catálogo pré-configurado foi expandido tendo como principal destaque o novo **Gemini 3.8 Flash** (`google/gemini-3.8-flash`) com suporte a Thinking/Raciocínio nativo, além de opções como Claude 3.5 Haiku, Claude 3.5 Sonnet, GPT-4o Mini, GPT-4o, DeepSeek V3 e Qwen 2.5 72B.
  - **Suporte a Modelos Personalizados do OpenRouter (`Header.tsx` & `ProfileModal.tsx`):** Adicionado campo dedicado para inserção livre de qualquer ID de modelo do OpenRouter no menu superior de troca rápida e na criação/edição de perfil, permitindo usar qualquer modelo sem necessidade de alterar o código.
- **Camada Daemon (`@jarvis/daemon`):**
  - **Suporte Nativo a Reasoning/Thinking Effort (`agent-loop.ts` & `server.ts`):** Implementada a injeção do parâmetro nativo de esforço de raciocínio da API do OpenRouter (`reasoning: { effort: 'low' | 'medium' | 'high' }`). O daemon agora aceita e encaminha `reasoningEffort` ou `thinking_level` tanto por perfil quanto nas requisições diretas de chat, garantindo pleno controle sobre modelos com pensamento (como o Gemini 3.8 Flash) sem erro de duplicação de parâmetros.
  - **Modelo Padrão Atualizado:** Definido `google/gemini-3.8-flash` como modelo padrão do agente JARVIS no daemon.
- **Qualidade do Monorepo:** 64 testes 100% aprovados (22 no core, 37 no daemon, 5 no web) e build de produção homologado.

---

## [Melhorias de UX/UI no Feed de Chat e Destaque de Notas Obsidian] - 2026-10-15
### Status: Concluído
**Ocultação de Mensagens Brutas de Ferramentas, Identidade Visual Roxa do Obsidian e Renderização Inteligente de Código**
- **Camada Web (`@jarvis/web`):**
  - **Filtragem de Mensagens Internas:** O `ChatContainer.tsx` agora filtra e omite mensagens do tipo `role: 'tool'` (JSONs de saída bruta de ferramentas), mantendo os badges interativos (`ToolCallBadge`) no topo da resposta do assistente e eliminando poluição visual no feed.
  - **Identidade Visual Roxa do Obsidian (`WikilinkText.tsx`):**
    - `[[wikilinks]]` e referências a caminhos `.md` agora são renderizados com a paleta roxa oficial do Obsidian (`#7C3AED` / fundo suave, borda violeta e texto `#c4b5fd` com ícone de nota ou link).
    - Aplicação recursiva no `MessageBubble.tsx` para garantir que tópicos em bullet points (`li`), parágrafos e elementos formatados recebam o destaque visual correto.
  - **Renderização Inteligente de Código (`MessageBubble.tsx`):**
    - Expressões inline ou códigos curtos de uma linha deixaram de gerar caixas escuras gigantes com botão de cópia.
    - O container com botão "Copiar" e ícone de terminal foi reservado exclusivamente para blocos de código multilinhas ou com especificador de linguagem explícito.
  - Validação de build em produção (`tsc && vite build`).
- **Camada Daemon (`@jarvis/daemon`):**
  - **Diretriz de Formatação no `buildSystemPrompt` (`agent-loop.ts`):** Instrução para o agente estruturar listas de notas do cofre sempre em bullet points hierárquicos com sintaxe `[[Nome da Nota]]`, com recuo para MoCs ou resumos descritivos e sem despejar fragmentos crus de tabelas.
  - **Correção de Queda de Respostas do Assistente (`agent-loop.ts`):** Corrigido bug crítico onde chamadas do modelo sem invocação de ferramentas (ex: respostas diretas ou pedidos de esclarecimento como *"pesquise em inglês agora"*) descartavam o conteúdo obtido no primeiro ciclo e realizavam uma chamada duplicada redundante via streaming, que com frequência retornava deltas vazios no OpenRouter e persistia mensagens em branco no banco de dados. Agora o conteúdo pré-computado é transmitido diretamente em chunks via SSE com fallback seguro.
  - **Mecanismo de Busca Híbrido Conteúdo + Nome do Arquivo (`tool-executor.ts`):** Aprimorada a ferramenta `search_notes` para casar a query tanto contra as linhas internas de conteúdo da nota quanto contra o próprio caminho e nome do arquivo Markdown. Notas que funcionam como Map of Content ou taxonomia e cujo título define o assunto (ex: `1 - Fields/Symbolic Logic.md`) agora são localizadas e indexadas nos resultados de busca com snippet de identificação imediato.
  - **Rebase Automático de Propostas Pendentes (`proposal-manager.ts`):** Implementado mecanismo de rebase atômico na aprovação de propostas. Quando uma proposta é aplicada com sucesso em uma nota que possui outras propostas pendentes (`PENDING`), o sistema valida se as modificações subsequentes continuam válidas e sem conflito sobre o novo conteúdo da nota, recalculando o `base_hash` e o `unified_diff` automaticamente. Isso permite aprovar sequencialmente múltiplas propostas na mesma nota sem erro prematuro de `STALE`.
  - **Vinculação de Propostas a Mensagens do Assistente (`server.ts` & `db.ts`):** Adicionada a coluna `message_id` à tabela `proposals` com migração defensiva automática em SQLite. O daemon agora vincula cada proposta à mensagem de resposta que a gerou.
  - **Padronização Limpa de Wikilinks (`agent-loop.ts`):** Estabelecida diretriz estrita no prompt de sistema para que o JARVIS nunca inclua o caminho de diretórios ou a extensão `.md` ao criar referências em notas ou no chat. Wikilinks agora são formatados exclusivamente com o nome limpo da nota (ex: `[[Nome da Nota]]` em vez de `[[6 - Main Notes/Nome da Nota]]`), respeitando o comportamento nativo do Obsidian e mantendo o texto legível e sem poluição.
  - **Resiliência do Ciclo ReAct e Síntese Graciosa de Pesquisas (`agent-loop.ts` & `server.ts`):**
    - Elevação do limite de iterações do ReAct de 10 para 25, permitindo que pesquisas aprofundadas com múltiplos termos e explorações no grafo de conexões ocorram sem interrupções prematuras.
    - Eliminação da exceção fatal que derrubava o stream SSE ao atingir o limite de iterações. Agora o JARVIS aciona uma rodada de síntese conversacional instruindo o modelo a consolidar e listar para o usuário todas as notas, taxonomias e conexões mapeadas até o momento.
    - O daemon agora captura falhas de streaming e persiste a resposta explicativa do assistente no banco SQLite, garantindo integridade de histórico mesmo em imprevistos de rede ou limites de tokens da API externa.
  - **Tratamento Tolerante de Notas Vazias (`patch-engine.ts` & `tool-executor.ts`):**
    - `propose_create` agora permite preencher notas preexistentes no cofre que estejam vazias (0 bytes), prevenindo loops onde o agente tentava criar e era rejeitado porque o Obsidian já havia criado o arquivo vazio no disco.
    - `applyPatch` e `propose_block_replace` agora aceitam inicialização em notas com conteúdo vazio sem lançar `PatchNotFoundError`.
- **Camada Web (`@jarvis/web`):**
  - **Renderização Escopada de Propostas (`ChatContainer.tsx`):** Os cards de propostas de edição (`ProposalCard`) agora são renderizados estritamente abaixo da mensagem do assistente que disparou a alteração, corrigindo o bug visual onde todas as propostas da sessão eram desenhadas repetidamente em todas as mensagens anteriores do chat.
  - **Prevenção de 'Desaparecimento Fantasma' no Feed (`useChat.ts` & `ChatContainer.tsx`):**
    - O hook `useChat.ts` agora garante que mensagens de erro atribuam conteúdo explícito à bolha do assistente, impedindo que ela seja descartada pelo filtro da UI.
    - O `ChatContainer.tsx` preserva os indicadores de ferramentas e o balão do assistente mesmo durante transições de estado assíncronas.
- **Qualidade do Monorepo:** 62 testes 100% aprovados (21 no core, 36 no daemon, 5 no web) e build de produção homologado.

---

## [File Watcher & Sincronização Automática do Grafo] - 2026-10-14
### Status: Concluído
**Detecção em Tempo Real de Alterações no Cofre, Reindexação Reativa do Grafo Semântico e Telemetria Discreta na Web UI**
- Especificação executiva ratificada e homologada (`especifica_o_executiva_file_watcher_e_sincronizacao_automatica.md`).
- **Camada Core (`@jarvis/core`):**
  - Implementado o método `GraphIndex.removeNote(relativePath)` para purgar nós de notas e desassociar backlinks órfãos de forma atômica no grafo em memória.
  - Novos testes unitários aprovados em `graph-index.test.ts`, totalizando 21 testes no core.
- **Camada Daemon (`@jarvis/daemon`):**
  - Adicionado `chokidar@^3.6.0` ao pacote daemon.
  - Implementado o serviço `VaultWatcherService` (`vault-watcher.ts`) monitorando eventos `add`, `change` e `unlink` de notas Markdown com `awaitWriteFinish` (debounce de 200ms e pollInterval de 50ms) e política defensiva de retentativa contra leituras parciais do editor externo.
  - Recarga reativa de convenções do `VAULT.md` sem necessidade de reiniciar o servidor.
  - Gerenciamento limpo do ciclo de vida do watcher em `server.ts`: fechamento ao desativar/trocar perfil e no shutdown do daemon (`onClose`).
  - Extensão do endpoint `GET /api/health` para expor o objeto `vault: { indexedNotes, lastSyncAt }`.
  - Suíte completa de testes automatizados (`vault-watcher.test.ts`), elevando o daemon para 34 testes aprovados.
- **Camada Web (`@jarvis/web`):**
  - Atualização dos tipos tipados de API (`types/api.ts`) e do hook `useDaemonHealth` para consumir as métricas do cofre.
  - Inclusão de indicador sutil e discreto no rodapé da `Sidebar.tsx`, exibindo o total de notas indexadas e o horário da última sincronização (`Sync HH:MM:SS`) de forma orgânica, sem interrupções ou popups invasivos.
  - Build de produção validado (`tsc && vite build`) e testes aprovados.
- **Qualidade do Monorepo:** 60 testes 100% aprovados (21 no core, 34 no daemon, 5 no web).

---

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