# Plano de desenvolvimento do JARVIS

Estado de referência verificado em 2026-10-03. Leia primeiro [ARQUITETURA.md](ARQUITETURA.md) para conhecer as decisões e os limites do produto.

Para executar a conclusão do MVP, siga a **seção 5: Plano de implementação até a entrega**, anexada em 2026-10-03. As seções anteriores preservam o diagnóstico e o checklist por marco; a seção 5 define as entregas, dependências e verificações de execução.

## 1. Estado atual

O repositório contém os pacotes `core` e `daemon`. O núcleo tem componentes testados de arquivos, extração de relações e substituição de texto. O daemon é um protótipo de chat com streaming, cofre simulado e ferramentas ainda desconectadas do modelo.

**Esclarecimento de produto em 2026-10-03:** o JARVIS deve usar um vault determinado como cérebro RAG e memória persistente de conhecimento. Esse vault ainda não está disponível neste computador. Tags e notas dos testes são exemplos técnicos, não requisitos de domínio. A implementação com fixtures pode avançar; integração com as convenções e o conteúdo reais permanece pendente até o vault ser disponibilizado.

| Marco | Estado observado | O que falta para o objetivo do marco |
| --- | --- | --- |
| M0: fundação e sandbox | Implementação parcial, com testes básicos passando | Fechar lacunas de isolamento, durabilidade e configuração do projeto |
| M1: grafo e diff | Parser e substituição de blocos implementados | Indexação do cofre, resolução de links, backlinks e unified diff |
| M2: agente e OpenRouter | Cliente de streaming e CLI implementados | Loop de ferramentas, integração com cofre real e propostas estruturadas |
| M3: serviço, perfis e sessões | Não implementado | HTTP/SSE local, autenticação, perfis, SQLite e ciclo de aprovação |
| M4: interface web | Não implementado | Pacote web e fluxos de chat, histórico e revisão |
| M5: homologação | Não realizada | Concorrência com Git/Obsidian, Windows/Linux e uso em equipe |

O [changelog histórico](docs/CHANGELOG.md) declara M0 e M1 concluídos. A comparação com seus critérios de aceite mostra as pendências acima. Use evidências de código e testes para atualizar este quadro, sem assumir conclusão a partir desse registro histórico.

A [auditoria de documentos e código](docs/AUDITORIA.md), realizada em 2026-10-03, detalha os achados por prioridade, a matriz RF/RNF e as reproduções. Ela confirmou acesso externo por junction, acesso a `.git` por diferença de caixa e dois defeitos do motor de patches.

### Componentes já entregues, com limites verificados

- [x] Estruturar os workspaces `core` e `daemon`, ainda com pendências nos comandos gerais.
- [x] Implementar bloqueio textual de traversal e nomes protegidos; isolamento por destino real continua pendente.
- [x] Implementar leitura com hash SHA-256, conversão CRLF → LF, criação de subpastas e escrita via temporário + rename.
- [x] Implementar listagem recursiva básica de Markdown e limpeza do temporário após falha de rename, verificadas em cenários locais.
- [x] Extrair wikilinks, aliases, tags ASCII e relações dos templates de áreas/conceitos para memória.
- [x] Implementar substituição tolerante a espaços e rejeição de busca ausente/vazia ou repetida sem sobreposição.
- [x] Implementar cliente configurável por construtor, repasse de streaming e CLI com histórico em RAM.
- [x] Manter 11 testes unitários do core passando no Windows; isso não encerra os marcos M0/M1.

## 2. Sequência de execução

Preservar a ordem M0 → M1 → M2 → M3 → M4 → M5. O roadmap original distribui os marcos em seis semanas; essa distribuição é uma estimativa histórica, não um prazo revalidado. A primeira prioridade é fechar a fundação antes de conectar o agente a um cofre real.

### M0: consolidar a fundação

- [ ] Corrigir scripts dos workspaces: a raiz chama `build` inexistente nos dois pacotes e `test` inexistente no daemon.
- [ ] Ajustar o TypeScript do core: os testes estão incluídos fora do `rootDir` configurado como `src`.
- [ ] Corrigir a entrada `main` do daemon, que aponta para `src/index.ts` inexistente.
- [ ] Remover do versionamento os arquivos de `node_modules` e o cache de testes já rastreados, preservando manifests e lockfile.
- [ ] Rever as versões duplicadas do SDK `openai` na raiz e no daemon e suas responsabilidades de dependência.
- [ ] Validar destinos reais e ancestrais de caminhos, incluindo symlinks, junctions e diretórios ainda inexistentes na escrita.
- [ ] Corrigir o bloqueio de pastas protegidas diante de diferenças de caixa no Windows e completar a política de arquivos de sistema do M0.
- [ ] Garantir que `relativePath` seja relativo e canônico, inclusive quando a entrada contém caminho absoluto interno ou segmentos `.`/`..`.
- [ ] Implementar e verificar o protocolo de flush, rename e limpeza de temporários, incluindo falhas de gravação.
- [ ] Acrescentar testes das lacunas de isolamento e falhas de I/O; o teste atual chamado T02 cobre caminho absoluto externo, não symlink.

**Critério de conclusão:** comandos de instalação, teste e build utilizáveis; tentativas de fuga e acesso protegido bloqueadas; leitura/escrita com hashes e LF verificadas; falhas de I/O não deixam conteúdo parcial no destino. Registrar os sistemas operacionais efetivamente testados.

### M1: completar grafo e diff

- [ ] Construir o índice a partir da listagem e leitura de notas pela sandbox.
- [ ] Resolver destinos dos wikilinks e fornecer consultas de outlinks e backlinks, com tratamento explícito de referências ambíguas ou inexistentes.
- [ ] Completar as relações semânticas previstas, incluindo `source` e `main_note`, e o tratamento de frontmatter.
- [ ] Corrigir tags Unicode truncadas e definir tratamento de links com âncoras e exemplos dentro de blocos de código.
- [ ] Definir atualização do índice após escritas do JARVIS e mudanças externas no cofre.
- [ ] Corrigir a substituição para preservar literalmente o texto de `replaceBlock`, inclusive sequências como `$&`.
- [ ] Detectar correspondências sobrepostas: `a a` em `a a a` deve ser rejeitado como ambíguo.
- [ ] Gerar unified diff a partir do conteúdo original e do resultado calculado em memória.
- [ ] Expor os módulos necessários pela API pública do core; hoje `src/index.ts` exporta somente erros e sandbox.
- [ ] Verificar links cruzados, aliases, taxonomia, correspondência ausente/ambígua e preservação do conteúdo fora do bloco.

**Critério de conclusão:** notas de um cofre de teste têm relações navegáveis nos dois sentidos; uma proposta produz conteúdo e diff determinísticos sem gravar o arquivo.

### M2: conectar o agente ao núcleo

