# JARVIS — Especificação Executiva do Marco 3 (M3)

**Foco:** Servidor HTTP/SSE Local, Gerenciador de Perfis, Persistência SQLite (`better-sqlite3`) e Máquina de Estados de Propostas  
**Status:** DEFINITIVO — Decisões ratificadas (ver Seção 7)  
**Data:** 2026-10-05  

---

## 1. O Que É o Entregável do Marco 3?

Nos Marcos 0, 1 e 2, construímos o cérebro, os sentidos e a ferramenta de terminal do JARVIS:
- **M0:** Sandbox e I/O atômico em disco (`VaultFSSandbox`).
- **M1:** Grafo dirigido em memória (`GraphIndex`) e motor determinístico de patches (`PatchEngine`).
- **M2:** Agente ReAct, catálogo das 6 ferramentas e conexão com OpenRouter (`JarvisAgent`).

O **Marco 3** transforma o JARVIS de um script de terminal isolado em um **Serviço em Segundo Plano (Daemon Local)** robusto e resiliente. Esse daemon atuará como a espinha dorsal para a futura interface Web (Marco 4) e para eventual integração desktop via Tauri ou servidor MCP.

O entregável consiste em:
1. **Servidor HTTP/SSE Local:** Um servidor escutando exclusivamente em `127.0.0.1` (com porta padrão configurável, ex: `4173` ou `3001`), protegido por um token de autenticação local gerado em runtime.
2. **Banco de Dados SQLite Embutido (`better-sqlite3`):** Armazenamento permanente das conversas e sessões fora do cofre Obsidian (`jarvis.db`), garantindo velocidade instantânea e zero poluição no Git do cofre.
3. **Gerenciador de Perfis (`profiles.json`):** Sistema de workspaces permitindo configurar múltiplos perfis (ex: "Equipe / Aviônica" vs. "Pessoal / Estudos"), cada qual com seu caminho de vault, chave de API e modelo padrão.
4. **Máquina de Estados de Propostas (`ProposalStateManager`):** Gerenciamento formal dos estados de propostas (`PENDING`, `APPLIED`, `REJECTED`, `STALE`), incluindo validação de hash em disco para impedir escrita em notas alteradas concorrentemente.

---

## 2. Arquitetura do Daemon e Comunicação HTTP/SSE

```
                    NAVEGADOR / WEB APP (M4) / CLI
                                │
                                │ HTTP / SSE (127.0.0.1:4173)
                                │ Header: Authorization: Bearer <local_token>
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│ JARVIS DAEMON (@jarvis/daemon)                                         │
│                                                                        │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Local Auth Guard     │  │ Profile & Vault Manager                │  │
│  │ (Valida Bearer Token)│  │ (Carrega profiles.json e troca vaults) │  │
│  └──────────┬───────────┘  └───────────────────┬────────────────────┘  │
│             │                                  │                       │
│  ┌──────────▼───────────┐  ┌───────────────────▼────────────────────┐  │
│  │ SQLite Repository    │  │ Proposal State Machine                 │  │
│  │ (sessions & messages)│  │ (PENDING -> APPLIED/REJECTED/STALE)    │  │
│  └──────────────────────┘  └───────────────────┬────────────────────┘  │
│                                                │                       │
│  ┌─────────────────────────────────────────────▼────────────────────┐  │
│  │ Agent Engine (Loop ReAct + OpenRouter Streaming via SSE)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Persistência de Sessões: SQLite Local (`better-sqlite3`)

Conforme ratificado na arquitetura de Fase 1, **o histórico de conversas nunca é salvo dentro das notas Markdown do Obsidian**.

### 3.1. Localização Canônica do Banco
- **Linux:** `~/.config/jarvis/jarvis.db`
- **Windows:** `%APPDATA%\jarvis\jarvis.db`

### 3.2. Esquema Relacional de Dados
```sql
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vault_path TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    seq INTEGER NOT NULL,         -- ordem estável dentro da sessão
    role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT,       -- JSON serializado caso seja chamada de ferramenta
    tool_call_id TEXT,     -- ID da chamada caso role='tool'
    token_usage_prompt INTEGER DEFAULT 0,
    token_usage_completion INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    note_path TEXT NOT NULL,
    base_hash TEXT NOT NULL,
    search_block TEXT NOT NULL,
    replace_block TEXT NOT NULL,
    unified_diff TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'APPLIED', 'REJECTED', 'STALE')) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

---

## 4. Gerenciamento de Perfis e Workspaces

Um dos diferenciais centrais do JARVIS é permitir trabalhar com múltiplos cofres e orçamentos sem misturar dados.

