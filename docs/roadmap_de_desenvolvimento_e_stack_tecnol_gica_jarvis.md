# JARVIS — Roadmap de Desenvolvimento e Definição de Stack (Fase 1)

**Status:** Roadmap atualizado; execução detalhada e estado em PLANO.md

**Versão:** 1.4.0

**Data:** 2026-10-03

**Abordagem:** Desenvolvimento Ágil Orientado a Riscos e Marcos Incrementais

---

## 1. Visão Geral do Roadmap

O desenvolvimento é estruturado em marcos incrementais com critérios de aceite. As 17 entregas executáveis, arquivos e verificações estão em [PLANO.md](../PLANO.md); os contratos consolidados estão em [ARQUITETURA.md](../ARQUITETURA.md). As referências a semanas abaixo são estimativas do roadmap original, sem prazo revalidado.

O objetivo é usar um vault determinado como cérebro RAG e memória de conhecimento do JARVIS. Esse vault ainda não está neste computador. Os testes de desenvolvimento usam fixtures de vários domínios; a organização real será inspecionada quando ele for conectado. Toda criação/edição de nota, inclusive memória, exige proposta e aprovação humana explícita. O sistema precisa recuperar conhecimento aprovado em uma nova conversa após reinício, sem depender do chat original.

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
* **Conceito:** O vault guarda notas, entidades e memórias consolidadas após aprovação. SQLite guarda o histórico bruto das conversas e o estado operacional, fora do cofre. Consolidar conhecimento de uma conversa em nota é diferente de copiar todo o chat para o vault.
* **Armazenamento:** Arquivo de banco relacional leve (`jarvis.db`) gravado na pasta de configuração do usuário (`~/.config/jarvis` no Linux ou `%APPDATA%\jarvis` no Windows).
* **Estrutura básica:** Sessões vinculadas a perfis, mensagens ordenadas com chamadas/resultados de ferramentas, propostas e registro de tentativas de aplicação. Preservar a identidade do cofre para impedir redirecionamento de propostas ao trocar de ambiente.
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
> **Objetivo:** Isolar leitura/escrita ao cofre escolhido e verificar integridade de arquivos nos cenários suportados em Windows e Linux, com limites de concorrência documentados.

* **Tarefas de Alto Nível:**
  1. Consolidar NPM Workspaces, scripts e build de `packages/core` e `packages/daemon`; criar `packages/web` em M4.
  2. Implementação do `vault-fs`:
     * Resolução de caminhos canônicos (bloqueio de escape como `../../`).
     * Blacklist estrita de diretórios protegidos (`.git`, `.obsidian`, `.jarvis*`).
     * Cálculo de hash SHA-256 de notas no momento da leitura.
     * Escrita atômica em disco via pasta temporária (`.jarvis-tmp/` + rename atômico).
* **Critério de Sucesso:** Passar os cenários de isolamento, caminhos protegidos, links de filesystem, criação concorrente e falhas de I/O de E01–E03. Corridas com processos externos devem ter limites explícitos; resultados de testes não são prova de segurança absoluta.

---

### Marco 1: Grafo de Wikilinks & Motor de Diff Determinístico (Semana 2)
> **Objetivo:** Dar ao JARVIS a capacidade de enxergar a topologia do Obsidian e calcular alterações sem depender de formatações frágeis de LLM.

* **Tarefas de Alto Nível:**
  1. Parser de Markdown focado na sintaxe do Obsidian:
     * Extração de `[[wikilinks]]` e aliases (`[[Nota|Nome]]`).
     * Extração e validação de Frontmatter YAML sem corromper metadados existentes.
     * Tags Unicode, notas livres e templates opcionais; exemplos temáticos não restringem o vault.
  2. Construção do índice de Grafo em memória:
     * Resolução de referências de saída (*outlinks*) e referências reversas (*backlinks*).
     * Busca textual com fontes e reconstrução do índice antes de cada turno; atualização após gravação aprovada.
  3. Motor de Busca e Substituição (`Search & Replace Blocks`):
     * Algoritmo de correspondência determinística de blocos de texto no arquivo original.
     * Geração determinística de Unified Diff para visualização humana na interface.
* **Critério de Sucesso:** Consultar relações nos dois sentidos, recuperar trechos com origem e preparar conteúdo/diff determinísticos sem gravar. Medir desempenho com tamanho de cofre declarado, sem presumir latência em milissegundos para o vault ainda desconhecido.

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
  4. Preparação de memória: procurar registros relacionados, preservar origem/contexto e propor criação ou atualização sem duplicar conhecimento deliberadamente.
* **Critério de Sucesso:** Pelo terminal, o modelo consulta notas por ferramentas, responde com fontes e emite proposta estruturada. Informação ausente deve ser reconhecida; proposta pendente não pode ser apresentada como memória já salva.

---