- [ ] Substituir `fakeFileSystem` por acesso ao cofre configurado via sandbox e índice real.
- [ ] Alinhar o registro às seis ferramentas descritas em `ARQUITETURA.md`, incluindo hashes nos retornos e propostas.
- [ ] Enviar os schemas ao modelo, validar argumentos, executar ferramentas e devolver seus resultados ao histórico do loop.
- [ ] Implementar o ciclo de chamadas com limites de execução e tratamento de erros, mantendo streaming da resposta final conforme a especificação M2.
- [ ] Carregar as convenções de `VAULT.md`, quando presente, e ajustar o prompt ao cofre ativo.
- [ ] Responder com fontes do vault, diferenciar informação recuperada de inferência e preparar memórias duráveis em Markdown por criação/atualização, procurando registros existentes antes de duplicar conhecimento.
- [ ] Remover do prompt genérico a preferência fixa pela Aviônica/EPTA e distinguir nota vazia de nota inexistente nos handlers.
- [ ] Produzir propostas estruturadas sem escrita automática, deixando a aplicação sob controle do fluxo de aprovação.
- [ ] Testar a integração com respostas simuladas do provedor e registrar separadamente eventual validação real do OpenRouter.

**Critério de conclusão:** pelo terminal, o agente consulta notas relacionadas por ferramentas e produz uma proposta revisável. O fluxo deve ser comprovado pela execução das ferramentas, não apenas pela resposta textual do modelo.

### M3: serviço local, perfis e aprovação

- [ ] Implementar servidor HTTP/SSE em `127.0.0.1` com token local.
- [ ] Persistir e alternar perfis fora do cofre, isolando chaves, modelos, caminhos e sessões.
- [ ] Criar SQLite local para sessões, mensagens e consumo de tokens, com formato compatível com o histórico de ferramentas.
- [ ] Expor operações de histórico e de aprovação/rejeição de propostas.
- [ ] Implementar estados `PENDING`, `APPLIED`, `REJECTED` e `STALE`, com revalidação de hash na aplicação e proteção contra sobrescrita em criações.
- [ ] Validar concorrência entre aprovações e alterações externas, além da atualização do grafo após aplicar mudanças.

**Critério de conclusão:** o serviço recupera sessões, alterna perfis sem misturar dados e só aplica propostas válidas após aprovação explícita; propostas obsoletas não sobrescrevem notas.

### M4: interface web local

- [ ] Criar `packages/web` com Vite, React e Tailwind CSS, usando componentes próprios.
- [ ] Implementar chat com Markdown e streaming, seleção de perfil/modelo e histórico de sessões.
- [ ] Apresentar unified diff e ações de aprovar/rejeitar, refletindo os estados reais do daemon.
- [ ] Verificar o fluxo completo do navegador ao arquivo e a atualização visível no Obsidian.

**Critério de conclusão:** o usuário consulta o cofre, revisa uma proposta e aplica a alteração pela interface, com tratamento de rejeição, erro e obsolescência.

### M5: homologação e entrega

- [ ] Exercitar `git pull`, edições no Obsidian e propostas pendentes em cenários concorrentes.
- [ ] Homologar instalação e operação no Windows e no Linux.
- [ ] Conectar e inventariar o vault de destino quando disponível; validar recuperação e memória entre sessões com seu conteúdo real, sem presumir a taxonomia dos exemplos.
- [ ] Medir memória em repouso e desempenho de indexação com tamanho de cofre registrado.
- [ ] Validar uso por dois membros com cofres sincronizados via Git.
- [ ] Preparar guia de instalação, configuração e uso; registrar limitações conhecidas.

**Critério de conclusão:** os cenários de equipe e concorrência passam sem sobrescrita silenciosa ou corrupção, com resultados reproduzíveis e documentação de uso.

## 3. Comandos e evidências

Executar a partir da raiz, salvo indicação contrária. Instale dependências com `npm ci`; existem dependências já rastreadas em `packages/*/node_modules`, por isso confira `git status` após a instalação e não inclua mudanças geradas por ela em commits de implementação.

| Comando | Situação verificada em 2026-10-03 |
| --- | --- |
| `npm run test --workspace=@jarvis/core` | Suíte do core: 11 testes passaram na execução via `npm test` |
| `npm test` | Core passou; comando geral falhou porque o daemon não tem script `test` |
| `npm run build` | Falhou: nenhum dos dois pacotes define `build` |
| `npx tsc --noEmit -p packages/core/tsconfig.json` | Falhou com TS6059 por testes fora do `rootDir` |
| `npx tsc --noEmit -p packages/daemon/tsconfig.json` | Verificação de tipos passou; isso não comprova integração das ferramentas |
| `npm run dev --workspace=@jarvis/daemon` | Comando disponível para o CLI; exige `OPENROUTER_API_KEY` e pode consumir a API |

A validação foi feita com Node.js 24.14.0 e npm 11.9.0 no Windows. As dependências foram instaladas com `npm ci --ignore-scripts --no-audit --no-fund`; o compilador foi chamado diretamente de `node_modules/typescript/bin/tsc`. Não houve validação real do OpenRouter nem execução no Linux.

Na revisão adicional de 2026-10-03, os comandos de teste/build/typecheck foram repetidos com os mesmos resultados. Foram reproduzidas leitura e sobrescrita externas por junction, leitura e sobrescrita de `.git/config` via `.GIT/config`, acesso aos três arquivos de sistema proibidos, retorno absoluto em `relativePath`, truncamento de tags Unicode e os defeitos de `$&` e correspondências sobrepostas no patch. Um cliente LLM simulado confirmou zero ferramentas enviadas e zero execuções do handler. Fixtures sintéticas foram removidas; os detalhes e limites estão na [auditoria](docs/AUDITORIA.md).

Ao mudar estes comandos ou corrigir uma pendência, atualize o resultado e a data. Uma tarefa só deve ser marcada como concluída quando sua implementação e sua verificação pertinente estiverem disponíveis.

## 4. Referências por etapa

- [Roadmap original da Fase 1](docs/roadmap_de_desenvolvimento_e_stack_tecnol_gica_jarvis.md): sequência dos marcos e critérios gerais.
- [Especificação M0](docs/especifica_o_executiva_marco_0_funda_o_e_sandbox.md): política da sandbox e cenários de teste.
- [Especificação M1](docs/especifica_o_executiva_marco_1_grafo_e_diff.md): taxonomia, índice em memória e motor de edição.
- [Especificação M2](docs/especifica_o_executiva_marco_2_agente_e_openrouter.md): integração LLM, ferramentas e estratégia de streaming.
- [Arquitetura original](docs/especifica_o_de_arquitetura_e_design_jarvis_fase_1.md): requisitos de perfis, persistência, propostas e interface.

## 5. Plano de implementação até a entrega

**Data:** 2026-10-03. **Estado:** planejado, execução ainda não iniciada.

**Objetivo:** entregar a Fase 1 utilizável no Windows e no Linux como cérebro de conhecimento do JARVIS: conectar o vault de destino, interpretar e recuperar seu conteúdo para responder com fontes, consolidar novos conhecimentos em notas e recuperá-los em sessões futuras. A interface permite conversar e revisar alterações; toda gravação de nota, inclusive memória, ocorre somente após aprovação humana explícita.

