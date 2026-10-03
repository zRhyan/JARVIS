# JARVIS — Especificação Executiva do Marco 0 (M0)
**Foco:** Fundação do Monorepo & Sandbox do Sistema de Arquivos (`vault-fs`)  
**Status:** Implementação parcial; correções e aceite definidos em E01–E03

**Data:** 2026-10-03

Consultar [ARQUITETURA.md](../ARQUITETURA.md), [PLANO.md](../PLANO.md) e a [auditoria](AUDITORIA.md). O vault de destino ainda não está conectado; M0 deve ser desenvolvido com fixtures descartáveis. As primitivas de escrita deste módulo serão usadas pelo daemon somente após aprovação das propostas de notas, incluindo memórias de conhecimento. Testes internos do módulo podem escrever diretamente em suas próprias fixtures.

---

## 1. O Que É o Entregável do Marco 0?

O Marco 0 não possui interface visual nem IA conectada. O entregável é uma biblioteca de núcleo (`packages/core/src/vault-fs.ts`), instalada em um monorepo funcional, com testes de isolamento e integridade. Os critérios abaixo são requisitos de aceite, ainda não atendidos integralmente pelo código:

1. **Nunca lê nem escreve fora do cofre** (bloqueio de Path Traversal, symlinks arbitrários e referências relativas maliciosas).
2. **Nunca corrompe áreas críticas** do Obsidian, do Git ou do agente (`.obsidian/`, `.git/`, `.jarvis/`).
3. **Gera hashes SHA-256 imutáveis** do conteúdo no momento da leitura (essenciais para a máquina de estados `STALE` dos próximos marcos).
4. **Publica arquivos preparados em temporário**, com flush e publicação adequada a criação exclusiva ou substituição. Verificar falhas antes/depois da publicação e documentar os limites de durabilidade de cada sistema; um teste de leitura após escrita não comprova resistência a queda de energia.
5. **Trata Windows e Linux com paridade total**, forçando UTF-8 e quebras de linha normalizadas em `\n` (LF).

---

## 2. Decisões Técnicas Ratificadas

As decisões para o início do desenvolvimento foram consolidadas:

### Decisão 1: Gerenciador de Pacotes
* **Escolha:** **`npm` (Workspaces nativos padrão)**
* **Justificativa:** Como o gerenciador de pacotes não afeta a velocidade de execução da aplicação nem a performance do Node.js em tempo de execução, o `npm` elimina qualquer atrito de instalação para os membros da equipe, funcionando nativamente em qualquer máquina com Node.js instalado.

### Decisão 2: Framework de Testes Automatizados
* **Escolha:** **`vitest`**
* **Justificativa:** Execução nativa e imediata de TypeScript sem etapa de build intermediária, compatibilidade completa com o ecossistema Vite do frontend (Marco 4) e alta velocidade de feedback durante o ciclo de desenvolvimento (TDD).

### Decisão 3: Política Canônica de Arquivos e Diretórios Protegidos
* **Diretórios e arquivos com bloqueio estrito de leitura e escrita:**
  * `.git/**` (proteção absoluta do repositório Git e histórico)
  * `.obsidian/**` (proteção de plugins, configurações e workspaces do editor)
  * `.jarvis/**` (configurações do próprio agente e políticas)
  * `.jarvis-tmp/**` (pasta temporária de isolamento atômico)
  * `node_modules/**`
  * Arquivos de lixo de sistema operacional (`.DS_Store`, `desktop.ini`, `Thumbs.db`)

---

## 3. Contrato da API do `vault-fs`

A interface abaixo registra a base original. E02/E03 do plano detalham sua evolução para validação dos destinos reais e operações distintas de substituição e criação exclusiva. A escolha de APIs síncronas/assíncronas deve respeitar essas validações; compatibilidade com esta assinatura não justifica manter as falhas de isolamento.

O módulo `packages/core/src/vault-fs.ts` exporá a seguinte interface estrita em TypeScript:

