# JARVIS — Especificação de Arquitetura e Design de Software (Fase 1)

**Status:** Especificação atualizada; implementação parcial conforme o plano

**Versão:** 1.5.0

**Data:** 2026-10-03

**Escopo:** MVP Local Multiplataforma (Cenário B: Web App Local via Daemon JARVIS, preparado para Tauri/Desktop e compatibilidade com MCP).

Leitura inicial: [ARQUITETURA.md](../ARQUITETURA.md) e [PLANO.md](../PLANO.md). Esta especificação detalha o produto pretendido, não comprova sua implementação. O diagnóstico do código está em [AUDITORIA.md](AUDITORIA.md).

### Escopo do conhecimento e da memória

O vault de destino será o cérebro de conhecimento do JARVIS. Ele ainda não está disponível neste computador; seu caminho, conteúdo e convenções não foram inspecionados. Tags como `#física` e templates de área/conceito são exemplos de teste, não uma taxonomia obrigatória.

O JARVIS deve interpretar as notas existentes, recuperar fontes para responder perguntas e propor criação/atualização de conhecimento no próprio vault. Toda gravação, inclusive memória extraída de uma conversa, exige aprovação humana explícita. O SQLite guarda histórico bruto e estado operacional; a memória de conhecimento fica em Markdown e deve ser recuperável em uma sessão nova sem o chat de origem.

A primeira conexão com o vault será somente para leitura e inventário. Até lá, desenvolver com fixtures descartáveis; não substituir o vault ausente por uma pasta escolhida automaticamente. O RAG inicial combina texto e grafo. A qualidade deve ser medida no conteúdo real antes de concluir se são necessários outros mecanismos de recuperação.

---

## 1. Benchmarking de Outliers e Estado da Arte

Ao analisar as integrações mais avançadas entre modelos de linguagem e Obsidian (incluindo o padrão de **LLM Wiki** proposto por Andrej Karpathy, agentes baseados em **MCP - Model Context Protocol** e motores de **Graph-RAG** baseados em wikilinks), identificou-se um padrão claro:

> **O erro comum:** Tratar o Obsidian como um repositório genérico de arquivos de texto e aplicar RAG ingênuo (busca vetorial em pedaços desconectados, recomputando conhecimento do zero a cada pergunta).  
> **O diferencial dos outliers:** Aproveitar a estrutura intrínseca do Obsidian — **o grafo bidirecional de conhecimento (`[[wikilinks]]` e backlinks) e o acúmulo contínuo de sínteses estruturadas**.

### Três Descobertas Críticas Integradas à Fase 1:
1. **O Paradigma "LLM Wiki" (Conhecimento Cumulativo vs. RAG Efêmero):**
   Em vez de apenas responder no chat e esquecer, o JARVIS mantém e consolida páginas de entidades, conceitos e registros no cofre. O Obsidian funciona como a IDE, o JARVIS como o desenvolvedor e o cofre Markdown como a base de código (*codebase* de conhecimento).
2. **Navegação Ciente de Grafo (Graph-Aware Traversal / 1-Hop Expansion):**
   A força do Obsidian reside nos links criados pelos membros. Em vez de queimar centenas de milhares de tokens lendo pastas inteiras, o agente localiza notas-semente e navega por **backlinks** (quem referencia esta nota) e **outlinks** (quem esta nota referencia), recuperando o contexto relacional exato com frações do custo de tokens.
3. **Contrato de Governança Local (`VAULT.md`):**
   Um arquivo de convenções colocado na raiz do cofre que orienta o JARVIS sobre a taxonomia da equipe (regras de tags, estrutura de frontmatter e templates), sem necessidade de reconfigurar o sistema a cada atualização.

---

## 2. Princípios de Engenharia

