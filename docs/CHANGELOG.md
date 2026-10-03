# Changelog - JARVIS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Documentação] - 2026-10-03

### Atualizado

- Alinhados os documentos de entrada, arquitetura detalhada, roadmap e especificações M0/M1/M2 ao vault de destino como cérebro RAG e memória persistente do JARVIS.
- Registrado que o vault ainda não está neste computador. Exemplos de tags e templates não definem seu domínio; a primeira conexão fará inventário e validação somente de leitura.
- Confirmada a regra de aprovação explícita para toda criação/edição de nota, incluindo memória. O sistema só confirma salvamento após aplicação bem-sucedida.
- Separados conhecimento em Markdown, histórico/estado operacional em SQLite e índices derivados reconstruíveis.
- Acrescentados critérios de recuperação com fontes e memória após reinício em nova sessão, sem o histórico original, e distinção entre validação com fixtures e homologação real.
- Harmonizados os contratos de criação/edição, atualização do grafo e identidade do cofre por perfil com as 17 entregas do plano.

### Estado da implementação

Esta revisão altera documentação. M0 e M1 continuam parciais; M2 mantém um protótipo de streaming com ferramentas desconectadas; M3–M5 permanecem pendentes. As entradas abaixo preservam o status declarado em 2026-10-02, que foi contestado pela [auditoria](AUDITORIA.md). O estado atual é mantido em [PLANO.md](../PLANO.md).

## [Marco 1] - 2026-10-02
### Status declarado na época: Concluído; revisado como parcial em 2026-10-03
**Indexador de Grafo e Motor de Patches (Diff)**

### Adicionado
- Módulo `GraphIndex` (`graph-index.ts`) implementado em memória para extração de taxonomia.
  - Suporte total ao template da equipe (Notas de Área e Notas de Conceito).
  - Captura hierárquica precisa de `Broader Fields`, `Presupposed Concepts`, `Derived Concepts`, etc.
  - Resolução nativa de aliases nos Wikilinks do Obsidian (processa `[[Arquivo|Alias]]` como `Arquivo`).
- Módulo `PatchEngine` (`patch-engine.ts`) para aplicação de diffs e edição de arquivos.
  - Implementação do modelo Search/Replace tolerante a espaços em branco e quebras de linha (`\s+`).
  - Tratamento de exceções robusto contra alucinações da IA (`PatchNotFoundError`) e propostas mal delimitadas (`PatchAmbiguousError`).
- Suítes de testes unitários (`graph-index.test.ts` e `patch-engine.test.ts`) para validação rigorosa de taxonomia e mutação de texto.

---

## [Marco 0] - 2026-10-02
### Status declarado na época: Concluído; revisado como parcial em 2026-10-03
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
