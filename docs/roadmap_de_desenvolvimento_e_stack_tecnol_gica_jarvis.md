# JARVIS — Roadmap de Desenvolvimento e Definição de Stack (Fase 1)

**Status:** Planejamento Aprovado e Stack Fechada  
**Versão:** 1.3.0  
**Data:** 2026-10-01  
**Abordagem:** Desenvolvimento Ágil Orientado a Riscos e Marcos Incrementais

---

## 1. Visão Geral do Roadmap

O desenvolvimento é estruturado em **ondas incrementais (Milestones)**. Cada marco produz uma parte funcional e testável isoladamente, garantindo que nunca avancemos para a camada visual ou de inteligência sem que a camada inferior (segurança de disco e integridade de dados) esteja 100% validada.

```
[M0: Fundação & Sandbox]
         │
         ▼
[M1: Grafo & Motor de Diff]
         │
         ▼
[M2: Agente & OpenRouter]
         │
         ▼
[M3: Daemon Local & Perfis]
         │
         ▼
[M4: Interface Web Local]
         │
         ▼
[M5: Homologação com Git & Equipe]
```

---

## 2. Decisões Tecnológicas Consolidadas

Com base na análise de viabilidade técnica, independência de dependências e escalabilidade futura, as seguintes decisões foram ratificadas para a Fase 1:

### 2.1. Persistência de Histórico de Conversas: SQLite Local (`better-sqlite3`)
* **Conceito:** O Obsidian atua estritamente como a base de conhecimento (notas e entidades). O histórico das conversas com o JARVIS (perguntas, respostas e sessões anteriores) não polui o cofre em Markdown e não gera commits no Git.
* **Armazenamento:** Arquivo de banco relacional leve (`jarvis.db`) gravado na pasta de configuração do usuário (`~/.config/jarvis` no Linux ou `%APPDATA%\jarvis` no Windows).
* **Estrutura básica:** Tabelas `sessions` (id, profile_id, title, created_at) e `messages` (id, session_id, role, content, token_usage, created_at).
* **Benefício:** Permite resgatar sessões antigas na barra lateral com velocidade instantânea e sem overhead de sincronização concorrente no Git.

### 2.2. Interface e Componentes: Tailwind CSS Puro com Componentes Manuais
* **Conceito:** A interface web SPA será construída com Vite + React e estilizada puramente com Tailwind CSS utilitário, com componentes feitos sob medida.
* **Justificativa:** Dispensa bibliotecas pesadas de terceiros (como shadcn, Radix ou MUI), mantendo controle total sobre o design, eliminando incompatibilidades e permitindo adaptação direta para Tauri no futuro sem refatoração de CSS.

### 2.3. Gerenciamento de Monorepo: NPM Workspaces Nativos
* **Conceito:** Organização de múltiplos pacotes (`packages/core`, `packages/daemon`, `packages/web`) gerenciados nativamente pelas ferramentas padrão do Node.js.
* **Justificativa:** Elimina a necessidade de orquestradores de build complexos como Turborepo ou Nx no MVP, simplificando o processo de instalação (`npm install` na raiz resolve todas as dependências).

---

## 3. Marcos de Execução (Milestones)

### Marco 0: Fundação & Sandbox do Sistema de Arquivos (Semana 1)
> **Objetivo:** Garantir que o JARVIS consiga ler e preparar escritas no disco com segurança matemática absoluta em Windows e Linux.

* **Tarefas de Alto Nível:**
  1. Criação da estrutura de monorepo via NPM Workspaces (`packages/core`, `packages/daemon`, `packages/web`).
  2. Implementação do `vault-fs`:
     * Resolução de caminhos canônicos (bloqueio de escape como `../../`).
     * Blacklist estrita de diretórios protegidos (`.git`, `.obsidian`, `.jarvis*`).
     * Cálculo de hash SHA-256 de notas no momento da leitura.
     * Escrita atômica em disco via pasta temporária (`.jarvis-tmp/` + rename atômico).
* **Critério de Sucesso:** Testes automatizados tentam burlar a sandbox ou forçar conflitos de escrita e o sistema bloqueia 100% das tentativas.

---

### Marco 1: Grafo de Wikilinks & Motor de Diff Determinístico (Semana 2)
> **Objetivo:** Dar ao JARVIS a capacidade de enxergar a topologia do Obsidian e calcular alterações sem depender de formatações frágeis de LLM.

* **Tarefas de Alto Nível:**
  1. Parser de Markdown focado na sintaxe do Obsidian:
     * Extração de `[[wikilinks]]` e aliases (`[[Nota|Nome]]`).
     * Extração e validação de Frontmatter YAML sem corromper metadados existentes.
  2. Construção do índice de Grafo em memória:
     * Resolução de referências de saída (*outlinks*) e referências reversas (*backlinks*).
  3. Motor de Busca e Substituição (`Search & Replace Blocks`):
     * Algoritmo de correspondência determinística de blocos de texto no arquivo original.
     * Geração determinística de Unified Diff para visualização humana na interface.
* **Critério de Sucesso:** Uma nota com links cruzados tem seu grafo mapeado em milissegundos e um bloco de texto é substituído gerando um diff limpo e legível.

---

### Marco 2: Runtime do Agente & Conexão OpenRouter (Semana 3)
> **Objetivo:** Conectar a inteligência do JARVIS ao cofre via chamadas de ferramentas (*tool calling*) com respostas em tempo real.