**Arquitetura:** preservar `core` para arquivos, grafo e transformações; usar `daemon` para o agente, propostas, perfis e persistência; criar `web` para os fluxos do usuário. O modelo recebe ferramentas de consulta e preparação de propostas, nunca uma ferramenta de aprovação ou gravação direta.

**Escopo:** 17 entregas verificáveis. Cada entrega deve ser dividida em commits pequenos durante a implementação, agrupando módulo e testes. Não há estimativa de duração revalidada; concluir uma entrega depende de evidência, não do número de arquivos produzidos.

**Pré-requisitos:** ler a auditoria, preservar alterações locais existentes e trabalhar com cofres descartáveis nos testes. O vault real não está conectado neste computador; não escolher uma pasta arbitrária nem tratar as notas simuladas como seu conteúdo. As validações automáticas devem funcionar sem credenciais. Usar o provedor real apenas na homologação explícita desse caminho, com limite de consumo registrado.

Ficam fora da implementação inicial: aplicativo Tauri, servidor MCP, busca vetorial, sincronização própria de arquivos, hospedagem pública, autenticação multiusuário e ferramentas de delete/move. O RAG inicial usa busca textual e grafo; se a avaliação do vault real mostrar recuperação insuficiente, registrar a necessidade e revisar o plano antes de adotar outra estratégia. As interfaces devem permitir essa evolução.

### Conexão futura com o vault de destino

O trabalho de código pode avançar com fixtures. Quando o vault estiver disponível, executar uma primeira conexão somente para leitura: confirmar caminho/identidade, inventariar notas, tamanho, links, anexos e convenções, ler `VAULT.md` se existir e validar perguntas representativas. No MVP, o daemon precisa acessar esse diretório no sistema de arquivos; a forma de trazê-lo ou disponibilizá-lo neste computador ainda não foi definida.

Nenhuma pasta de memória, taxonomia temática ou organização de notas será imposta antes de conhecer o vault. A aceitação deve incluir consulta ao conteúdo existente e criação/atualização de memória recuperável após reinício. A regra já definida na arquitetura original e reafirmada pelo usuário é: o JARVIS prepara a proposta, o usuário aprova e só então a memória é gravada no vault. Proposta rejeitada ou pendente não é conhecimento salvo.

### 5.1. Organização dos arquivos

Os caminhos novos abaixo são destinos planejados, não arquivos já existentes. Cada linha representa uma responsabilidade. Se houver necessidade de subdivisão adicional, manter os limites e registrar a mudança no plano.

| Arquivos a alterar ou criar | Responsabilidade |
| --- | --- |
| `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json` | Dependências, scripts, build ordenado e política de versionamento |
| `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/tsconfig.test.json`, `packages/core/vitest.config.ts` | Exportações e verificação do core |
| `packages/daemon/package.json`, `packages/daemon/tsconfig.json`, `packages/daemon/vitest.config.ts` | Entrada, build e testes do daemon |
| `packages/core/src/path-policy.ts`, `packages/core/src/vault-fs.ts`, `packages/core/src/errors.ts` | Isolamento de caminhos, leitura e publicação segura de arquivos |
| `packages/core/src/patch-engine.ts`, `packages/core/src/diff.ts` | Substituição literal e unified diff |
| `packages/core/src/note-parser.ts`, `packages/core/src/graph-index.ts`, `packages/core/src/search.ts` | Parsing, resolução de links, índice e busca |
| `packages/core/src/proposal.ts`, `packages/core/src/index.ts` | Contratos de proposta, preparação determinística e API pública |
| `packages/daemon/src/tool-registry.ts`, `packages/daemon/src/tool-executor.ts`, `packages/daemon/src/system-prompt.ts` | Schemas, validação, execução e convenções do cofre |
| `packages/daemon/src/agent-loop.ts`, `packages/daemon/src/chat-cli.ts` | Ciclo LLM, streaming final e validação pelo terminal |
| `packages/daemon/src/config.ts`, `packages/daemon/src/profiles.ts` | Pasta de dados do SO, configuração e isolamento de perfis |
| `packages/daemon/src/db.ts`, `packages/daemon/src/migrations.ts`, `packages/daemon/src/session-store.ts`, `packages/daemon/src/proposal-store.ts` | Banco local, migrações e recuperação de sessões/propostas |
| `packages/daemon/src/proposal-service.ts`, `packages/daemon/src/workspace-runtime.ts` | Aplicação aprovada, concorrência e serviços vinculados ao perfil |
| `packages/daemon/src/api-contract.ts`, `packages/daemon/src/server.ts`, `packages/daemon/src/index.ts` | Contratos HTTP/eventos, rotas e inicialização |
| `packages/web/package.json`, `packages/web/tsconfig.json`, `packages/web/vite.config.ts`, `packages/web/index.html` | Novo workspace e build da SPA |
| `packages/web/src/main.tsx`, `packages/web/src/App.tsx`, `packages/web/src/styles.css`, `packages/web/src/api.ts` | Entrada, composição, estilos e comunicação autenticada |
| `packages/web/src/components/Chat.tsx`, `SessionSidebar.tsx`, `ProfileSelector.tsx`, `ModelSelector.tsx`, `ProposalCard.tsx`, `DiffViewer.tsx` | Componentes na mesma pasta: conversa, navegação e revisão |
| `packages/core/test/{path-policy,vault-fs,patch-engine,diff,note-parser,graph-index,search,proposal}.test.ts` | Testes por módulo; nomes entre chaves representam arquivos separados |
| `packages/daemon/test/{tool-executor,agent-loop,knowledge-memory,profiles,session-store,proposal-store,proposal-service,workspace-runtime,server}.test.ts` | Testes por serviço e do ciclo de memória, com provedor simulado e diretórios descartáveis |
| `packages/daemon/test/fixtures/fake-provider.ts`, `packages/core/test/fixtures/` | Respostas simuladas e cofres de teste, sem dados pessoais |
| `packages/web/src/api.test.ts`, `packages/web/src/components/ProposalCard.test.tsx`, `packages/web/vitest.config.ts` | Contratos do cliente e estados da revisão |
| `playwright.config.ts`, `tests/e2e/jarvis.spec.ts`, `scripts/benchmark.ts`, `.github/workflows/ci.yml` | Fluxo completo, medições e execução Windows/Linux |
| `README.md`, `docs/VALIDACAO.md`, `docs/CHANGELOG.md`, `ARQUITETURA.md`, `PLANO.md` | Instalação, evidências, histórico e atualização do estado |

Dependências novas devem entrar no workspace que as usa, com versão compatível verificada na implementação. Direção de implementação: Fastify para HTTP, `better-sqlite3` para persistência, biblioteca `diff` para unified diff, parser YAML para frontmatter e convenções existentes de React/Vite/Tailwind para a web. Reutilizar Vitest e acrescentar Playwright para o fluxo do navegador. Nenhuma dependência do servidor ou chave de API deve entrar no bundle web.

### 5.2. Ordem, dependências e conclusão dos marcos