1. **Desacoplamento do Editor:** O JARVIS opera como um processo externo independente do Obsidian. O vault é tratado estritamente como um diretório no sistema de arquivos local.
2. **Escrita Baseada em Propostas Determinísticas:** O modelo de linguagem (LLM) nunca altera arquivos diretamente. Ele emite intenções de alteração baseadas em busca e substituição (`Search & Replace Blocks`). O daemon computa o diff unificado de forma determinística e a aplicação em disco ocorre apenas após aprovação humana explícita.
3. **Impossibilidade Estrutural de Destruição:** Não existem primitivas de remoção (`delete`) ou movimentação (`move`) expostas ao modelo.
4. **Isolamento Multi-Workspace:** Chaves de API, orçamentos, caminhos de diretório e modelos são agrupados em perfis isolados para evitar contaminação entre vaults de equipe e vaults pessoais.
5. **Portabilidade Pragmática (Windows & Linux):** O backend é construído em Node.js/TypeScript e a interface é servida localmente no navegador, garantindo paridade total entre sistemas operacionais sem overhead de empacotamento desktop nativo no MVP.
6. **Grafo Nativo como Índice de Primeira Classe:** Resolução de dependências conceituais através da malha de wikilinks já existente no cofre.
7. **Separação entre Conhecimento e Conversas:** O cofre guarda notas e memórias de conhecimento consolidadas após aprovação. O histórico bruto de conversas e o estado operacional ficam em SQLite local, fora do cofre. Excluir um chat não exclui conhecimento já registrado nas notas.

---

## 3. Requisitos do Sistema

### 3.1. Requisitos Funcionais (RF)
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-01** | Q&A sobre o Vault | Responder a dúvidas com fontes de uma ou múltiplas notas, distinguindo informação registrada, inferência e ausência de evidência. |
| **RF-02** | Síntese e Memória de Conhecimento | Propor resumos, conexões, criação e atualização de notas conforme as convenções reais; consolidar memória após aprovação e recuperá-la em novas sessões. |
| **RF-03** | Ciclo de Proposta e Diff | Apresentar alterações propostas em formato de diff visual unificado, destacando adições e subtrações antes de qualquer alteração no disco. |
| **RF-04** | Aprovação Atômica | A escrita só ocorre sob comando explícito do usuário. Falhas na aplicação abortam a transação sem deixar arquivos corrompidos. |
| **RF-05** | Detecção de Arquivo Obsoleto (Stale) | Se o arquivo sofrer modificações no disco (ex: `git pull` ou edição direta no Obsidian) antes da aprovação da proposta, a proposta é invalidada. |
| **RF-06** | Gestão de Perfis (Workspaces) | Permitir criação e alternância ágil entre perfis configurados (ex: "Equipe" vs "Pessoal"). |
| **RF-07** | Troca Dinâmica de Modelos | Permitir que o usuário alterne entre modelos homologados da OpenRouter diretamente pela interface. |
| **RF-08** | Navegação por Grafo (Backlinks / Outlinks) | Permitir que o JARVIS consulte quais notas apontam para um arquivo e quais arquivos são citados por ele. |
| **RF-09** | Interface Web Local | Dashboard com painel de chat com streaming de tokens, cartões de propostas de edição com diff expansível e seletor de perfil/modelo em Tailwind CSS. |
| **RF-10** | Histórico Local de Sessões (SQLite) | Persistir histórico de conversas localmente por perfil em banco SQLite embutido (`better-sqlite3`), fora do versionamento do Git. |

### 3.2. Requisitos Não Funcionais (RNF)
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Paridade Multiplataforma | Execução idêntica em Windows (PowerShell/CMD) e Linux (Bash/Zsh). Caminhos normalizados via abstração POSIX internamente. |
| **RNF-02** | Codificação e Quebra de Linha | Leitura e escrita estritamente em UTF-8 com quebra de linha normalizada em `\n` (LF) para evitar ruído no Git. |
| **RNF-03** | Isolamento de Credenciais | Chaves do OpenRouter e configurações de diretório são salvas na pasta de configuração do usuário do SO (`~/.config/jarvis` ou `%APPDATA%\jarvis`), **nunca** dentro do cofre. |
| **RNF-04** | Latência e Eficiência de Tokens | Uso de busca híbrida (Léxica + Grafo de Wikilinks) reduzindo o volume de contexto desnecessário enviado ao LLM. Consumo de memória do daemon em repouso < 80 MB. |
| **RNF-05** | Preparação para Tauri e MCP | Frontend SPA desacoplado comunicando-se via HTTP/SSE. Primitivas do JARVIS desacopladas para fácil exposição como servidor MCP (*Model Context Protocol*). |

