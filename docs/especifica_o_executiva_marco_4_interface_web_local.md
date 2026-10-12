# JARVIS — Especificação Executiva do Marco 4 (M4)

**Foco:** Interface Web Local (SPA Vite + React + Tailwind CSS), Chat com Streaming SSE, Seletor de Perfis/Modelos e Visualizador Interativo de Diffs  
**Status:** CONCLUÍDO — Homologado e Testado com Sucesso  
**Data:** 2026-10-12  

---

## 1. O Que É o Entregável do Marco 4?

Nos Marcos 0 a 3, a fundação e a inteligência do JARVIS foram completamente validadas e blindadas:
- **M0:** Sandbox e I/O atômico em disco ([`VaultFSSandbox`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/core/src/vault-fs.ts)).
- **M1:** Grafo dirigido em memória ([`GraphIndex`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/core/src/graph-index.ts)) e motor determinístico de patches ([`PatchEngine`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/core/src/patch-engine.ts)).
- **M2:** Agente ReAct, catálogo das 6 ferramentas e conexão OpenRouter ([`JarvisAgent`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/daemon/src/agent-loop.ts)).
- **M3:** Daemon Fastify HTTP/SSE local, persistência em SQLite ([`better-sqlite3`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/daemon/src/db.ts)), autenticação Bearer local e máquina de estados de propostas ([`ProposalStateManager`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/daemon/src/proposal-manager.ts)).

O **Marco 4** entrega a experiência visual humana do JARVIS: uma **Interface Web Local (Single Page Application)** moderna, fluida e com acabamento premium, executada no navegador da máquina do usuário.

O entregável consiste em:
1. **Pacote Frontend (`packages/web`):** Aplicação SPA desenvolvida em Vite + React 18+ + TypeScript, estilizada com Tailwind CSS utilitário com componentes construídos sob medida (sem bibliotecas pesadas de componentes que dificultem eventual migração para Tauri).
2. **Camada de Conexão com o Daemon:** Cliente HTTP e receptor de Server-Sent Events (SSE) autenticado, tratando reconexões, tokens de sessão e status de saúde do daemon em tempo real.
3. **Painel de Chat Conversacional:** Área de diálogo com streaming de tokens em tempo real, formatação de Markdown rica (blocos de código, tabelas, ênfases e wikilinks estilizados) e feedback visual de ferramentas em execução (`tool_start` e `tool_end`).
4. **Visualizador de Diffs e Aprovação de Propostas (Diff Viewer):** Componente visual de revisão de alterações geradas pelo motor de patch, com contraste de adições (`+`, verde) e remoções (`-`, vermelho), metadados do arquivo e botões de ação imediata: `[Rejeitar]` e `[Aprovar & Aplicar]`.
5. **Barra Lateral e Gestão de Sessões:** Histórico de conversas recuperado do SQLite local, busca/filtro de sessões passadas e botão de nova conversa.
6. **Controle de Workspaces e Modelos:** Seletor de Perfil (ex: "Equipe" vs. "Pessoal") e Seletor de Modelo Curado (ex: Gemini 2.5 Flash, Claude 3.5 Haiku, Claude 3.5 Sonnet / GPT-4o).

---

## 2. Arquitetura da Interface Web e Comunicação com o Daemon

Abaixo está o fluxo arquitetural de ponta a ponta que conecta o navegador à base de conhecimento do Obsidian através do daemon:

```
                            NAVEGADOR LOCAL
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  JARVIS Web UI (SPA: Vite + React + Tailwind CSS)                           │
 │                                                                             │
 │  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
 │  │ Sidebar de Sessões    │  │ Header: Perfil Ativo & Modelo Curado       │  │
 │  │ - Lista do SQLite     │  └────────────────────────────────────────────┘  │
 │  │ - Nova Conversa       │  ┌────────────────────────────────────────────┐  │
 │  │ - Excluir Sessão      │  │ Feed de Chat (Streaming SSE)               │  │
 │  │ - Status do Daemon    │  │ - Mensagens User / Assistant               │  │
 │  └───────────────────────┘  │ - Tool Badges (list_notes, search, etc.)   │  │
 │                             │ - Cards de Proposta (Diff Viewer)          │  │
 │                             │   [Rejeitar]  [Aprovar & Aplicar]          │  │
 │                             └────────────────────────────────────────────┘  │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ HTTP REST / SSE Stream
                                        │ Header: Authorization: Bearer <token>
                                        │ Origin: localhost / 127.0.0.1
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  JARVIS DAEMON (Fastify na porta 4173)                                      │
 │  - /api/health                                                              │
 │  - /api/profiles, /api/profiles/:id/activate                                │
 │  - /api/sessions, /api/sessions/:id                                         │
 │  - /api/chat (SSE: session -> token* -> tool_* -> proposal -> done)         │
 │  - /api/proposals, /api/proposals/:id/approve, /api/proposals/:id/reject     │
 └──────────────────────┬───────────────────────────────┬──────────────────────┘
                        │                               │
                        ▼                               ▼
       BANCO LOCAL (~/.config/jarvis/jarvis.db)   COFRE OBSIDIAN (Disco Local)
       - sessions, messages, profiles, proposals  - Leitura segura e escrita atômica
```

---

## 3. Componentes Centrais da Interface (`packages/web`)

A interface será modularizada em componentes puros e desacoplados:

### 3.1. `Sidebar` (Gestão de Sessões & Conectividade)
- Lista histórica de conversas carregadas via `GET /api/sessions`.
- Indicador de conectividade com o daemon (`online` verde, `offline` vermelho com alerta amigável).
- Botão proeminente de "Nova Conversa" (`POST /api/sessions`).
- Ações contextuais por sessão (renomear título ou excluir via `DELETE /api/sessions/:id`).
- Rodapé com estatísticas do cofre indexado (número de notas mapeadas pelo [`GraphIndex`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/core/src/graph-index.ts)).

### 3.2. `Header` & `ProfileSelector`
- Alternância rápida entre perfis cadastrados (`GET /api/profiles` e `POST /api/profiles/:id/activate`).
- Exibição do cofre ativo no disco e status de sincronização.
- Seletor suspenso de modelo de linguagem curado (com badges indicando custo/velocidade/raciocínio).
- Botão de acesso rápido a configurações e gerenciamento de perfis (modal).

### 3.3. `ChatArea` & `MessageItem`
- Feed de mensagens com auto-scroll suave e botão de "rolar até o fim" quando o usuário sobe o histórico.
- Renderização de Markdown rica:
  - Formatação tipográfica apurada via classes utilitárias personalizadas.
  - Renderização especial de `[[wikilinks]]` com destaque visual característico do ecossistema Obsidian.
  - Blocos de código com destaque sintático e botão de cópia de um clique.
- Indicador de digitação e streaming contínuo de tokens via SSE (`token`).
- Chips/badges expansíveis que mostram o raciocínio e o uso de ferramentas em tempo de execução:
  - Ex: `🔍 Buscando em "Avionics.md"...` (`tool_start: search_notes`)
  - Ex: `🕸️ Explorando 4 backlinks de "Radar"...` (`tool_start: get_graph_neighborhood`)

### 3.4. `ProposalCard` (Visualizador de Diff & Ações de Escrita)
- Card destacado dentro do fluxo da conversa (ou em painel dedicado):
  - Cabeçalho com o caminho relativo da nota no cofre (ex: `Conceitos/Radar-Primario.md`).
  - Badge de status (`PENDING`, `APPLIED`, `REJECTED`, `STALE`).
  - Visualizador de Unified Diff:
    - Linhas de contexto: fundo neutro.
    - Linhas removidas (`-`): fundo avermelhado suave com texto vermelho destacado.
    - Linhas adicionadas (`+`): fundo esverdeado suave com texto verde destacado.
  - Barra de ações:
    - Botão `Rejeitar`: chama `POST /api/proposals/:id/reject`, desabilita ações e atualiza o card para cinza/rejeitado.
    - Botão `Aprovar & Aplicar`: chama `POST /api/proposals/:id/approve`. Se o arquivo foi modificado no disco por terceiros, exibe feedback instantâneo de conflito (`STALE`); caso contrário, exibe sucesso (`APPLIED`) com animação sutil e confirmação de escrita no disco.