| Etapa | Entregas | Dependência para começar | Condição para avançar |
| --- | --- | --- | --- |
| Fundação, M0 | E01–E03 | Auditoria lida | Verificação do projeto funcional e isolamento testado |
| Conhecimento e propostas, M1 | E04–E07 | M0 concluído | Grafo navegável, busca e diff determinísticos |
| Agente, M2 | E08–E09 | M1 concluído | Ferramentas executadas sobre cofre de teste; proposta sem gravação |
| Serviço e estado, M3 | E10–E13 | M2 concluído | Perfis/sessões isolados e aplicação aprovada com recuperação |
| Produto no navegador, M4 | E14–E16 | API de M3 validada | Fluxo completo de configuração, conversa e revisão |
| Entrega, M5 | E17 | M0–M4 concluídos | Homologação, documentação e evidências de aceite |

Executar sequencialmente por padrão. E04 e E05 não dependem uma da outra, mas qualquer divisão de trabalho deve evitar edições simultâneas no índice de exportações, nos manifests e no lockfile.

Cada entrega segue o ciclo: registrar cenário de aceitação; reproduzir falha quando houver defeito; implementar; verificar casos de erro; executar o comando indicado; revisar o diff e registrar a entrega. Atualizar os checklists das seções 1/2 ao concluir o marco correspondente. Commitar somente os arquivos da entrega quando o fluxo de versionamento estiver em execução, sem incluir mudanças alheias.

Os comandos de E02 em diante dependem dos scripts criados por E01. Comandos de web, cobertura, E2E e benchmark são futuros e devem ser implementados nas entregas indicadas. Em caso de falha, corrigir ou registrar um impedimento real; não marcar a entrega como concluída nem ocultar o teste para obter sucesso.

### E01. Tornar instalação, build e verificação reproduzíveis

**Marco:** M0. **Resolve:** A07/A08. **Arquivos:** manifests e configurações da raiz, core e daemon; exportações do core; novo `daemon/test/agent-loop.test.ts` e fixture de provedor.

- [ ] Registrar o estado inicial do Git e os erros atuais de `npm test`, build e typecheck.
- [ ] Retirar do índice do Git somente os arquivos de `node_modules` e cache já identificados, mantendo dependências locais e manifests; confirmar a exclusão pelo `.gitignore`.
- [ ] Padronizar módulos e exportações compiladas: build do core antes do daemon, imports públicos, extensões compatíveis e entrada do daemon apontando para arquivo real. Preservar o modo de desenvolvimento via `tsx`.
- [ ] Separar typecheck de fontes/testes, acrescentar scripts `build`, `typecheck`, `test` e `test:coverage`, e instalar o provedor de cobertura compatível com o Vitest escolhido.
- [ ] Consolidar o SDK no daemon; registrar a versão Node suportada e validar o lockfile com instalação limpa. Usar a versão que será homologada, sem alegar suporte a versões não testadas.
- [ ] Acrescentar teste mínimo real do cliente simulado que verifica repasse de conteúdo e propagação de erro; não usar teste vazio nem `--passWithNoTests` para esconder a ausência de cobertura.
- [ ] Revisar o diff e registrar a base funcional, preservando os 11 testes existentes.

