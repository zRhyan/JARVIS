# JARVIS — Especificação Executiva do Marco 1 (M1)

**Foco:** Indexador de Grafo Semântico e Motor de Edição (Patch/Diff)
**Status:** Especificação revisada; implementação parcial, com pendências em E04–E07
**Data:** 2026-10-03

Contratos atuais em [ARQUITETURA.md](../ARQUITETURA.md) e execução em [PLANO.md](../PLANO.md). O vault de destino ainda não está conectado. Templates e tags usados nos testes não definem sua organização real.

## 1. O Que É o Entregável do Marco 1?

O Marco 1 dotará o JARVIS de seus sentidos de percepção relacional e de suas habilidades de alteração precisa em disco. Ele é composto por dois módulos isolados dentro do pacote `@jarvis/core`:

1.  **O Indexador de Grafo (`graph-index.ts`):** Um motor que varre notas permitidas pelo `vault-fs`, extrai links e constrói um mapa em memória para recuperação de conhecimento. Deve funcionar com Markdown genérico e reconhecer relações semânticas específicas quando as convenções do vault as utilizarem.
2.  **O Motor de Patch/Diff (`patch-engine.ts`):** Um módulo que recebe blocos de "Busca e Substituição" (Search & Replace) gerados pela IA, localiza o texto exato na nota, aplica a mudança em memória e gera um Diff Unificado visual para o usuário.

---

## 2. Organização do conhecimento no vault

O indexador deve recuperar texto, links, tags Unicode e propriedades de frontmatter sem exigir um template. As regras de headers, footers e taxonomia serão adaptadas às convenções encontradas no vault de destino. Notas sem tags, frontmatter ou relações tipadas continuam válidas e pesquisáveis.

### 2.1. Tipos de Relações Extraídas
Os exemplos históricos de área/conceito incluem as relações abaixo. Seu reconhecimento é opcional conforme o conteúdo; links sem classificação permanecem genéricos.

**Nas Notas de Área (Hierarquia de Conjuntos):**
*   `broader_field`: Conjunto que contém a área (Pai).
*   `coordinate_field`: Áreas no mesmo nível/subconjuntos do mesmo pai (Irmãos).
*   `narrower_field`: Áreas subconjuntos (Filhos).
*   `core_object` e `machinery`: Entidades/Ferramentas relacionadas à área.

**Nas Notas de Conceito (Cadeia de Derivação):**
*   `domain_field`: A Área/Domínio ao qual o conceito pertence.
*   `presupposed_concept`: **Crítico!** Pré-requisitos teóricos necessários para entender a nota atual.
*   `coordinate_concept`: Conceitos adjacentes no mesmo nível.
*   `derived_concept`: Aplicações ou teorias que derivam da nota atual.
*   `source` / `main_note`: Referências bibliográficas ou notas raiz.

> **Impacto no Agente:** Isso permitirá criar *Tools* para o LLM navegar lógicamente. Por exemplo: *"Se você não tem certeza da resposta sobre o Conceito X, siga os links classificados como `presupposed_concept` até encontrar o conhecimento base."*

---

## 3. Contrato da API (Arquitetura Proposta)

### A. Graph Indexer
```typescript
export type SemanticLinkType = 
  | 'broader_field' | 'coordinate_field' | 'narrower_field' | 'core_object' | 'machinery'
  | 'domain_field' | 'presupposed_concept' | 'coordinate_concept' | 'derived_concept'
  | 'source' | 'main_note' | 'generic';

export interface LinkNode {
  targetPath: string;    // Caminho da nota destino
  semanticType: SemanticLinkType; 
}

export interface GraphIndex {
  /** Analisa todas as notas permitidas e monta o grafo em memória */
  buildIndex(): Promise<void>;
  
  /** Retorna todos os links que saem de uma nota, classificados pela taxonomia */
  getOutlinks(relativePath: string): LinkNode[];
  
  /** Retorna todas as notas que apontam para esta nota */
  getBacklinks(relativePath: string): string[];
}
```

### B. Patch Engine
```typescript
export interface PatchResult {
  isSuccess: boolean;
  patchedContent?: string; // O novo texto Markdown completo
  unifiedDiff?: string;    // O texto visual estilo Git (linhas vermelhas/verdes)
  errorMessage?: string;
}

export interface PatchEngine {
  /**
   * Aplica um bloco SEARCH/REPLACE mitigando falhas de indentação do LLM
   */
  applySearchAndReplace(originalContent: string, searchBlock: string, replaceBlock: string): PatchResult;
}
```

---

## 4. Decisões Técnicas Ratificadas

As seguintes abordagens arquiteturais foram definidas para a implementação deste marco:

### Decisão 1: Estratégia de Parsing (RegEx Baseada em Linhas)
*   **A Escolha:** Parsing de Markdown e links com regras explícitas para código, aliases e fragmentos; parser YAML para frontmatter. Expressões regulares por linha podem reconhecer taxonomias opcionais dos templates.
*   **Justificativa:** O parser precisa aceitar a organização existente, preservar tags com acentos e evitar transformar exemplos em blocos de código em relações de conhecimento. As fixtures devem incluir múltiplos domínios e notas livres.

### Decisão 2: Motor de Diff (Match Tolerante a Espaços)
*   **A Escolha:** O motor normalizará espaços em branco e quebras de linha repetidas tanto no arquivo original quanto no bloco gerado pelo LLM antes da comparação de "Buscar e Substituir".
*   **Justificativa:** LLMs frequentemente cometem erros de indentação ou adicionam espaços invisíveis ao devolver o texto. Esta abordagem é simples de codificar e aumenta dramaticamente a taxa de sucesso das alterações atômicas sem comprometer o texto real do usuário.

### Decisão 3: Indexação e Armazenamento (Memória Viva)
*   **A Escolha:** Reconstruir o índice em RAM na inicialização e antes de cada turno; atualizar a nota após gravação própria aprovada.
*   **Justificativa:** O índice é derivado reconstruível. A memória durável permanece em Markdown. Mudanças externas entram no turno seguinte; leituras e validações de propostas consultam o disco. Custo de reconstrução e qualidade de recuperação devem ser medidos antes de adotar cache incremental ou outra estratégia.

### Decisão 4: Recuperação com fontes

Busca textual por título/caminho, conteúdo, tags e propriedades fornece notas-semente; outlinks/backlinks expandem o contexto. Retornar caminhos, trechos/seções e hashes, com limites de volume. Notas ambíguas ou ausentes precisam de diagnóstico explícito. O índice não deve apresentar inferências do modelo como fatos armazenados.

---

## 5. Próximo Passo
Executar E04–E07 do plano: corrigir literalidade e ambiguidade de patches, produzir unified diff, completar parser/grafo/busca e preparar propostas sem gravação. Validar com fixtures agora e com as convenções reais após conectar o vault. Memórias aprovadas devem entrar no índice e ser recuperáveis sem o histórico do chat que as originou.