```typescript
export interface ReadResult {
  relativePath: string;
  absolutePath: string;
  content: string;
  contentHash: string; // SHA-256 do conteúdo em UTF-8 normalizado
  sizeBytes: number;
}

export interface VaultFSSandbox {
  /**
   * Valida e resolve um caminho relativo para o caminho absoluto seguro.
   * Lança erro explícito se tentar escapar da raiz do cofre ou tocar diretório protegido.
   */
  resolveSafePath(relativePath: string): string;

  /**
   * Lista todos os arquivos Markdown (.md) permitidos dentro do cofre.
   */
  listMarkdownFiles(): Promise<string[]>;

  /**
   * Lê uma nota com validação e retorna conteúdo + hash SHA-256.
   */
  readNote(relativePath: string): Promise<ReadResult>;

  /**
   * Escreve uma nota de forma atômica no disco:
   * 1. Normaliza quebras de linha para LF (\n).
   * 2. Grava em pasta temporária oculta (.jarvis-tmp/).
   * 3. Executa rename atômico do sistema operacional.
   */
  writeAtomic(relativePath: string, content: string): Promise<ReadResult>;

  /**
   * Limpa resíduos da pasta .jarvis-tmp/ em caso de encerramento anormal anterior.
   */
  cleanTempDir(): Promise<void>;
}
```

---

## 4. Bateria de Testes Automatizados (Critério de Aceite)

A suíte de testes (`packages/core/test/vault-fs.test.ts`) deve cobrir e passar com 100% de sucesso nos seguintes cenários:

| Teste | Cenário Avaliado | Resultado Esperado |
| :--- | :--- | :--- |
| **T01: Path Traversal clássico** | Passar `../../etc/passwd` ou `..\..\Windows\win.ini` | Disparar `PathTraversalError` |
| **T02: Tentativa de invasão via Symlink** | Criar um symlink dentro do cofre apontando para fora dele | `resolveSafePath` detecta destino real fora do cofre e bloqueia |
| **T03: Acesso a pastas restritas** | Tentar ler ou escrever em `.git/config`, `.obsidian/app.json` ou `.jarvis/config.json` | Disparar `ProtectedPathError` |
| **T04: Determinismo de Hash** | Ler o mesmo arquivo duas vezes com o mesmo conteúdo | `contentHash` deve ser rigorosamente idêntico |
| **T05: Normalização de CRLF** | Escrever texto contendo `\r\n` (padrão Windows) | O arquivo em disco é persistido exclusivamente com `\n` (LF) |
| **T06: Escrita Atômica** | Chamar `writeAtomic` para criar ou atualizar nota | O arquivo final é gerado íntegro; nenhum arquivo intermediário fica em `.jarvis-tmp` |
| **T07: Criação de subpastas automáticas** | Chamar `writeAtomic("pasta/nova/sub/nota.md", ...)` | Cria toda a árvore de diretórios automaticamente antes da escrita |

---

## 5. Estrutura do Monorepo para o Marco 0

```
jarvis/
├── package.json                   # Raiz configurando workspaces com NPM
├── tsconfig.json                  # Configuração TypeScript de base
├── .gitignore                     # Ignora .jarvis-tmp, node_modules, etc.
└── packages/
    └── core/
        ├── package.json           # Pacote @jarvis/core
        ├── tsconfig.json
        ├── vitest.config.ts
        ├── src/
        │   ├── index.ts           # Exportações públicas
        │   ├── errors.ts          # Classes de erro de segurança
        │   └── vault-fs.ts        # Implementação da Sandbox e I/O
        └── test/
            ├── fixtures/          # Cofre simulado para testes
            └── vault-fs.test.ts   # Suíte de testes automatizados
```

---

## 6. Próximo Passo Imediato

1. Gerar os arquivos de manifesto da raiz e do workspace (`package.json`, `tsconfig.json`).
2. Implementar as classes de erro de segurança (`errors.ts`).
3. Implementar a sandbox do sistema de arquivos (`vault-fs.ts`).
4. Completar a suíte de testes de E02/E03, incluindo T01–T07, diferenças de caixa no Windows, arquivos de sistema, junctions, caminhos relativos canônicos, falhas de I/O e criação concorrente. O teste T02 atual ainda precisa cobrir o cenário de link de filesystem especificado.
