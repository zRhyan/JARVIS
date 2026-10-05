# Changelog - JARVIS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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