* **Tarefas de Alto Nível:**
  1. Integração com a API do OpenRouter via SDK compatível com OpenAI:
     * Suporte nativo a Server-Sent Events (SSE) para streaming contínuo de tokens.
  2. Implementação do loop ReAct do Agente:
     * Exposição das ferramentas de leitura: `list_notes`, `read_note`, `search_notes`, `get_graph_neighborhood`.
     * Exposição das ferramentas de proposta: `propose_block_replace`, `propose_create`.
  3. Injeção das convenções do cofre (`VAULT.md` se presente) no prompt de sistema.
* **Critério de Sucesso:** Via script de terminal/teste, o modelo responde perguntas sobre notas cruzadas navegando por wikilinks e emite uma proposta estruturada de edição.

---

### Marco 3: Daemon Local, Perfis & Persistência SQLite (Semana 4)
> **Objetivo:** Transformar o JARVIS em um serviço em segundo plano estável, capaz de alternar entre perfis e registrar o histórico de sessões em SQLite.

* **Tarefas de Alto Nível:**
  1. Servidor HTTP/SSE local escutando estritamente em `127.0.0.1`:
     * Proteção por token de autorização local gerado na inicialização.
  2. Gerenciador de Perfis (`profiles.json`):
     * Persistência fora do repositório (`~/.config/jarvis` ou `%APPDATA%\jarvis`).
     * Alternância em tempo de execução de chave de API, cofre ativo e modelo padrão.
  3. Armazenamento do histórico de conversas em banco local SQLite (`better-sqlite3`):
     * Criação de tabelas `sessions` e `messages` mantidas fora do vault.
     * Endpoints para listar, carregar e excluir conversas passadas.
  4. Máquina de estados das propostas (`PENDING`, `APPLIED`, `REJECTED`, `STALE`):
     * Verificação de integridade: se o arquivo mudou no disco antes do clique de aprovação, marcar automaticamente como `STALE`.
* **Critério de Sucesso:** O daemon sobe em segundo plano, gerencia requisições de chat, grava sessões no SQLite e aplica alterações atômicas no cofre quando acionado.

---

### Marco 4: Interface Web Local (Semana 5)
> **Objetivo:** Disponibilizar uma interface visual rápida, moderna e intuitiva no navegador da máquina.

* **Tarefas de Alto Nível:**
  1. Frontend SPA (Single Page Application com Vite + React):
     * Seletor de Perfil (Alternar entre "Equipe" e "Pessoal").
     * Seletor de Modelo Curado (Gemini 2.5 Flash, Claude 3.5 Haiku, Claude 3.5 Sonnet / GPT-4o).
     * Barra lateral com sessões anteriores resgatadas do SQLite via daemon.
  2. Painel de Chat com Tailwind CSS puro:
     * Renderização de Markdown e streaming de texto fluido.
     * Componentes manuais sem dependências pesadas de bibliotecas de componentes externas.
  3. Componente de Aprovação de Propostas (Diff Viewer):
     * Visualização clara de linhas adicionadas (verde) e removidas (vermelho).
     * Botões de ação direta: `[Rejeitar]` e `[Aprovar & Aplicar]`.
* **Critério de Sucesso:** O usuário abre o navegador, conversa com o cofre, revisa o diff visualmente e clica em aprovar, vendo a nota ser atualizada em tempo real no Obsidian aberto ao lado.

---

### Marco 5: Testes Integrados com Git & Homologação em Equipe (Semana 6)
> **Objetivo:** Blindagem final contra conflitos de merge e validação nos dois sistemas operacionais.

* **Tarefas de Alto Nível:**
  1. Testes de estresse de concorrência:
     * Simulação de `git pull` com notas sendo editadas externamente enquanto propostas estão pendentes.
     * Validação de sincronização cruzada com o plugin Obsidian Git.
  2. Homologação multiplataforma:
     * Teste do mesmo código no Windows (PowerShell) e no Linux (Ubuntu/Debian).
  3. Documentação de uso e guia rápido de onboarding para a equipe.
* **Critério de Sucesso:** Dois membros da equipe utilizam o sistema simultaneamente em repositórios sincronizados pelo Git sem quebras de formato ou conflitos silenciosos.

---

## 4. Stack Tecnológica Consolidada

| Camada | Tecnologia Selecionada | Justificativa Técnica |
| :--- | :--- | :--- |
| **Linguagem Principal** | **TypeScript (Fullstack)** | Compartilhamento dos mesmos contratos de dados entre Core, Daemon e Web UI, garantindo tipagem estrita de ponta a ponta. |
| **Ambiente de Execução** | **Node.js (>= 20 LTS)** | APIs modernas de I/O em disco recursivo, Web Streams nativo e execução homogênea em Windows e Linux. |
| **Estrutura de Monorepo** | **NPM Workspaces** | Gerenciamento de múltiplos pacotes em um único repositório de forma nativa e enxuta, sem overhead de Turborepo. |
| **Framework de Testes** | **Vitest** | Execução rápida de testes TypeScript sem etapa de build intermediária e integração nativa com ecossistema Vite. |
| **Servidor HTTP Local** | **Fastify (ou Node HTTP Nativo)** | Extremamente rápido, consumo de memória mínimo em repouso (< 80 MB) e suporte natural a Server-Sent Events (SSE). |
| **Persistência de Conversas** | **SQLite (`better-sqlite3`)** | Banco relacional leve e embutido em arquivo local (`~/.config/jarvis/jarvis.db`). Mantém as conversas privadas e fora do Git do cofre. |
| **Interface Web (UI)** | **Vite + React + Tailwind CSS puro** | Renderização veloz e controle visual total via Tailwind com componentes manuais artesanais, garantindo liberdade e facilidade de empacotamento desktop futuro via Tauri. |
| **Motor de Diffs** | **diff / diff2html** | Cálculo determinístico de patches unificados em memória, garantindo que o LLM nunca quebre a formatação de linha. |