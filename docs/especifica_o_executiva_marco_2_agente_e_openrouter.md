# JARVIS — Especificação Executiva do Marco 2 (M2)

**Foco:** Conexão OpenRouter, Loop ReAct e Consolidação do Handoff de Edição
**Status:** Decisões Ratificadas — Pronto para Implementação
**Data:** 2026-10-02

## 1. O Que É o Entregável do Marco 2?

O Marco 2 dotará o JARVIS de raciocínio. Ele criará o pacote `@jarvis/daemon`, que fará a ponte entre os motores isolados que criamos no M0 e M1 e a API do OpenRouter. A arquitetura de escrita foi definitivamente consolidada: o JARVIS operará de forma estritamente autônoma (headless) em *background*, utilizando **I/O direto e seguro no disco**, rejeitando a dependência da Obsidian CLI para evitar gargalos de IPC e interrupções na interface gráfica do usuário.

O entregável consiste em:

1. **Cliente LLM:** Conector HTTP utilizando o SDK oficial da OpenAI (apontando para o OpenRouter).
2. **Registro de Ferramentas (Tool Registry):** A tradução das nossas funções TypeScript em um formato de *JSON Schema*.
3. **Loop de Agente (ReAct):** O motor que recebe a instrução, chama ferramentas localmente e interage com o modelo.

## 2. Catálogo de Ferramentas Expostas (Tools)

Todas as ferramentas operam nativamente na memória e no sistema de arquivos local, garantindo performance extrema (milissegundos) e invisibilidade.

### A. Ferramentas de Percepção (Raciocínio via `jarvis/core`)
* `list_notes()`: Retorna a árvore de diretórios permitidos.
* `read_note(path)`: Retorna o conteúdo exato e o Hash SHA-256 da leitura.
* `get_graph_neighborhood(path)`: Retorna outlinks (Taxonomia) e backlinks.
* `search_notes(query)`: Busca léxica/RegEx.

### B. Ferramentas de Ação (Escrita baseada em Propostas)
* `propose_block_replace(path, search_block, replace_block)`: A IA propõe uma mudança. O daemon computa o Diff usando o `PatchEngine` (M1). Ao aprovar, o `VaultFSSandbox` (M0) grava a alteração no disco.
* `propose_create(path, content)`: Cria uma nova nota. O daemon utiliza a gravação atômica direta.

## 3. Decisões Técnicas Ratificadas

A fundação do Marco 2 está cimentada nas seguintes escolhas:

### Decisão 1: Cliente e Roteamento LLM
* **A Escolha:** SDK Oficial da OpenAI (`openai` npm package) apontado para a *Base URL* do OpenRouter.
* **Justificativa:** A API da OpenAI tornou-se o padrão de facto ("USB" da IA). Usar o SDK oficial permite que, no futuro, possamos apontar o JARVIS para modelos locais gratuitos (Ollama, LM Studio) ou outras APIs empresariais simplesmente trocando a URL, sem reescrever uma linha do código do agente.

### Decisão 2: O Comportamento de Streaming
* **A Escolha:** Abordagem Híbrida (Batching invisível + Streaming de texto final).
* **Justificativa:** O raciocínio do modelo e as chamadas de ferramentas (*tool calling*) ocorrem de forma invisível nos bastidores para evitar o colapso do parser JSON. Apenas a resposta de conversação final ao usuário é transmitida via *Server-Sent Events* (SSE), garantindo a sensação de fluidez na interface.

### Decisão 3: Rejeição da Obsidian CLI para Escrita (I/O Direto Vence)
* **A Escolha:** Escrita Direta no Disco (Opção C), utilizando o `VaultFSSandbox` (M0) e o motor nativo do Obsidian (CodeMirror 6) para a reconciliação visual.
* **Justificativa:** Uma análise profunda revelou que a Obsidian CLI possui três falhas críticas inaceitáveis para um agente:
  1. **Invisibilidade Quebrada:** Rodar comandos CLI com o aplicativo fechado força a abertura da janela (GUI) em tela cheia, roubando o foco do usuário no sistema operacional.
  2. **Fragilidade de Transporte:** Injetar blocos longos de Markdown com aspas e quebras de linha via interpretador de linha de comando (*shell*) frequentemente corrompe o texto.
  3. **Reatividade do Obsidian:** O motor moderno do Obsidian (CodeMirror 6) provou-se altamente elástico. Ao usarmos o `VaultFSSandbox` para sobrescrever um arquivo atômicamente no disco, o Obsidian detecta a alteração e atualiza a interface visual perfeitamente, sem perder o foco do cursor ou quebrar o histórico de *undo/redo*. Portanto, a intervenção de APIs gráficas é redundante e inferior à nossa Sandbox de disco.

## 4. Próximo Passo

O desenvolvimento do pacote `@jarvis/daemon` iniciará com a instalação do SDK da OpenAI, a configuração das chamadas de *Tool Calling* mapeando os motores do Marco 1 e a construção do Loop ReAct do Agente.