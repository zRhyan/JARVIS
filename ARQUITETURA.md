# Arquitetura do JARVIS

Referência da Fase 1, consolidada em 2026-10-03. Este documento descreve a arquitetura pretendida e identifica os componentes que já existem. O andamento e as lacunas ficam em [PLANO.md](PLANO.md).

## 1. Objetivo e escopo

O JARVIS usa um vault Markdown específico, compatível com Obsidian, como seu cérebro de conhecimento e memória persistente. Ele deve interpretar o conteúdo, recuperar informações para responder perguntas, relacionar notas e incorporar novos conhecimentos ao mesmo vault. Toda criação ou alteração de nota, inclusive para guardar memória, é preparada como proposta e gravada somente após aprovação humana explícita, conforme a especificação original e a confirmação do usuário em 2026-10-03.

O vault de destino ainda não está disponível neste computador. Seu caminho, conteúdo, tamanho e convenções não foram inspecionados. Exemplos como `#física`, `mecanica.md` e os templates de área/conceito servem para testar capacidades, sem definir o assunto ou a estrutura obrigatória do vault real. O repositório de código do JARVIS não deve ser confundido com esse vault.

O conhecimento durável permanece no cofre e pode ser versionado com Git. O histórico bruto das conversas, credenciais e configurações ficam fora dele. Informações úteis de uma conversa podem ser consolidadas em notas de memória no vault após aprovação da proposta e recuperadas em conversas futuras. A recuperação inicial combina busca léxica com navegação por wikilinks, outlinks e backlinks. O arquivo opcional `VAULT.md`, na raiz do cofre, fornece convenções de tags, frontmatter e templates.

O MVP é um serviço local com interface no navegador, compatível com Windows e Linux. O acesso ao modelo ocorre via OpenRouter. Tauri, exposição como servidor MCP e outros provedores são possibilidades futuras, não entregas já implementadas.

### 1.1. Conexão com o vault de destino

O desenvolvimento usa cofres descartáveis até o vault real ser disponibilizado. A primeira conexão deve confirmar caminho e identidade, inventariar conteúdo e convenções e testar consultas somente de leitura. Não escolher uma pasta arbitrária, criar um substituto para o vault ausente ou reorganizar as notas automaticamente.

No MVP, o daemon precisa acessar o vault como diretório do sistema de arquivos. O mecanismo para disponibilizá-lo neste computador permanece por definir quando ele for conectado; isso não reabre a regra de aprovação para gravações. Validar com fixtures permite avançar na implementação, mas não comprova aderência ao conteúdo real.

## 2. Camadas e responsabilidades

Fluxo pretendido:

```text
Interface web (React + Vite + Tailwind)
        | HTTP / SSE com autenticação local
        v
Daemon (perfis, sessões, agente, ferramentas e propostas)
        |                         |
        v                         v
Core (sandbox, grafo, patches)   OpenRouter
        |
        v
Cofre Markdown no disco

Daemon -> SQLite e configurações na pasta do usuário do SO
```

| Pacote | Responsabilidade | Implementação atual |
| --- | --- | --- |
| `packages/core` | Acesso seguro ao cofre, hashes, indexação e transformação determinística de texto | `VaultFSSandbox`, `GraphIndex`, `applyPatch` e erros associados |
| `packages/daemon` | Integração LLM, execução de ferramentas, propostas, perfis, HTTP/SSE e sessões | CLI de demonstração, cliente com streaming e registro de ferramentas ainda desconectado |
| `packages/web` | Chat, seleção de perfil/modelo, histórico e revisão de propostas | Pacote ainda inexistente |

O core deve continuar utilizável sem interface web ou cliente LLM. O daemon coordena os serviços e controla a aplicação das propostas. A interface consome contratos do daemon e não acessa diretamente o sistema de arquivos.

### Arquivos para começar a leitura