---

## 4. Arquitetura do Sistema e Persistência

```
                      MÁQUINA LOCAL (WINDOWS / LINUX)
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   Navegador Web (Chrome / Firefox / Edge)                              │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ SPA Frontend (Vite + React / Tailwind CSS puro)              │     │
│   │  - Seletor de Perfil (Vault + Chave)                         │     │
│   │  - Seletor de Modelo Curado                                  │     │
│   │  - Chat com Streaming SSE                                    │     │
│   │  - Visualizador de Unified Diff com Ações (Aprovar/Rejeitar) │     │
│   │  - Barra lateral de histórico de conversas                   │     │
│   └──────────────────────────────▲───────────────────────────────┘     │
│                                  │ HTTP / SSE (127.0.0.1:4173)         │
│   Processo em Segundo Plano      │ (com Auth Token Local)              │
│   ┌──────────────────────────────▼───────────────────────────────┐     │
│   │ JARVIS Daemon (Node.js / TypeScript)                         │     │
│   │  ┌───────────────────────────┐  ┌──────────────────────────┐ │     │
│   │  │ Workspace Manager         │  │ Agent Runtime            │ │     │
│   │  │ (Validação de Perfis)     │  │ (Loop ReAct + Tools)     │ │     │
│   │  └─────────────┬─────────────┘  └─────────────┬────────────┘ │     │
│   │  ┌─────────────▼─────────────┐                │              │     │
│   │  │ SQLite Database           │  ┌─────────────▼────────────┐ │     │
│   │  │ (Sessions & Messages)     │  │ Graph & Link Indexer     │ │     │
│   │  └───────────────────────────┘  │ (Wikilinks e Backlinks)  │ │     │
│   │  ┌───────────────────────────┐  └─────────────┬────────────┘ │     │
│   │  │ Vault Guard (Path Sandbox)│◄───────────────┘              │     │
│   │  │ (Bloqueia .git, .obsidian)│  ┌──────────────────────────┐ │     │
│   │  └─────────────┬─────────────┘  │ Diff & Patch Engine      │ │     │
│   │                │                │ (Cálculo determinístico) │ │     │
│   │                │                └─────────────┬────────────┘ │     │
│   └────────────────┼──────────────────────────────┼──────────────┘     │
│                    │ Escrita Atômica              │ Chamadas HTTPS     │
│                    ▼                              ▼                    │
│     Diretório do Vault (Disco Local)     OpenRouter API                │
│     (Obsidian lê/detecta via FS)         (Roteamento por Chave)       │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Esquema do Banco SQLite (`jarvis.db`)
Armazenado em `~/.config/jarvis/jarvis.db` (Linux) ou `%APPDATA%\jarvis\jarvis.db` (Windows):

O esquema abaixo é uma base de referência, ainda não implementada. E10–E12 do plano também exigem identidade imutável do cofre por perfil, propostas persistidas e registro de tentativas de aplicação. As migrações devem preservar ordem das mensagens, modelo utilizado e estados de interrupção. Conhecimento consolidado continua nas notas do vault.

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
    content TEXT,
    tool_calls_json TEXT,
    tool_call_id TEXT,
    token_usage_prompt INTEGER DEFAULT 0,
    token_usage_completion INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

---

## 5. Ferramentas do JARVIS (Tooling de Alta Eficiência)

O modelo deverá receber acesso às seguintes primitivas funcionais. A memória utiliza as mesmas ferramentas de consulta e proposta; não há ferramenta de gravação ou aprovação exposta ao modelo.

### 5.1. Leitura e Navegação Relacional
1. `list_notes(directory?: string)`: Retorna a árvore de arquivos e diretórios permitidos.
2. `read_note(relative_path: string)`: Lê o conteúdo de uma nota e retorna o texto acompanhado do `content_hash` (SHA-256 no momento da leitura).
3. `search_notes(query: string)`: Busca rápida por correspondência de texto, tags e propriedades frontmatter.
4. `get_graph_neighborhood(relative_path: string)`: Retorna os links de saída (`outlinks`) contidos na nota e todas as notas que a referenciam (`backlinks`), permitindo expansão contextual de 1 ou 2 saltos sem ler o cofre inteiro.

### 5.2. Escrita Propositiva (Determinística)
5. `propose_block_replace(relative_path: string, base_hash: string, search_block: string, replace_block: string)`: Propõe alteração pontual no arquivo baseada em correspondência de bloco.
6. `propose_create(relative_path: string, content: string)`: Prepara conteúdo e diff para uma nova nota, sem gravar. Falha se o arquivo já existir; a ausência do destino deve ser garantida novamente na aplicação aprovada.

### 5.3. Ciclo de memória

Buscar registros relacionados → ler suas fontes → preparar criação ou atualização com origem e contexto → mostrar a proposta → aguardar aprovação → validar/aplicar → reindexar. Confirmar “memória salva” somente após sucesso. A recuperação deve funcionar após reinício, em sessão sem histórico anterior, consultando a nota gravada.

---

## 6. Prevenção de Conflitos e Protocolo de Escrita

```
  [ JARVIS emite propose_block_replace ]
                   │
                   ▼
  [ Daemon valida correspondência única de search_block ]
                   │
                   ▼
  [ Daemon computa Unified Diff estruturado em memória ]
                   │
                   ▼
  [ Exibição visual do Diff no Web App (Estado: PENDING) ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   [ REJEITAR ]        [ APROVAR ]
         │                   │
         ▼                   ▼
   [ REJECTED ]        Verificação: hash(disco) == base_hash?
                         ├── NÃO ──► STALE (Alerta na UI; aborta)
                         └── SIM  ──► Aplicação Segura
                                         ├─ 1. Grava em `.jarvis-tmp/<file>.tmp`
                                         ├─ 2. Flush em disco
                                         ├─ 3. Atomic rename para arquivo final
                                         └─ 4. Transição para APPLIED
```

---

## 7. Estrutura do Repositório (NPM Workspaces)

A árvore abaixo é ilustrativa da divisão de responsabilidades. O mapa de arquivos de implementação atualizado está na seção 5.1 de [PLANO.md](../PLANO.md); serviços de perfil e persistência operacional ficam no daemon.

```
jarvis/
├── package.json               # Workspaces: ["packages/*"]
├── tsconfig.json              # Configuração base de TypeScript
├── packages/
│   ├── core/                  # Regras de negócio, indexação e persistência
│   │   ├── src/
│   │   │   ├── vault-fs.ts    # Sandbox de sistema de arquivos e hashes
│   │   │   ├── graph-index.ts # Parser de [[wikilinks]] e backlinks
│   │   │   ├── diff.ts        # Motor determinístico de Search & Replace
│   │   │   └── types.ts       # Contratos e tipos comuns
│   ├── daemon/                # Backend da aplicação
│   │   ├── src/
│   │   │   ├── server.ts      # Servidor HTTP / SSE
│   │   │   ├── db.ts          # Driver SQLite com better-sqlite3
│   │   │   ├── profiles.ts    # Gestão de perfis e identidade do vault
│   │   │   ├── agent.ts       # Loop ReAct e execução de ferramentas
│   │   │   ├── openrouter.ts  # Cliente de inferência OpenRouter
│   │   │   └── index.ts       # Ponto de entrada CLI/Daemon
│   └── web/                   # Interface do Usuário (SPA com Tailwind CSS puro)
│       ├── src/
│       │   ├── components/    # Chat, DiffViewer, ProfileSelector, Sidebar
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── tailwind.config.js
│       └── vite.config.ts
└── docs/                      # Especificações de arquitetura e roadmap
```