### 3.5. `ProfileModal` (Gestão de Workspaces)
- Criação de novos perfis com campos validados: `id`, `name`, `vaultPath`, `model` e `apiKey`.
- Validação de caminho existente no sistema de arquivos.

---

## 4. Fluxo de Eventos e Ciclo de Vida da Interface

### 4.1. Ciclo de Envio de Mensagem e Streaming SSE
```
Usuário digita mensagem e clica "Enviar"
  │
  ├─ 1. Insere mensagem do usuário otimisticamente na UI
  ├─ 2. Dispara POST /api/chat { sessionId, message }
  ├─ 3. Recebe stream SSE:
  │      ├─ event: session    ──► Atualiza sessionId ativo se era conversa nova
  │      ├─ event: tool_start ──► Exibe badge de progresso da ferramenta
  │      ├─ event: tool_end   ──► Atualiza status da ferramenta (sucesso/erro)
  │      ├─ event: proposal   ──► Instancia ProposalCard em estado PENDING
  │      ├─ event: token      ──► Concatena caractere a caractere no texto do assistente
  │      ├─ event: done       ──► Finaliza animação de cursor e fecha stream
  │      └─ event: error      ──► Exibe toast/alerta de erro operacional
  └─ 4. Revalida lista de sessões na barra lateral para refletir último timestamp
```

### 4.2. Ciclo de Aprovação de Proposta
```
Usuário clica em "Aprovar & Aplicar" no ProposalCard
  │
  ├─ 1. Dispara POST /api/proposals/:id/approve
  ├─ 2. Daemon executa verificação anti-stale (hash atual == baseHash)
  │      ├── Se Falha (409): Card atualiza para STALE com alerta visual
  │      │     "O arquivo foi modificado no Obsidian antes da aprovação."
  │      └── Se Sucesso (200):
  │            ├─ Card atualiza para APPLIED com check verde
  │            └─ Obsidian detecta mudança de disco e recarrega a nota instantaneamente
```

---

## 5. Estrutura Prevista do Pacote `packages/web`

```
packages/web/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                    # Design tokens, fontes, animações e estilos base
│   ├── types/
│   │   └── api.ts                   # Interfaces espelhadas dos contratos do daemon
│   ├── services/
│   │   ├── api-client.ts            # Wrapper Fetch autenticado (Bearer Token)
│   │   └── sse-client.ts            # Gerenciador de conexão SSE com reconexão
│   ├── hooks/
│   │   ├── useChat.ts               # Hook central de estado do chat e streaming
│   │   ├── useProfiles.ts           # Hook de listagem e ativação de perfis
│   │   ├── useSessions.ts           # Hook de listagem e CRUD de sessões
│   │   └── useDaemonHealth.ts       # Polling leve de saúde do daemon
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx           # Seletor de perfil, modelo e status
│       │   ├── Sidebar.tsx          # Histórico de sessões e nova conversa
│       │   └── MainLayout.tsx       # Shell estrutural responsivo
│       ├── chat/
│       │   ├── ChatContainer.tsx    # Scroll container e feed de mensagens
│       │   ├── MessageBubble.tsx    # Balão individual com renderizador Markdown
│       │   ├── MessageInput.tsx     # Textarea auto-expansível com atalhos de envio
│       │   ├── ToolCallBadge.tsx    # Indicador de ferramentas em execução
│       │   └── WikilinkBadge.tsx    # Estilização especial de referências [[nota]]
│       ├── proposal/
│       │   ├── ProposalCard.tsx     # Card inline resumido com preview e ações
│       │   ├── DiffViewer.tsx       # Renderizador artesanal de linhas adicionadas/removidas
│       │   ├── ProposalActions.tsx  # Botões [Rejeitar] e [Aprovar & Aplicar]
│       │   └── DiffModal.tsx        # Modal/drawer espaçoso para visualização expandida (Formato 3)
│       └── modals/
│           ├── ProfileModal.tsx     # Criação, edição e troca de perfis
│           └── AuthTokenModal.tsx   # Configuração e inserção do Bearer Token
```

---

## 6. Decisões Técnicas Ratificadas