### Marco 3: Daemon Local, Perfis & Persistência SQLite (Semana 4)
> **Objetivo:** Transformar o JARVIS em um serviço em segundo plano estável, capaz de alternar entre perfis e registrar o histórico de sessões em SQLite.

* **Tarefas de Alto Nível:**
  1. Servidor HTTP/SSE local escutando estritamente em `127.0.0.1`:
     * Proteção por token de autorização local gerado na inicialização.
  2. Gerenciador de Perfis (`profiles.json`):
     * Persistência fora do repositório (`~/.config/jarvis` ou `%APPDATA%\jarvis`).
     * Alternância entre perfis e modelos; raiz de cada perfil imutável. Outro cofre exige outro perfil, preservando a origem de sessões/propostas.
  3. Armazenamento do histórico de conversas em banco local SQLite (`better-sqlite3`):
     * Criação de tabelas `sessions` e `messages` mantidas fora do vault.
     * Endpoints para listar, carregar e excluir conversas passadas.
  4. Máquina de estados das propostas (`PENDING`, `APPLIED`, `REJECTED`, `STALE`):
     * Verificação de integridade: se o arquivo mudou no disco antes do clique de aprovação, marcar automaticamente como `STALE`.
* **Critério de Sucesso:** O daemon atende chats, persiste sessões e aplica somente propostas aprovadas e válidas. Conhecimento salvo no vault deve ser recuperado após reinício em sessão sem histórico anterior; falha/rejeição não gera falsa confirmação de salvamento.

---

### Marco 4: Interface Web Local (Semana 5)
> **Objetivo:** Disponibilizar uma interface visual rápida, moderna e intuitiva no navegador da máquina.

* **Tarefas de Alto Nível:**
  1. Frontend SPA (Single Page Application com Vite + React):
     * Seletor de Perfil (Alternar entre "Equipe" e "Pessoal").
     * Seletor de modelo configurado e validado para ferramentas/streaming na homologação.
     * Barra lateral com sessões anteriores resgatadas do SQLite via daemon.
  2. Painel de Chat com Tailwind CSS puro:
     * Renderização de Markdown e streaming de texto fluido.
     * Componentes manuais sem dependências pesadas de bibliotecas de componentes externas.
  3. Componente de Aprovação de Propostas (Diff Viewer):
     * Visualização clara de linhas adicionadas (verde) e removidas (vermelho).
     * Botões de ação direta: `[Rejeitar]` e `[Aprovar & Aplicar]`.
     * Estado explícito de memória proposta, aplicada, rejeitada ou obsoleta, conforme resposta do backend.
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
  4. Conexão inicial somente de leitura com o vault real, inventário de convenções e avaliação de perguntas representativas com fontes esperadas.
  5. Teste de memória: propor → aprovar → gravar → reiniciar → recuperar pela nota em nova sessão; cobrir rejeição, duplicidade e informação contraditória.
* **Critério de Sucesso:** Homologação Windows/Linux, Git/Obsidian, provedor e uso por dois membros registrada, com limitações reais. Validar a qualidade de recuperação e a memória persistente no vault de destino; fixtures sozinhas não encerram M5.

---

## 4. Stack Tecnológica Consolidada

| Camada | Tecnologia Selecionada | Justificativa Técnica |
| :--- | :--- | :--- |
| **Linguagem Principal** | **TypeScript (Fullstack)** | Compartilhamento dos mesmos contratos de dados entre Core, Daemon e Web UI, garantindo tipagem estrita de ponta a ponta. |
| **Ambiente de Execução** | **Node.js (>= 20 LTS)** | APIs modernas de I/O em disco recursivo, Web Streams nativo e execução homogênea em Windows e Linux. |
| **Estrutura de Monorepo** | **NPM Workspaces** | Gerenciamento de múltiplos pacotes em um único repositório de forma nativa e enxuta, sem overhead de Turborepo. |
| **Framework de Testes** | **Vitest** | Execução rápida de testes TypeScript sem etapa de build intermediária e integração nativa com ecossistema Vite. |
| **Servidor HTTP Local** | **Fastify** | Direção definida em E13 para HTTP/SSE local. A meta de memória em repouso < 80 MB precisa ser medida. |
| **Persistência de Conversas** | **SQLite (`better-sqlite3`)** | Banco relacional leve e embutido em arquivo local (`~/.config/jarvis/jarvis.db`). Mantém as conversas privadas e fora do Git do cofre. |
| **Interface Web (UI)** | **Vite + React + Tailwind CSS puro** | Renderização veloz e controle visual total via Tailwind com componentes manuais artesanais, garantindo liberdade e facilidade de empacotamento desktop futuro via Tauri. |
| **Motor de Diffs** | **diff e componente próprio de visualização** | Cálculo do unified diff a partir do conteúdo preparado e apresentação para aprovação, conforme E04/E16. |