- [vault-fs.ts](packages/core/src/vault-fs.ts): resolução de caminhos, listagem, leitura com hash e escrita por arquivo temporário seguido de rename.
- [graph-index.ts](packages/core/src/graph-index.ts): extração de tags, wikilinks e taxonomia para um índice em memória.
- [patch-engine.ts](packages/core/src/patch-engine.ts): substituição de um bloco com rejeição de busca ausente ou ambígua.
- [agent-loop.ts](packages/daemon/src/agent-loop.ts): chamada ao modelo e repasse dos chunks de streaming.
- [tool-registry.ts](packages/daemon/src/tool-registry.ts): schemas das ferramentas do protótipo.
- [chat-cli.ts](packages/daemon/src/chat-cli.ts): terminal, histórico em memória e cofre simulado.

## 3. Decisões técnicas

| Tema | Direção definida |
| --- | --- |
| Linguagem e runtime | TypeScript estrito, Node.js; o roadmap estabelece Node.js >= 20 |
| Organização | NPM Workspaces, com pacotes em `packages/*` |
| Testes | Vitest |
| Integração LLM | SDK `openai` configurado com a URL base do OpenRouter |
| Grafo | Índice derivado do vault em RAM; reconstrução na inicialização e antes de cada turno, com atualização após escrita própria; taxonomias específicas conforme o vault |
| Edição | Search/Replace determinístico, tolerante a diferenças de espaços e quebras de linha, com correspondência única |
| Serviço local | Fastify com HTTP/SSE restrito a `127.0.0.1` e token local, conforme a direção de implementação de E13; ainda não implementado |
| Persistência de conversas | SQLite com `better-sqlite3`, separado do cofre |
| Interface | Vite + React + Tailwind CSS, com componentes próprios |
| Diff | Biblioteca `diff` para unified diff e componente próprio para exibição, conforme E04/E16; ainda não implementados |

A tolerância a espaços foi ratificada na especificação M1 e detalha a correspondência originalmente descrita como exata. Ela não autoriza escolher arbitrariamente entre múltiplas ocorrências nem modificar trechos fora do bloco encontrado.

## 4. Regras de acesso ao cofre

Estas são exigências do produto. A implementação atual ainda tem lacunas listadas no plano.

- Toda leitura e escrita do agente deve passar pela sandbox e permanecer dentro do cofre ativo, inclusive diante de links simbólicos, junctions e particularidades de caminhos no Windows.
- Bloquear acesso a `.git`, `.obsidian`, `.jarvis`, `.jarvis-tmp` e `node_modules`, além dos arquivos de sistema especificados no M0: `.DS_Store`, `desktop.ini` e `Thumbs.db`. O uso interno de `.jarvis-tmp` cabe exclusivamente ao mecanismo de escrita.
- Trabalhar com UTF-8, normalizar CRLF para LF e expor caminhos relativos com `/`.
- Calcular SHA-256 do conteúdo normalizado na leitura e usar a mesma regra na validação de propostas.
- Não expor ferramentas de remoção ou movimentação de notas ao modelo.
- Executar I/O direto pelo backend, sem depender da Obsidian CLI ou de automação da interface do editor.

A gravação planejada usa arquivo temporário, flush e rename para o destino. O código atual usa temporário e rename, mas ainda não faz flush explícito. Atomicidade de substituição e durabilidade diante de falhas devem ser verificadas separadamente.

## 5. Grafo e recuperação de contexto

O índice deve resolver `[[Nota]]` e `[[Nota|Alias]]`, identificar referências de saída e reversas e permitir expansão a partir de notas-semente. Deve funcionar também em notas sem tags, sem frontmatter ou sem um template específico. A taxonomia dos exemplos históricos distingue:

- Áreas: `broader_field`, `coordinate_field`, `narrower_field`, `core_object` e `machinery`.
- Conceitos: `domain_field`, `presupposed_concept`, `coordinate_concept` e `derived_concept`.
- Referências: `source`, `main_note` e ligações genéricas.