**Executar:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build`.

**Esperado:** todos terminam com código 0; o build não depende de arquivos TypeScript soltos em pacotes consumidores; nenhuma dependência instalada permanece rastreada. A ausência de chave não impede testes/build.

### E02. Fechar a política de caminhos

**Marco:** M0. **Depende de:** E01. **Resolve:** A01/A02/A05/A10. **Arquivos:** `core/src/path-policy.ts`, `core/src/vault-fs.ts`, testes correspondentes; erros tipados quando necessário.

- [ ] Transformar as reproduções da auditoria em testes: junction externa, pasta protegida com caixa diferente e os três arquivos de sistema proibidos.
- [ ] Verificar que esses testes falham contra a implementação atual.
- [ ] Centralizar raiz canônica, normalização de segmentos e validação de destinos/ancestrais reais; rejeitar entrada absoluta e retorno ambíguo, mantendo saída relativa com `/`.
- [ ] Adotar política conservadora no MVP: rejeitar symlinks/junctions no caminho de uma nota ou da pasta temporária, mesmo quando apontam para dentro; validar a raiz configurada e documentar essa restrição.
- [ ] Testar raiz inexistente, caminho vazio para listagem, separadores, prefixo de pasta irmã, diferenças de caixa e criação em ancestral ainda inexistente. Listagem não deve seguir links; acesso direto deve falhar explicitamente.
- [ ] Revisar os limites de corrida entre validação e uso. Revalidar antes de publicar, testar troca de ancestral e não afirmar proteção absoluta contra outro processo malicioso com acesso ao mesmo sistema de arquivos.
- [ ] Validar e registrar a correção, sem conectar o agente a um cofre real nesta entrega.

**Executar:** `npm run test --workspace=@jarvis/core -- test/path-policy.test.ts test/vault-fs.test.ts`.

**Esperado:** casos permitidos passam; todas as tentativas de acesso proibido falham sem ler nem alterar os arquivos sentinela externos. Executar os casos específicos de Windows e Linux na matriz de CI, sem contabilizar testes ignorados como aprovados.

### E03. Completar o protocolo de gravação

**Marco:** M0. **Depende de:** E02. **Arquivos:** `core/src/vault-fs.ts`, `core/src/errors.ts`, `core/test/vault-fs.test.ts`.

- [ ] Definir operações distintas de substituição e criação exclusiva, com erro tipado para destino existente; aprovação continua sendo responsabilidade do daemon.
- [ ] Criar testes de falha em gravação, flush e publicação, além de criação concorrente e nota vazia.
- [ ] Gravar temporários únicos em local validado no mesmo volume, sincronizar o arquivo e fechar handles antes da publicação; documentar a sincronização do diretório onde o SO a permitir.
- [ ] Publicar criação com mecanismo que não substitua um destino existente, inclusive se ele surgir durante a operação. Não usar apenas `exists` seguido de rename; validar a primitiva escolhida nos dois sistemas.
- [ ] Remover somente temporários pertencentes à operação; limpeza de inicialização não pode apagar gravações em andamento. Manter UTF-8, LF, hashes e conteúdo anterior em falhas pré-publicação.
- [ ] Testar falha após publicação separadamente: verificar o estado em disco antes de informar resultado, sem simular rollback com sobrescrita cega.
- [ ] Registrar as garantias medidas de atomicidade/durabilidade e as limitações do SO.

**Executar:** `npm run test --workspace=@jarvis/core -- test/vault-fs.test.ts`; depois `npm run typecheck`.

**Esperado:** criação concorrente nunca sobrescreve o vencedor; falha antes da publicação preserva o destino anterior; temporários não vazam; o conteúdo lido corresponde ao hash retornado.

### E04. Corrigir patches e gerar unified diff

**Marco:** M1. **Depende de:** E03. **Resolve:** A03/A04. **Arquivos:** `core/src/patch-engine.ts`, novo `core/src/diff.ts`, testes de patch/diff; exportações e dependência `diff`.

- [ ] Acrescentar regressões para `$&`, `$$`, texto com caracteres de regex e as duas ocorrências sobrepostas de `a a` em `a a a`.
- [ ] Reproduzir as falhas de literalidade/ambiguidade antes da correção.
- [ ] Substituir por intervalo/callback literal e contar todos os candidatos compatíveis, inclusive sobrepostos, mantendo a tolerância de espaços já ratificada.
- [ ] Rejeitar busca vazia, ausente ou ambígua; preservar todos os bytes normalizados fora do trecho selecionado e sinalizar operação sem alteração.
- [ ] Gerar unified diff do conteúdo original e proposto, com caminho relativo e tratamento de arquivo vazio, criação e ausência de newline final.
- [ ] Verificar que o diff corresponde exatamente ao conteúdo que será aplicado, expor a API pelo core e registrar a entrega.

**Executar:** `npm run test --workspace=@jarvis/core -- test/patch-engine.test.ts test/diff.test.ts`.

**Esperado:** os dois bugs da auditoria ficam cobertos; o mesmo par de conteúdos gera o mesmo diff; nenhuma função dessa entrega grava arquivos.

### E05. Completar o parser de notas

**Marco:** M1. **Depende de:** E03. **Resolve:** A06. **Arquivos:** novo `core/src/note-parser.ts`, `core/src/graph-index.ts`, `core/test/note-parser.test.ts`; dependência de YAML no core.

- [ ] Criar fixtures de vários domínios, incluindo notas livres sem template, notas de área/conceito, tags Unicode, frontmatter, alias, seção, bloco, embed e links em exemplos de código. Os exemplos não definem a estrutura exigida do vault real.
- [ ] Extrair parsing do índice para função pura, preservando as relações já reconhecidas e acrescentando `source`, `main_note` e ligações genéricas.
- [ ] Separar destino, alias e fragmento de `[[Nota#Seção|Rótulo]]`; não interpretar exemplos em blocos cercados ou código inline como relações reais.
- [ ] Ler tags Unicode e propriedades YAML sem reserializar ou modificar a nota original; deduplicar relações conforme destino e tipo.
- [ ] Tratar YAML inválido com diagnóstico por nota, mantendo o arquivo intacto; definir links vazios e fragmentos locais explicitamente.
- [ ] Validar a compatibilidade com os templates de exemplo e com notas genéricas; manter regras específicas opcionais para adaptação às convenções reais quando o vault for conectado.

**Executar:** `npm run test --workspace=@jarvis/core -- test/note-parser.test.ts test/graph-index.test.ts`.

**Esperado:** `#física` permanece `física`; aliases/fragmentos são separados; frontmatter válido é consultável e exemplos não criam backlinks falsos.

### E06. Construir grafo e busca sobre o cofre

**Marco:** M1. **Depende de:** E05. **Arquivos:** `core/src/graph-index.ts`, novo `core/src/search.ts`, testes correspondentes e API pública.

- [ ] Montar cofre de teste com caminhos explícitos, nomes repetidos, links quebrados e relações nos dois sentidos.
- [ ] Implementar `buildIndex`, consultas de outlinks/backlinks e resolução determinística: caminho explícito primeiro; basename somente quando único; ambiguidade retorna candidatos, sem escolher silenciosamente.
- [ ] Implementar busca literal sem regex arbitrária no MVP, por caminho/título, texto, tags e frontmatter; retornar trechos, seção, caminhos e hash de origem, com limite de resultados e ordenação estável. Permitir reformulações limitadas pelo agente quando a pergunta não usar as mesmas palavras da nota.
- [ ] Reconstruir o índice no início de cada turno do agente no MVP; após aplicação própria, atualizar a nota imediatamente. Adiar watcher/cache incremental até uma medição justificar sua complexidade.
- [ ] Tratar cofre vazio, nota removida durante leitura, erro de permissão e referências quebradas com diagnósticos, sem apresentar índice incompleto como completo.
- [ ] Testar edição externa entre turnos e registrar consistência observada; uma consulta dentro do turno usa o snapshot indexado, enquanto leituras e aprovação consultam o disco. Acrescentar perguntas com paráfrases, múltiplas fontes e resposta ausente, identificando falhas de recuperação em vez de escondê-las com conhecimento geral do modelo.

**Executar:** `npm run test --workspace=@jarvis/core -- test/graph-index.test.ts test/search.test.ts`.

**Esperado:** navegação bidirecional correta, ambiguidade explícita e busca limitada; uma alteração externa aparece no turno seguinte.

### E07. Preparar propostas estruturadas

**Marco:** M1. **Depende de:** E04/E06. **Arquivos:** novo `core/src/proposal.ts`, `core/test/proposal.test.ts`, `core/src/index.ts`.

- [ ] Definir tipos de criação/substituição com caminho relativo, hash-base quando aplicável, conteúdo proposto, hash proposto, diff e resumo; ID/perfil/sessão serão atribuídos pelo daemon.
- [ ] Testar proposta com hash divergente, busca ambígua, destino existente, conteúdo vazio e nenhuma alteração.
- [ ] Implementar preparação em memória reutilizando sandbox, patch e diff; criação deve validar destino ausente sem reservá-lo nem gravá-lo.
- [ ] Retornar erros tipados e dados serializáveis; o cliente nunca deve fornecer um diff como instrução de escrita.
- [ ] Verificar que conteúdo/hash/diff são coerentes e que o cofre permanece byte a byte igual depois de preparar uma proposta.
- [ ] Exportar os contratos e registrar M1 concluído somente após as verificações E04–E07.

**Executar:** `npm run test --workspace=@jarvis/core -- test/proposal.test.ts`; depois `npm run test --workspace=@jarvis/core`.

**Esperado:** proposta válida é revisável e não altera o disco; proposta inválida não vira conteúdo aplicável.

### E08. Conectar o catálogo de ferramentas

**Marco:** M2. **Depende de:** E07. **Arquivos:** `daemon/src/tool-registry.ts`, novos `tool-executor.ts` e `system-prompt.ts`, `daemon/test/tool-executor.test.ts`.

- [ ] Substituir o catálogo de protótipo pelas seis ferramentas de `ARQUITETURA.md`, com schemas e tipos de resultado alinhados.
- [ ] Validar argumentos em runtime antes de acessar o core; retornar envelopes de sucesso/erro com código, sem stack trace ou credenciais ao modelo.
- [ ] Implementar consultas contra sandbox/índice e preparação contra o motor de propostas; injetar um repositório em memória temporário para IDs e vínculo da proposta à sessão.
- [ ] Carregar `VAULT.md` pelo acesso permitido, com limite explícito de tamanho e indicação de ausência; remover a preferência Aviônica/EPTA do prompt genérico.
- [ ] Orientar o ciclo de memória pelas ferramentas existentes: buscar registros relacionados, ler, preparar criação/atualização com origem e vínculos, e informar o estado real da gravação. Não afirmar “memorizei” enquanto existir apenas uma proposta pendente; não impor `#física` nem templates específicos ao vault.
- [ ] Testar ferramenta inexistente, JSON inválido, caminho proibido, nota vazia, resposta limitada e criação/edição sem escrita.
- [ ] Verificar schemas, execução e resultados como um único contrato e registrar a entrega.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/tool-executor.test.ts`.

**Esperado:** seis ferramentas utilizáveis e nenhuma ferramenta de aprovação/gravação; erros previsíveis voltam ao agente como dados tipados.

### E09. Completar o loop do agente e o CLI real

**Marco:** M2. **Depende de:** E08. **Arquivos:** `daemon/src/agent-loop.ts`, `daemon/src/chat-cli.ts`, `daemon/test/agent-loop.test.ts`, fixture de provedor.

- [ ] Testar sequência modelo → leitura → vizinhança → proposta → resposta, incluindo IDs das chamadas e mensagens `tool` correspondentes.
- [ ] Testar respostas que citam notas realmente lidas, distinguem inferência de informação registrada e reconhecem ausência de evidência. Acrescentar pedido “guarde isso” que prepara memória com origem e checagem de duplicidade, sem gravar automaticamente.
- [ ] Implementar rodadas de ferramentas com respostas completas, preservando todas as chamadas/resultados no histórico; executar ferramentas sequencialmente no MVP.
- [ ] Usar uma chamada final separada em streaming, sem ferramentas, após encerrar a etapa de consulta. Registrar uso de todas as rodadas, inclusive a chamada final; não apresentar conteúdo intermediário como resposta definitiva.
- [ ] Definir limites configuráveis de rodadas, volume de contexto, tempo e saída; interromper com erro claro quando excedidos. Propagar cancelamento e impedir repetição automática de ferramentas com efeito de criar propostas.
- [ ] Trocar o cofre simulado por caminho explícito configurado no CLI, com fixtures por padrão nos testes; mostrar as propostas recebidas sem aplicá-las.
- [ ] Tratar falha parcial de stream, cancelamento e histórico incompleto sem armazenar resposta como concluída; remover a confusão entre nota vazia e inexistente.
- [ ] Validar o fluxo com provedor simulado e registrar M2, distinguindo esta evidência de uma chamada real ao OpenRouter.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/agent-loop.test.ts test/tool-executor.test.ts`.

**Esperado:** o provedor recebe schemas, o handler é chamado, o modelo recebe resultados e emite proposta real; limites e falhas não geram escrita no cofre.

### E10. Implementar configuração e perfis

**Marco:** M3. **Depende de:** E09. **Arquivos:** novos `daemon/src/config.ts`, `profiles.ts`, `daemon/test/profiles.test.ts`.

- [ ] Resolver diretório de dados por SO e permitir substituição explícita somente para testes/desenvolvimento.
- [ ] Persistir perfis com ID, nome, raiz canônica, modelo e credencial fora do cofre; salvar configuração de forma segura e limitar acesso ao usuário do SO onde suportado. A raiz de um perfil é imutável após criação: trocar de cofre exige outro perfil, com outro ID.
- [ ] Validar diretório escolhido e não criar silenciosamente um cofre vazio por erro de digitação; guardar configurações de limites do agente por perfil.
- [ ] Definir seleção/configuração de modelos sem fixar o CLI a um único nome. Verificar disponibilidade e suporte a ferramentas na homologação; não prometer compatibilidade por apenas aceitar uma string.
- [ ] Retornar dados públicos de perfil sem chave; aceitar substituição de credencial sem reenviar seu valor ao navegador ou registrá-lo em logs.
- [ ] Testar dois perfis, configuração inválida, credencial ausente e isolamento. Rejeitar alteração da raiz de perfil existente, inclusive por edição externa da configuração ao reiniciar; confrontar a identidade persistida no banco a partir de E11. Registrar a entrega.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/profiles.test.ts`.

**Esperado:** perfis persistem após reinício; API pública do módulo não devolve segredo; cada perfil resolve apenas seu cofre.

### E11. Persistir sessões e propostas

**Marco:** M3. **Depende de:** E10. **Arquivos:** `daemon/src/db.ts`, `migrations.ts`, `session-store.ts`, `proposal-store.ts` e testes de stores.

- [ ] Criar migrações versionadas com chaves estrangeiras e banco na pasta de dados do SO; instalação com `better-sqlite3` deve ser testada nos dois sistemas.
- [ ] Persistir sessões por perfil e mensagens em ordem, preservando `tool_calls`, `tool_call_id`, papel `tool`, modelo, uso de tokens e estado de resposta interrompida.
- [ ] Manter distinta a memória de conhecimento: informação consolidada é uma nota no vault; SQLite guarda histórico e estado operacional, sem se tornar a única fonte de fatos que o usuário pediu para lembrar.
- [ ] Persistir propostas com ID, perfil/sessão, identidade do cofre de origem, conteúdo revisado, hashes, diff e os quatro estados públicos; não guardar somente uma string de apresentação. Registrar a raiz canônica por ID de perfil no banco para detectar reconfiguração indevida ao reiniciar.
- [ ] Implementar listar/criar/carregar/excluir sessões com isolamento por perfil; excluir conversa não altera notas do cofre.
- [ ] Testar reinício, migração, sessão vazia, IDs de outro perfil e histórico de ferramentas reconstruído para o SDK.
- [ ] Implementar transações para operações somente de banco e uma interface de registro de aplicação para E12; não tratar SQLite e filesystem como uma única transação atômica.
- [ ] Validar e registrar a entrega.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/session-store.test.ts test/proposal-store.test.ts`.

**Esperado:** recuperar uma sessão reproduz a ordem e o conteúdo necessários ao agente; consultas cruzadas são rejeitadas; propostas continuam revisáveis após reinício.

### E12. Aplicar propostas com aprovação, conflitos e recuperação

**Marco:** M3. **Depende de:** E03/E07/E11. **Arquivos:** `daemon/src/proposal-service.ts`, `proposal-store.ts`, `daemon/test/proposal-service.test.ts`.

- [ ] Implementar `approve(id)` e `reject(id)` acessíveis somente ao usuário via API, vinculados ao perfil/sessão, à identidade do cofre de origem e ao conteúdo persistido. Recusar aplicação se o perfil resolver para outro cofre, mesmo que caminho relativo e hash coincidam.
- [ ] Serializar operações do JARVIS por caminho canônico e impedir aplicação concorrente da mesma proposta. Uma repetição de aprovação deve devolver o estado existente sem regravar.
- [ ] Antes de publicar edição, reler e comparar o hash-base; antes de criar, usar publicação exclusiva. Mudança ou colisão torna a proposta `STALE`; rejeição não escreve.
- [ ] Registrar intenção de aplicação antes do I/O e conclusão depois; após reinício, reconciliar hashes em disco sem repetir cegamente a escrita. Manter os quatro estados públicos e registrar falhas/tentativas separadamente.
- [ ] Testar duas propostas da mesma base, dois cliques de aprovação, arquivo removido, arquivo criado por outro processo e falhas antes/depois da publicação. Cobrir tentativa de redirecionar perfil de A para B com proposta pendente, inclusive após reinício e com notas de conteúdo-base idêntico; nenhuma alteração pode atingir B.
- [ ] Testar edição externa entre preparação e aplicação. Revalidar imediatamente antes da publicação, documentando que mutex local não bloqueia Obsidian/Git; não declarar compare-and-swap atômico que o filesystem não oferece.
- [ ] Atualizar o índice após sucesso e validar que o conteúdo aplicado é exatamente o conteúdo revisado.
- [ ] Criar `daemon/test/knowledge-memory.test.ts`: registrar conhecimento via proposta aprovada, reiniciar, abrir sessão sem histórico anterior e recuperar a informação pelo vault. Cobrir atualização de memória, candidato duplicado, contradição e falha/rejeição sem falsa confirmação de que foi salvo.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/proposal-service.test.ts test/knowledge-memory.test.ts`.

**Esperado:** somente uma aplicação por proposta; colisões conhecidas falham sem sobrescrita; reinício não duplica alterações; falha não aparece como sucesso. Se persistir janela de corrida com escritores externos, registrá-la explicitamente na homologação e na documentação, sem declarar garantia absoluta de ausência de perda.

### E13. Expor o serviço local e os eventos

**Marco:** M3. **Depende de:** E09–E12. **Arquivos:** `daemon/src/workspace-runtime.ts`, `api-contract.ts`, `server.ts`, `index.ts`, testes de runtime/servidor.

- [ ] Compor runtime por perfil com sandbox, índice, agente e stores; fixar perfil/modelo de cada execução mesmo se o usuário mudar a seleção visual.
- [ ] Implementar Fastify somente em `127.0.0.1`, servindo a SPA no mesmo serviço quando compilada e usando token de sessão local. Rejeitar origens inesperadas e requisições sem autorização.
- [ ] Definir rotas de saúde, perfis, sessões/mensagens, envio/cancelamento de chat, modelos e aprovação/rejeição de proposta, com validação de corpo e de vínculo entre IDs.
- [ ] Definir eventos `text_delta`, `proposal_created`, `usage`, `done` e `error`, com identificador da execução e encerramento único; desconexão deve cancelar ou marcar execução interrompida de forma consistente.
- [ ] Implementar inicialização da sessão do navegador sem segredo embutido no bundle: token entregue pelo lançador local em fragmento temporário, removido da URL e usado em memória; reconexão após reload exige novo bootstrap local. Nunca colocar chave OpenRouter nesse fluxo.
- [ ] Testar autenticação/origem, troca de perfil durante stream, payload inválido, sessão inexistente, cancelamento e reinício, usando injeção de servidor/provedor simulado.
- [ ] Criar scripts de início do serviço e registrar M3 somente após verificar persistência e aplicação pelo contrato HTTP.

**Executar:** `npm run test --workspace=@jarvis/daemon -- test/workspace-runtime.test.ts test/server.test.ts`; depois `npm run build`.

**Esperado:** serviço compilado inicializa, usa apenas loopback e mantém isolamento; testes de stream terminam sem processos/handles pendentes; aprovação por requisição sem token é rejeitada.

### E14. Criar a base da interface

**Marco:** M4. **Depende de:** E13. **Arquivos:** manifests/configurações do workspace web, `index.html`, `src/main.tsx`, `App.tsx`, `styles.css`, `api.ts`, `api.test.ts` e configuração Vitest.

- [ ] Criar workspace Vite/React/Tailwind com scripts de desenvolvimento, build, typecheck e teste integrados à raiz; configurar proxy local de desenvolvimento.
- [ ] Implementar cliente HTTP/stream tipado pelo contrato da API, mantendo dependências de servidor fora do bundle; usar `fetch` com token para streaming autenticado.
- [ ] Implementar consumo do bootstrap local, estados de conexão e tratamento de sessão expirada, sem persistir chaves do provedor no navegador.
- [ ] Montar estrutura acessível para perfis, histórico, chat e propostas, com estados vazios/carregando/erro e navegação por teclado.
- [ ] Testar chunks fragmentados, evento de erro, encerramento e cancelamento no cliente; limitar renderização de Markdown a conteúdo seguro, sem executar HTML ou scripts de notas/modelo.
- [ ] Validar build e conexão com servidor simulado; registrar a entrega.

**Executar:** `npm run test --workspace=@jarvis/web -- src/api.test.ts`, `npm run typecheck`, `npm run build`.

**Esperado:** SPA compilada é servida pelo daemon; nenhuma chave OpenRouter ou dependência SQLite/Node aparece no bundle.

### E15. Entregar configuração, chat e histórico

**Marco:** M4. **Depende de:** E14. **Arquivos:** `web/src/components/Chat.tsx`, `SessionSidebar.tsx`, `ProfileSelector.tsx`, `ModelSelector.tsx`, `web/src/App.tsx`.

- [ ] Implementar criação de perfil com nome, caminho do cofre, modelo e entrada de credencial. Na edição, permitir nome/modelo/credencial, mantendo o caminho imutável; para outro cofre, orientar a criação de outro perfil. Exibir erros do servidor sem repetir a chave.
- [ ] Implementar criar/carregar/excluir conversas, com confirmação somente para exclusão da conversa e indicação de que as notas não são afetadas.
- [ ] Implementar envio, resposta em streaming, interrupção e recuperação de histórico; impedir dois envios simultâneos na mesma sessão no MVP.
- [ ] Vincular resposta e propostas à sessão de origem; trocar perfil/modelo não deve deslocar mensagens em andamento para outra conversa.
- [ ] Exibir erros acionáveis de conexão, configuração, limite e provedor; permitir cópia e leitura do Markdown sem depender de logs técnicos.
- [ ] Validar fluxos de primeira configuração, cofre vazio, reconexão e duas sessões antes de registrar a entrega.

**Executar:** `npm run typecheck`, `npm run build` e cenário E2E de chat criado em E17 durante a integração desta entrega.

**Esperado:** primeira utilização não exige editar código; conversa recarregada preserva mensagens e modelo; mudar perfil não mistura históricos.

### E16. Entregar revisão e aplicação visual

**Marco:** M4. **Depende de:** E12/E15. **Arquivos:** `web/src/components/ProposalCard.tsx`, `DiffViewer.tsx`, `ProposalCard.test.tsx`, integração em `Chat.tsx`.

- [ ] Exibir caminho, resumo e unified diff exatamente como preparados pelo backend, incluindo criação e arquivo vazio.
- [ ] Implementar aprovar/rejeitar por ID, sem reenviar texto editável como comando de gravação; desabilitar ações enquanto a operação está em andamento.
- [ ] Renderizar estados `PENDING`, `APPLIED`, `REJECTED` e `STALE`; erro de rede não deve ser interpretado como rejeição ou sucesso.
- [ ] Ao reencontrar proposta obsoleta, oferecer uma nova solicitação ao agente; nunca aplicar automaticamente sobre a versão atual.
- [ ] Testar aprovação repetida, rejeição, conflito e resposta tardia ao trocar de conversa, com conteúdo real do arquivo verificado pelo E2E.
- [ ] Validar teclado, legibilidade do diff e feedback de erro; registrar M4 somente após o fluxo completo.

**Executar:** `npm run test --workspace=@jarvis/web -- src/components/ProposalCard.test.tsx`; depois `npm run typecheck` e `npm run build`.

**Esperado:** o usuário identifica o que mudará e vê o resultado real; proposta rejeitada/obsoleta não altera o arquivo.

### E17. Homologar e preparar a entrega

**Marco:** M5. **Depende de:** E01–E16. **Arquivos:** `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/e2e/jarvis.spec.ts`, `scripts/benchmark.ts`, `README.md`, `docs/VALIDACAO.md` e documentos de estado.

- [ ] Introduzir o harness E2E já na integração de E15/E16: lançar daemon/web com cofre descartável, porta livre e provedor simulado, sem dependência de API paga. Executar os testes de UI antes de encerrar essas entregas.
- [ ] Criar CI Windows/Linux para instalação limpa, typecheck, testes, build e E2E, com limpeza dos processos e fixtures. Registrar explicitamente qualquer cenário que exija privilégios para symlinks.
- [ ] Quando o vault de destino estiver disponível, confirmar sua identidade, fazer inventário inicial somente para leitura e adequar convenções de notas/memória. Sem esse acesso, registrar o produto como validado com fixtures, não homologado para o vault real.
- [ ] Cobrir o fluxo configurar perfil → consultar duas notas → gerar proposta → revisar → aprovar → verificar disco → reiniciar → recuperar histórico; cobrir também rejeição, obsolescência, criação concorrente e isolamento de perfis.
- [ ] Fazer ensaios com Git/Obsidian reais em cofre de homologação e uso por dois membros, registrando versões e resultados. Validar cursor/undo e não presumir o comportamento descrito no documento histórico.
- [ ] Validar o OpenRouter com modelo e limite de uso registrados, incluindo ferramentas e streaming. Falta de credencial deve ser registrada como homologação pendente, sem bloquear os testes automáticos com provedor simulado.
- [ ] Construir avaliação de recuperação com perguntas e fontes esperadas do vault real, incluindo paráfrases, relações entre notas, informação ausente e contradições. Validar também “registrar conhecimento → aplicar → reiniciar → perguntar em nova sessão”, com a resposta fundamentada na nota gravada; registrar resultados e lacunas por caso.
- [ ] Criar benchmark com cofre sintético de tamanho/bytes declarados, tempo de indexação, busca, RSS em repouso e após uso. Comparar a memória com a meta original de 80 MB; se não atender, corrigir ou obter revisão explícita da meta antes de declarar cumprimento.
- [ ] Publicar guia de instalação, configuração, execução, backup de configurações/banco, diagnóstico e limitações de concorrência; atualizar changelog sem reescrever a auditoria histórica como se os problemas nunca tivessem existido.
- [ ] Executar a bateria final, revisar cobertura e atualizar o aceite por requisito em `docs/VALIDACAO.md`, com data, ambiente, comando/cenário e resultado.

**Executar:** `npm ci`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, `npm run benchmark`.

**Esperado:** verificações automáticas passam nos dois sistemas; os cenários críticos de isolamento/concorrência são cobertos independentemente da porcentagem global. Buscar pelo menos 80% de cobertura de linhas e branches de core/daemon, incluindo arquivos não importados pelos testes; cobertura não substitui os cenários de aceite. Guia permite iniciar o produto a partir de checkout limpo.

### 5.3. Critérios finais de pronto

- [ ] A01–A10 têm correção e evidência ou decisão explícita documentada; falhas altas de sandbox/patch não podem ser aceitas como concluídas.
- [ ] RF-01/RF-02: agente responde com base em notas e propõe manutenção sem inventar acesso a arquivos.
- [ ] O vault de destino foi conectado e suas convenções foram verificadas; exemplos de teste não viraram restrições do domínio.
- [ ] Conhecimento novo consolidado no vault é recuperável após reinício e sem histórico do chat original; respostas indicam fontes e distinguem lacunas/inferências de memória registrada.
- [ ] RF-03/RF-04/RF-05: diff revisável, aprovação explícita, criação sem sobrescrita, idempotência e detecção de obsolescência demonstradas.
- [ ] RF-06/RF-07/RF-10: dois perfis, troca de modelo e sessões recuperadas após reinício sem mistura de dados.
- [ ] RF-08/RF-09: navegação por links/backlinks e interface web completas.
- [ ] RNF-01/RNF-02: Windows/Linux, UTF-8/LF e comportamentos de caminhos homologados nas versões declaradas.
- [ ] RNF-03: credenciais fora do cofre, ausentes do bundle, dos retornos públicos e dos logs.
- [ ] RNF-04: busca e expansão pelo grafo operantes, limites de contexto/rodadas aplicados e memória medida contra a meta.
- [ ] RNF-05: core utilizável sem web/LLM e transporte HTTP/SSE validado; Tauri/MCP permanecem evolução futura.
- [ ] OpenRouter, Git/Obsidian e uso em equipe têm resultados registrados; o MVP não é declarado homologado enquanto esses ensaios estiverem pendentes.
- [ ] `ARQUITETURA.md` reflete as decisões implementadas; as seções 1/2 deste plano refletem o estado final; `docs/VALIDACAO.md` contém limitações reais e evidências.

### 5.4. Como registrar o avanço

Ao encerrar cada entrega, adicionar uma linha à tabela abaixo. Manter o status “não iniciada” até existir implementação; documentos e scaffolding, isoladamente, não encerram a entrega.

| Entrega | Estado inicial | Evidência exigida para conclusão |
| --- | --- | --- |
| E01 | Não iniciada | Instalação, build, typecheck e testes com saída 0 |
| E02 | Não iniciada | Regressões de acesso externo/protegido bloqueadas |
| E03 | Não iniciada | Falhas de I/O e criação concorrente sem sobrescrita |
| E04 | Não iniciada | Patches literais, ambiguidade rejeitada e diff correto |
| E05 | Não iniciada | Fixtures de parser e tags Unicode passando |
| E06 | Não iniciada | Busca/backlinks e atualização entre turnos passando |
| E07 | Não iniciada | Propostas coerentes sem alteração do disco |
| E08 | Não iniciada | Seis ferramentas validadas e executáveis |
| E09 | Não iniciada | Fluxo LLM simulado completo com limites/cancelamento |
| E10 | Não iniciada | Perfis persistentes e isolados |
| E11 | Não iniciada | Histórico/propostas recuperados após reinício |
| E12 | Não iniciada | Aprovação, conflito e recuperação de aplicação passando |
| E13 | Não iniciada | API autenticada e streaming por perfil passando |
| E14 | Não iniciada | SPA compilada e cliente de eventos validado |
| E15 | Não iniciada | Configuração/chat/histórico aprovados no E2E |
| E16 | Não iniciada | Revisão/aplicação/rejeição/conflito aprovados no E2E |
| E17 | Não iniciada | Matriz final de aceite e homologação registrada |