### 4.1. Perfis: SQLite como Fonte da Verdade + Import/Export JSON
Os perfis vivem na tabela `profiles` do `jarvis.db`. O formato JSON abaixo é usado apenas para `jarvis profiles export` / `jarvis profiles import` (backup, edição manual e seed inicial). A API nunca devolve `apiKey` em claro (apenas mascarada). `jarvis.db` e `auth.token` são criados com permissão `0600` no Linux.

Formato de import/export:
```json
{
  "activeProfileId": "equipe-avionica",
  "profiles": [
    {
      "id": "equipe-avionica",
      "name": "Aviônica KM",
      "vaultPath": "/home/zrhyan/Principal/Obsidian/Avionic-KM",
      "model": "google/gemini-2.5-flash",
      "apiKey": "sk-or-v1-..."
    },
    {
      "id": "pessoal",
      "name": "Notas Pessoais",
      "vaultPath": "/home/zrhyan/Principal/Obsidian/Personal",
      "model": "anthropic/claude-3.5-haiku",
      "apiKey": "sk-or-v1-..."
    }
  ]
}
```

---

## 5. Máquina de Estados das Propostas (Ciclo de Vida)

```
        [ JARVIS emite propose_block_replace ]
                         │
                         ▼
             [ Criação da Proposta ]
              Estado: PENDING
              Guarda: note_path, base_hash, unified_diff
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   [ REJEITAR ]                      [ APROVAR ]
        │                                 │
        ▼                                 ▼
  Estado: REJECTED            Verificação de Integridade:
                       Hash atual da nota == base_hash gravado?
                                ├── NÃO ──► Estado: STALE
                                │           (Alerta: nota foi editada externamente; aborta)
                                └── SIM  ──► Aplicação Segura
                                             ├─ Grava com VaultFSSandbox.writeAtomic
                                             ├─ Atualiza GraphIndex
                                             └─ Estado: APPLIED
```

---

## 6. Contratos de API do Daemon (HTTP / SSE)

O daemon expõe uma API REST/SSE enxuta e ultrarrápida:

### 6.1. Autenticação Local
- Na inicialização do daemon, um token criptográfico aleatório (SHA-256 / 32 bytes hex) é gerado e salvo em `~/.config/jarvis/auth.token`.
- Toda requisição HTTP precisa enviar o header:
  `Authorization: Bearer <token>`
- Apenas requisições originadas em `127.0.0.1` ou `localhost` são aceitas (bloqueio rigoroso de rede externa).

### 6.2. Catálogo de Endpoints

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status de saúde do daemon, tempo de atividade e perfil ativo. |
| `GET` | `/api/profiles` | Lista todos os perfis cadastrados. |
| `POST` | `/api/profiles` | Cria um novo perfil. |
| `POST` | `/api/profiles/:id/activate` | Alterna o perfil ativo e reinicializa o cofre e o grafo em memória. |
| `GET` | `/api/sessions` | Lista as sessões anteriores do perfil ativo (paginado/ordenado por data). |
| `POST` | `/api/sessions` | Cria uma nova sessão de conversa. |
| `GET` | `/api/sessions/:id` | Retorna o histórico completo de mensagens de uma sessão. |
| `DELETE`| `/api/sessions/:id` | Exclui uma sessão e suas mensagens associadas. |
| `POST` | `/api/chat` | Envia mensagem do usuário e abre streaming SSE com tokens e eventos de tools. |
| `GET` | `/api/proposals` | Lista propostas pendentes (`PENDING`) ou históricas. |
| `POST` | `/api/proposals/:id/approve` | Executa verificação anti-stale e aplica a proposta em disco. |
| `POST` | `/api/proposals/:id/reject` | Marca a proposta como rejeitada. |

---

## 7. Decisões Técnicas Ratificadas

| # | Tema | Decisão |
| :--- | :--- | :--- |
| 1 | Framework HTTP | **Fastify** |
| 2 | Configuração de perfis | **Híbrido:** tabela `profiles` no `jarvis.db` é a fonte da verdade; `profiles.json` apenas para import/export (`jarvis profiles export/import`) |
| 3 | Chave de API | Armazenada **dentro do perfil** no banco local; mascarada na API; arquivos com permissão `0600` |
| 4 | Caminho de configuração | Linux `~/.config/jarvis/`; Windows `%APPDATA%\jarvis\`; override via `JARVIS_DATA_DIR` |
| 5 | CLI vs Daemon | `npm run dev` sobe o Daemon HTTP; CLI permanece como script autônomo de depuração |