Hoje, `GraphIndex` armazena notas adicionadas individualmente e extrai listas de strings para as relações de áreas e conceitos. Backlinks, resolução de destinos, varredura inicial do cofre e classificação de `source`/`main_note` ainda precisam ser implementados. E06 define reconstrução no início de cada turno e atualização após escrita própria. Assim, mudanças externas entram no próximo turno; leitura de notas e validação de aprovação consultam o disco. A estratégia ainda não está implementada e seu custo será medido no vault real.

Essas relações específicas só devem orientar o vault real quando suas convenções as utilizarem. O suporte genérico a texto, caminhos, links e propriedades não pode depender delas.

### 5.1. Recuperação para responder perguntas

O ciclo de recuperação aumentada para geração (RAG) é: interpretar a pergunta, buscar notas candidatas, expandir relações relevantes, ler os trechos necessários e responder com referência às notas utilizadas. Não é necessário enviar o vault inteiro ao modelo em cada pergunta. Os resultados devem incluir caminho, trecho/seção e versão ou hash para rastrear a origem do contexto.

As respostas devem separar o que está registrado no vault de inferências ou conhecimento geral do modelo. Se a informação não for encontrada, o agente deve dizer isso, sem apresentar conhecimento geral como lembrança do vault. Avaliar perguntas com outras palavras, múltiplas notas, contradições e ausência de informação, usando respostas esperadas e fontes conhecidas.

A primeira estratégia usa busca por texto, reformulações limitadas da pergunta e grafo. Busca vetorial não é condição para chamar esse fluxo de RAG; sua adoção deve depender de lacunas de recuperação medidas em conteúdo representativo do vault real. Não há evidência ainda de que a estratégia inicial seja suficiente para esse vault.

### 5.2. Memória de conhecimento no vault

Guardar memória significa criar ou atualizar notas persistentes, não apenas manter mensagens no contexto do chat. Para uma informação que deva ser lembrada:

1. Identificar o que o usuário quer registrar e distinguir informação fornecida, extraída de notas e inferida pelo modelo.
2. Procurar registros relacionados ou equivalentes antes de preparar uma nova nota.
3. Escolher criação ou atualização segundo a organização real do vault; não impor uma pasta ou taxonomia ainda desconhecida.
4. Preparar conteúdo com contexto suficiente, origem e vínculos relevantes. Preservar divergências em vez de substituir fatos conflitantes silenciosamente.
5. Mostrar a proposta e aguardar aprovação humana explícita; depois, aplicar as mesmas validações e proteção contra conflitos das demais notas.
6. Reindexar o conhecimento gravado para que uma nova sessão possa recuperá-lo sem depender da conversa original.

Respostas geradas pelo próprio modelo não se tornam fatos automaticamente. Consolidar memórias deve preservar sua origem e permitir corrigir ou atualizar o registro. O teste central é registrar uma informação, encerrar o processo e recuperá-la em uma conversa nova lendo o vault.

O sistema só confirma que guardou uma memória depois da gravação bem-sucedida (`APPLIED`). Antes disso, informa que a proposta está pendente; rejeição ou conflito não podem produzir confirmação de salvamento. Se o vault estiver desconectado, informar a indisponibilidade sem fingir leitura ou persistência.

## 6. Agente e ferramentas

O fluxo pretendido alterna chamadas ao modelo e execução local de ferramentas até obter uma resposta. A especificação M2 define execução das ferramentas em etapas completas, com streaming do texto final para a interface.

| Ferramenta pretendida | Contrato |
| --- | --- |
| `list_notes(directory?)` | Lista notas permitidas |
| `read_note(relative_path)` | Retorna conteúdo e hash da leitura |
| `search_notes(query)` | Busca texto, tags e propriedades do frontmatter |
| `get_graph_neighborhood(relative_path)` | Retorna outlinks e backlinks |
| `propose_block_replace(relative_path, base_hash, search_block, replace_block)` | Prepara alteração e diff sem gravar a nota |
| `propose_create(relative_path, content)` | Prepara criação; deve falhar se o destino já existir |

