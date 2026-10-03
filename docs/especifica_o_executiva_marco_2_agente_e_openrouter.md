# JARVIS — Especificação Executiva do Marco 2 (M2)

**Foco:** Conexão OpenRouter, Loop ReAct e Consolidação do Handoff de Edição
**Status:** Especificação revisada; protótipo de streaming implementado, loop de ferramentas pendente
**Data:** 2026-10-03

Contratos atuais em [ARQUITETURA.md](../ARQUITETURA.md); execução em E08/E09 de [PLANO.md](../PLANO.md). O vault de destino ainda não está disponível neste computador.

## 1. O Que É o Entregável do Marco 2?

O Marco 2 conectará os motores do core ao OpenRouter pelo pacote `@jarvis/daemon`, já existente como protótipo. O agente deverá interpretar perguntas, buscar e ler notas, responder com fontes e preparar novas memórias ou atualizações de conhecimento. A execução do backend pode ocorrer em segundo plano, sem depender da Obsidian CLI. Toda gravação de nota permanece condicionada à aprovação humana explícita; execução em segundo plano não significa escrita autônoma.

O entregável consiste em:

1. **Cliente LLM:** Conector HTTP utilizando o SDK oficial da OpenAI (apontando para o OpenRouter).
2. **Registro de Ferramentas (Tool Registry):** A tradução das nossas funções TypeScript em um formato de *JSON Schema*.
3. **Loop de Agente (ReAct):** O motor que recebe a instrução, chama ferramentas localmente e interage com o modelo.

## 2. Catálogo de Ferramentas Expostas (Tools)

Ferramentas de consulta usam o core e o vault configurado. Ferramentas de proposta preparam dados em memória, sem gravar notas. Argumentos precisam de validação em runtime; desempenho será medido na homologação.

### A. Ferramentas de Percepção (Raciocínio via `jarvis/core`)
* `list_notes(directory?)`: Retorna notas permitidas no diretório solicitado.
* `read_note(relative_path)`: Retorna conteúdo normalizado e SHA-256 da leitura.
* `get_graph_neighborhood(relative_path)`: Retorna outlinks e backlinks, com relações tipadas quando presentes.
* `search_notes(query)`: Busca textual limitada, sem regex arbitrária no MVP; retorna trechos, caminhos e origem para fundamentar respostas.

### B. Ferramentas de Ação (Escrita baseada em Propostas)
* `propose_block_replace(relative_path, base_hash, search_block, replace_block)`: Prepara conteúdo e diff contra a versão lida. Após aprovação, o backend revalida o hash e aplica a proposta se continuar válida.
* `propose_create(relative_path, content)`: Prepara a criação sem gravar. Após aprovação, o backend garante que o destino continua ausente e publica a nova nota sem sobrescrever outra.

### C. Respostas e memória de conhecimento

1. Interpretar a solicitação e recuperar apenas contexto relevante, expandindo links quando necessário.
2. Referenciar as notas utilizadas e distinguir evidência, inferência e informação não encontrada.
3. Ao preparar memória, buscar registros relacionados para escolher criação ou atualização e evitar duplicação; preservar a origem e o contexto do conhecimento.
4. Exibir a proposta e aguardar aprovação; somente a aplicação bem-sucedida permite confirmar que a memória foi salva.
5. Após gravação, atualizar o índice. Uma nova sessão deve recuperar a memória pelo vault, mesmo sem acesso ao chat original.

Não há ferramenta de aprovação ou gravação direta acessível ao modelo. `VAULT.md` pode orientar organização e templates, sem dispensar aprovação ou ampliar os limites de acesso. Os exemplos de física/EPTA não definem o domínio do produto.

## 3. Decisões Técnicas Ratificadas

A fundação do Marco 2 está cimentada nas seguintes escolhas:

### Decisão 1: Cliente e Roteamento LLM
* **A Escolha:** SDK Oficial da OpenAI (`openai` npm package) apontado para a *Base URL* do OpenRouter.
* **Justificativa:** A API da OpenAI tornou-se o padrão de facto ("USB" da IA). Usar o SDK oficial permite que, no futuro, possamos apontar o JARVIS para modelos locais gratuitos (Ollama, LM Studio) ou outras APIs empresariais simplesmente trocando a URL, sem reescrever uma linha do código do agente.

### Decisão 2: O Comportamento de Streaming
* **A Escolha:** Abordagem Híbrida (Batching invisível + Streaming de texto final).
* **Justificativa:** O raciocínio do modelo e as chamadas de ferramentas (*tool calling*) ocorrem de forma invisível nos bastidores para evitar o colapso do parser JSON. Apenas a resposta de conversação final ao usuário é transmitida via *Server-Sent Events* (SSE), garantindo a sensação de fluidez na interface.

### Decisão 3: Rejeição da Obsidian CLI para Escrita (I/O Direto Vence)
* **A Escolha:** Após aprovação, gravar pelo `VaultFSSandbox`, sem automação da interface ou dependência da Obsidian CLI.
* **Justificativa:** Manter o acesso ao cofre sob um único contrato de validação e I/O, sem transportar conteúdo por comandos de shell. A atualização visual no Obsidian e seus efeitos sobre cursor/undo precisam ser testados em M5; não há garantia já comprovada no repositório.

## 4. Próximo Passo

Completar o registro/executor de ferramentas e o loop do agente com limites de contexto, rodadas e cancelamento. Validar com provedor simulado e cofre descartável, sem depender do vault real para os testes de desenvolvimento. A aplicação aprovada e a recuperação de memória após reinício serão concluídas em E12; o conteúdo e as convenções do vault de destino serão homologados em E17.
