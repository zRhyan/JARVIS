# JARVIS — Especificação Executiva do Marco 1 (M1)

**Foco:** Indexador de Grafo Semântico e Motor de Edição (Patch/Diff)
**Status:** Decisões Ratificadas — Pronto para Implementação
**Data:** 2026-10-02

## 1. O Que É o Entregável do Marco 1?

O Marco 1 dotará o JARVIS de seus sentidos de percepção relacional e de suas habilidades de alteração precisa em disco. Ele é composto por dois módulos isolados dentro do pacote `@jarvis/core`:

1.  **O Indexador de Grafo (`graph-index.ts`):** Um motor que varre as notas (utilizando o `vault-fs` criado no M0), extrai links e constrói um mapa em memória. Graças à taxonomia da equipe, será um **Grafo Semântico Dirigido**.
2.  **O Motor de Patch/Diff (`patch-engine.ts`):** Um módulo que recebe blocos de "Busca e Substituição" (Search & Replace) gerados pela IA, localiza o texto exato na nota, aplica a mudança em memória e gera um Diff Unificado visual para o usuário.

---

## 2. A Ontologia do Cofre (A Grande Vantagem da Equipe)

O nosso indexador não construirá um mapa genérico. Ao analisar cada arquivo `.md`, ele fará o *parsing* da estrutura rígida dos headers e footers definidos pela equipe e classificará cada aresta (link) do grafo.

### 2.1. Tipos de Relações Extraídas
Com base nas regras canônicas da equipe, o Indexador reconhecerá e tipará os seguintes wikilinks:

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
*   **A Escolha:** Utilizaremos Expressões Regulares iterando linha por linha, aproveitando a estrutura de templates fixos da equipe.
*   **Justificativa:** Como os metadados residem em linhas estritas (ex: `**Presupposed Concept**: ...`), a RegEx garante extrema velocidade. O parsing vai ignorar separadores textuais (vírgulas, espaços) e varrer a linha inteira em busca de padrões `[[link]]`, isentando a equipe de manter uma formatação micro-gerenciada e rigorosa na separação dos links.

### Decisão 2: Motor de Diff (Match Tolerante a Espaços)
*   **A Escolha:** O motor normalizará espaços em branco e quebras de linha repetidas tanto no arquivo original quanto no bloco gerado pelo LLM antes da comparação de "Buscar e Substituir".
*   **Justificativa:** LLMs frequentemente cometem erros de indentação ou adicionam espaços invisíveis ao devolver o texto. Esta abordagem é simples de codificar e aumenta dramaticamente a taxa de sucesso das alterações atômicas sem comprometer o texto real do usuário.

### Decisão 3: Indexação e Armazenamento (Memória Viva)
*   **A Escolha:** O índice do grafo será remontado inteiramente na RAM a cada inicialização do JARVIS.
*   **Justificativa:** Em conjunto com a Decisão 1 (RegEx iterativa), a leitura de milhares de arquivos no Node.js é resolvida na escala de dezenas a centenas de milissegundos. Adicionar cache persistente (SQLite) adicionaria complexidade prematura e riscos de dessincronização (ex: alteração de arquivo pelo Git enquanto o JARVIS está offline). A memória viva garante que o Grafo sempre reflita a "verdade em disco" (Source of Truth) de forma instantânea.

---

## 5. Próximo Passo
Com as especificações fechadas, o desenvolvimento do **Marco 1** focará primeiro na bateria de testes unitários (TDD) para validar os conectores lógicos do Grafo e a resiliência do Motor de Patch.