O protótipo declara apenas `read_note`, `search_graph` e `propose_edit`. O método `execute` não envia essas ferramentas ao modelo nem chama o `toolHandler`. Os nomes, argumentos e retornos do protótipo ainda precisam convergir para os contratos acima.

## 7. Ciclo de propostas

1. Ler a nota e registrar seu hash, ou validar a ausência do destino de uma criação.
2. Preparar a transformação em memória e calcular o unified diff.
3. Registrar a proposta como `PENDING` e apresentá-la ao usuário.
4. Se rejeitada, transicionar para `REJECTED` sem escrever.
5. Se aprovada, revalidar o conteúdo atual contra o hash-base. Uma divergência torna a proposta `STALE` e impede a aplicação. Para criação, revalidar que o destino continua ausente.
6. Aplicar a escrita segura e marcar `APPLIED` somente após sucesso; refletir a alteração no índice.

Tanto edições quanto criações exigem aprovação humana. A referência a I/O direto no M2 descreve o mecanismo de gravação do backend e não elimina esse requisito. Gerar um hash ou um texto modificado, isoladamente, não implementa controle de concorrência ou aprovação.

## 8. Perfis, persistência e limites

Cada perfil deve isolar cofre, chave de API, modelo e configurações de orçamento. Configurações e `jarvis.db` ficam em `~/.config/jarvis` no Linux ou `%APPDATA%\jarvis` no Windows, fora do cofre versionado.

O primeiro uso será com o vault de destino. O suporte a perfis permite outros ambientes no futuro sem exigir múltiplos vaults para operar. A raiz canônica de um perfil é imutável; trocar de vault exige outro perfil. Sessões e propostas preservam a identidade do cofre de origem, inclusive após reinício, para impedir aplicação em outro vault com caminhos ou conteúdos coincidentes.

E11 prevê `sessions` vinculadas a perfis e `messages` vinculadas a sessões, com conteúdo, ordem, datas e consumo de tokens. A persistência deve preservar também chamadas de ferramentas, seus identificadores e resultados, além de propostas e tentativas de aplicação. Esse formato ainda não foi implementado. Hoje o CLI mantém a conversa somente em memória e lê a chave de um `.env` de desenvolvimento.

| Tipo de informação | Local | Papel |
| --- | --- | --- |
| Conhecimento e memórias consolidadas | Notas Markdown no vault de destino | Fonte persistente para consultas futuras |
| Histórico de conversa e estado operacional | SQLite local, fora do vault | Continuidade de sessões, propostas e recuperação de falhas |
| Índice de busca e grafo | Estruturas derivadas reconstruíveis | Encontrar o conhecimento sem substituir as notas como fonte |

Excluir um histórico de chat não deve excluir o conhecimento já consolidado no vault. Reiniciar o processo ou reconstruir o índice não deve apagar essa memória.

A meta de memória em repouso inferior a 80 MB consta da especificação, mas ainda não foi medida. Desempenho do grafo, concorrência com Git e comportamento em Windows/Linux devem ser homologados, sem tratar metas como garantias já comprovadas.

## 9. Especificações de origem

- [Especificação de arquitetura e design da Fase 1](docs/especifica_o_de_arquitetura_e_design_jarvis_fase_1.md).
- [Roadmap e stack da Fase 1](docs/roadmap_de_desenvolvimento_e_stack_tecnol_gica_jarvis.md).
- [M0: fundação e sandbox](docs/especifica_o_executiva_marco_0_funda_o_e_sandbox.md).
- [M1: grafo e diff](docs/especifica_o_executiva_marco_1_grafo_e_diff.md).
- [M2: agente e OpenRouter](docs/especifica_o_executiva_marco_2_agente_e_openrouter.md).

As especificações detalhadas foram alinhadas a estes contratos em 2026-10-03. A auditoria preserva o diagnóstico anterior à revisão documental. Para o estado implementado, consulte o plano e confirme no código; atualizar um contrato não implementa a funcionalidade correspondente.
