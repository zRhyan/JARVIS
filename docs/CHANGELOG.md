# Changelog - JARVIS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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