Com base nas deliberações arquiteturais e de design, as decisões foram consolidadas para guiar a implementação:

---

### Decisão 1: Distribuição e Hospedagem da Web UI
* **Escolha Ratificada:** **Cenário Híbrido**
* **Implementação:**
  - **Ambiente de Desenvolvimento:** Servidor de desenvolvimento do Vite executando em `http://127.0.0.1:5173` com Hot Module Replacement (HMR) e proxy reverso configurado no `vite.config.ts` redirecionando chamadas `/api` para o daemon na porta `4173`.
  - **Ambiente de Produção / Execução Integrada:** O pacote `@jarvis/daemon` integrará `@fastify/static` para servir a pasta compilada `packages/web/dist` diretamente em `http://127.0.0.1:4173`, permitindo que o usuário abra o navegador na mesma porta do daemon quando desejar.

---

### Decisão 2: Injeção e Armazenamento do Bearer Token no Navegador
* **Escolha Ratificada:** **Opção C (Input de Token com Fallback `.env` + Armazenamento em `localStorage`)**
* **Implementação:**
  - Em modo de desenvolvimento, a Web UI lê opcionalmente a variável de ambiente `VITE_JARVIS_TOKEN` do arquivo `.env` do pacote web para dispensar a digitação manual de token durante iterações de código.
  - No navegador, a aplicação detecta a ausência de token e exibe o `AuthTokenModal`, orientando o usuário onde encontrar o token gerado (`~/.config/jarvis/auth.token`).
  - O token inserido é persistido com segurança no `localStorage` do navegador e enviado no cabeçalho `Authorization: Bearer <token>` em todas as requisições HTTP e streams SSE.

---

### Decisão 3: Motor de Visualização do Unified Diff
* **Escolha Ratificada:** **Opção A (Componente Artesanal em Tailwind CSS Puro)**
* **Implementação:**
  - Construção de um componente React nativo [`DiffViewer`](file:///home/zrhyan/Principal/Computation/JARVIS/packages/web/src/components/proposal/DiffViewer.tsx) sem bibliotecas pesadas de terceiros (como `diff2html` ou `react-diff-viewer`).
  - O componente analisa a string `unified_diff` retornada pelo daemon linha a linha:
    - Linhas iniciadas com `+`: realce em verde esmeralda com fundo sutil (`bg-emerald-950/30 text-emerald-300`).
    - Linhas iniciadas com `-`: realce em vermelho suave com fundo sutil (`bg-rose-950/30 text-rose-300`).
    - Linhas iniciadas com `@@`: cabeçalho de hunk em ciano/azul suave com fundo neutro (`bg-slate-800 text-cyan-400 font-mono`).
    - Linhas de contexto (` `): texto padrão legível.
  - Preserva performance extrema, zero risco de descontinuação de dependências e portabilidade nativa direta para Tauri/Desktop no futuro.

---

### Decisão 4: Relação entre o Seletor de Modelos Curados e o Perfil Ativo
* **Escolha Ratificada:** **Modelo Padrão no Perfil + Alternância Livre na Sessão**
* **Implementação:**
  - **Modelo Padrão:** Cada perfil no SQLite possui seu modelo padrão configurado (`profile.model`). Ao abrir o JARVIS ou alternar para um perfil, este modelo é selecionado por padrão.
  - **Liberdade de Troca em Tempo Real:** Durante a utilização de um perfil, o usuário pode selecionar livremente qualquer modelo da lista de curados (Gemini 2.5 Flash, Claude 3.5 Haiku, Claude 3.5 Sonnet, GPT-4o, etc.).
  - **Sobrescrita por Requisição:** O endpoint `/api/chat` receberá suporte a um parâmetro opcional `model?: string` no corpo da requisição. Se omitido, utiliza o modelo do perfil ativo.
  - **Definir Novo Padrão:** O seletor da UI incluirá uma ação explícita: *"Tornar este modelo o padrão do perfil"*, disparando atualização no banco SQLite do perfil ativo para persistir a nova preferência permanentemente.

---

### Decisão 5: Disposição Visual das Propostas de Alteração (Diff Cards)
* **Escolha Ratificada:** **Formato 3 (Híbrido: Card Resumido Inline + Expansão em Modal/Drawer)**
* **Implementação:**
  - **Card Inline na Conversa:** Quando o evento `proposal` é emitido pelo stream SSE, um card compacto é inserido na ordem cronológica da conversa, exibindo o caminho da nota, badge de status (`PENDING`), resumo do hunk (primeiras linhas do diff) e botões de ação rápida `[Rejeitar]` e `[Aprovar & Aplicar]`.
  - **Visualização Expandida:** O card possui um botão destacado *"Expandir Diff Completo"*, que abre o `DiffModal` (ou drawer lateral espaçoso), permitindo inspecionar arquivos longos e blocos extensos de código com numeração de linhas e largura expandida.

---

### Decisão 6: Identidade Visual e Design System
* **Escolha Ratificada:** **Cockpit Inteligente Escuro (Dark Mode Nativo com Tailwind)**
* **Implementação:**
  - **Paleta de Cores:** Fundo em `slate-950` / `zinc-900`, superfícies com leve glassmorphism (`backdrop-blur-md bg-slate-900/80 border border-slate-800`), textos principais em `slate-100`, acentos funcionais em `cyan-400` / `emerald-400` para estados ativos e sucesso, e `rose-400` para erros e exclusões.
  - **Tipografia:** Fonte sem serifa moderna (`Inter` / `Outfit`) para controles e textos conversacionais; fonte monoespaçada (`JetBrains Mono` / `Fira Code`) para caminhos de notas, frontmatter YAML e visualizador de diffs.
  - **Micro-animações:** Transições suaves em botões e badges, pulsação delicada no cursor durante o streaming SSE e feedback visual instantâneo ao aprovar/rejeitar propostas.

---

## 7. Fases de Execução do Marco 4

1. **Fase 4.1: Fundação do `packages/web`**  
   - Inicialização do Vite + React + TypeScript + Tailwind CSS no monorepo.
   - Configuração de scripts de build e proxy de desenvolvimento.
2. **Fase 4.2: Camada de Comunicação e Estado**  
   - Implementação de `api-client.ts` e manipulador SSE.
   - Criação dos hooks reativos (`useChat`, `useSessions`, `useProfiles`, `useDaemonHealth`).
3. **Fase 4.3: Layout e Estrutura Básica**  
   - Desenvolvimento da `Sidebar`, `Header` com seleção de perfis e layout responsivo.
4. **Fase 4.4: Conversação e Streaming**  
   - Implementação do feed de mensagens, renderização Markdown, syntax highlighting e streaming de tokens com auto-scroll.
   - Exibição de chips de ferramentas em execução (`tool_start`/`tool_end`).
5. **Fase 4.5: Visualizador de Diffs e Aprovação Atômica**  
   - Construção do componente `DiffViewer` e do `ProposalCard`.
   - Conexão com `/api/proposals/:id/approve` e `/reject`, tratando estados `APPLIED`, `REJECTED` e o alerta crítico `STALE`.
6. **Fase 4.6: Polimento e Testes de Homologação**  
   - Teste visual integrado com o Obsidian aberto na máquina.
   - Validação de fluxos de erro, ausência de token e reconexão de rede.

---

## 8. Critérios de Aceitação do Marco 4

- [x] A aplicação web inicializa com um único comando e conecta com sucesso ao daemon Fastify local.
- [x] O usuário consegue visualizar, selecionar e alternar entre os perfis cadastrados no SQLite.
- [x] O usuário consegue criar novas sessões de conversa e resgatar o histórico de sessões anteriores na barra lateral.
- [x] O envio de perguntas aciona streaming fluido de tokens no painel de chat, exibindo indicadores claros de ferramentas em uso.
- [x] Quando o agente sugere edições no cofre via `propose_block_replace`, o diff unificado é exibido com clareza (verde para adições, vermelho para subtrações).
- [x] Ao clicar em `[Aprovar & Aplicar]`, a proposta é gravada atomicamente no cofre e a nota é atualizada imediatamente no Obsidian sem perda de integridade.
- [x] Se a nota for editada externamente antes da aprovação, a interface acusa `STALE` e bloqueia a alteração com aviso explicativo.
