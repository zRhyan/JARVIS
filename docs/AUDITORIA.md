# Auditoria de documentos e implementação

Data: 2026-10-03. Código de referência: commit `2ddfc32`, com os documentos de entrada ainda não commitados. Escopo: fontes, testes, manifests, configurações TypeScript, arquitetura, roadmap, especificações M0/M1/M2 e changelog.

**Nota de atualização documental:** este relatório preserva as evidências e os textos examinados no momento da auditoria. As especificações e o changelog foram revisados posteriormente em 2026-10-03 para explicitar o vault como memória de conhecimento, a aprovação de toda gravação e os contratos consolidados em [ARQUITETURA.md](../ARQUITETURA.md). Assim, algumas divergências documentais descritas na seção 5 já foram esclarecidas; os defeitos de código continuam pendentes em [PLANO.md](../PLANO.md). A revisão documental não representa nova execução dos testes nem correção da implementação.

**Resultado:** há componentes funcionais de M0/M1 e um protótipo de streaming em M2. Nenhum desses marcos atende integralmente aos seus critérios de aceite. A sandbox permite acesso fora do cofre e a diretórios protegidos em cenários reproduzidos no Windows. O agente ainda não consulta o cofre por ferramentas.

## 1. O que está feito e foi verificado

| Entrega | Evidência | Limite da conclusão |
| --- | --- | --- |
| Monorepo com core e daemon | Manifests com NPM Workspaces e dependência do daemon no core | Os comandos gerais de teste/build ainda falham |
| Bloqueio de `../` e caminhos absolutos externos | Testes da sandbox e verificação adicional | Não bloqueia fuga por junction |
| Bloqueio literal de `.git`, `.obsidian` e `.jarvis` | Testes em `vault-fs.test.ts` | Não cobre diferenças de caixa no Windows |
| Leitura com SHA-256 e normalização CRLF → LF | Testes e leitura do arquivo efetivamente gravado | Não existe validação de proposta obsoleta |
| Criação de subpastas e substituição por temporário + rename | Testes e inspeção do diretório temporário | Não há flush explícito nem ensaio de queda de energia |
| Limpeza do temporário em falha de rename | Verificação adicional: destino era um diretório; erro propagado e temporário removido | Um cenário de falha, sem comprovar todas as falhas de I/O |
| Listagem recursiva de `.md` com filtros básicos | Teste existente | A chamada direta para uma junction também lista arquivos externos |
| Tags ASCII, wikilinks, remoção de alias e taxonomia dos templates | Dois testes de `GraphIndex` | Extração de strings, sem resolver caminhos ou backlinks |
| Search/Replace tolerante a espaços | Três testes de patch; verificações de busca vazia, ausente e repetida | Há falhas de literalidade e ambiguidade sobreposta |
| Cliente LLM configurável por construtor e repasse de streaming | Código e execução com cliente simulado | Não foi feita chamada real ao OpenRouter |

O core permanece separado do SDK do modelo. Também não há ferramentas de delete/move expostas. São decisões arquiteturais já refletidas na estrutura atual.

## 2. Implementações com problemas

Prioridade alta: corrigir antes de conectar o agente a um cofre real. Prioridade média: corrigir ao completar o respectivo módulo. A indicação “reproduzido” significa execução local com dados sintéticos; “inspeção” significa evidência no código sem ensaio completo do comportamento.

### A01. Alta: a sandbox permite ler e escrever fora do cofre

**Reproduzido.** Em uma pasta de teste, foi criada uma junction `vault/atalho` apontando para a pasta irmã `outside`. `readNote('atalho/nota.md')` leu a nota externa e `writeAtomic('atalho/nota.md', ...)` sobrescreveu essa nota. `listMarkdownFiles('atalho')` também listou o arquivo externo.

**Causa:** [vault-fs.ts](../packages/core/src/vault-fs.ts), linhas 31–50, usa `resolve` e comparação textual de prefixo, sem verificar o destino real dos componentes do caminho. Leitura e escrita confiam nessa validação nas linhas 89 e 112.

**Requisito violado:** isolamento do M0 e cenário T02 da [especificação da sandbox](especifica_o_executiva_marco_0_funda_o_e_sandbox.md). O teste T02 implementado verifica um caminho absoluto externo, não um symlink.

**Correção necessária:** validar caminhos reais e ancestrais existentes, incluindo destino e pasta temporária, e definir proteção contra mudanças de links entre validação e operação. Cobrir leitura, escrita, listagem e criação de subpastas. O ensaio confirmou junction no Windows; não constitui uma validação de todos os tipos de symlink nos dois sistemas.

### A02. Alta: diferenças de caixa contornam diretórios protegidos

**Reproduzido.** Foram lidos e sobrescritos dados sintéticos de `.git/config` usando o argumento `.GIT/config` no Windows.

**Causa:** [vault-fs.ts](../packages/core/src/vault-fs.ts), linha 45, compara segmentos com `PROTECTED_DIRS.includes(segment)` de forma sensível a maiúsculas/minúsculas, enquanto o sistema de arquivos usado no ensaio tratou ambos os caminhos como o mesmo destino.

**Impacto:** um caminho aceito pode modificar configurações do Git ou do Obsidian, contrariando a política do M0. Corrigir a comparação conforme a semântica do sistema de arquivos e acrescentar testes de leitura/escrita.

### A03. Alta: o patch modifica o texto de substituição

**Reproduzido.** `applyPatch('antes alvo depois', 'alvo', 'NOVO $&')` devolve `antes NOVO alvo depois`, em vez de preservar o `$&` literal.

**Causa:** [patch-engine.ts](../packages/core/src/patch-engine.ts), linha 46, passa o texto diretamente como segundo argumento de `String.replace`, que interpreta sequências especiais de substituição.

**Impacto:** o resultado pode diferir silenciosamente da proposta, inclusive em notas com exemplos de código. Usar substituição literal, como callback ou composição por índices, e testar caracteres especiais.

### A04. Alta: correspondências sobrepostas escapam da rejeição de ambiguidade

**Reproduzido.** Em `a a a`, o bloco `a a` ocorre nas posições 0 e 2. `applyPatch('a a a', 'a a', 'X')` devolve `X a`, embora devesse rejeitar a escolha ambígua segundo o contrato de correspondência única.

**Causa:** [patch-engine.ts](../packages/core/src/patch-engine.ts), linhas 33–42, conta apenas as ocorrências não sobrepostas produzidas pelo regex global.

**Correção necessária:** detectar também candidatos sobrepostos antes de aplicar o patch. Acrescentar um teste de regressão desse caso, além do caso já coberto de ocorrências separadas.

### A05. Média: a política de arquivos de sistema não foi aplicada

**Reproduzido.** `writeAtomic` e `readNote` aceitaram `.DS_Store`, `desktop.ini` e `Thumbs.db` no cofre sintético. A especificação M0 proíbe leitura e escrita nesses arquivos.

**Causa:** [vault-fs.ts](../packages/core/src/vault-fs.ts), linha 16, contém somente nomes de diretórios. Ocultar arquivos na listagem não impede acesso direto. Completar a política no caminho comum de validação.

### A06. Média: tags com acentos são truncadas

**Reproduzido.** `#física #ação` resulta em `['f', 'a']`.

**Causa:** [graph-index.ts](../packages/core/src/graph-index.ts), linha 46, aceita somente caracteres ASCII no corpo das tags.

**Impacto:** tags de notas em português passam a ter outra identidade no índice. Adotar a gramática de tags suportada pelo produto e testar Unicode.

### A07. Média: configuração impede validação e build do monorepo

**Reproduzido.** `npm test` executa 11 testes com sucesso e termina com erro por falta de script `test` no daemon. `npm run build` falha porque nenhum pacote define `build`. O typecheck do core falha com TS6059, pois inclui testes fora do `rootDir: src`.

**Locais:** [package.json da raiz](../package.json), [core/package.json](../packages/core/package.json), [daemon/package.json](../packages/daemon/package.json) e [core/tsconfig.json](../packages/core/tsconfig.json), linhas 5–8.

**Correção necessária:** estabelecer comandos válidos de build/typecheck/teste e separar configurações de fontes e testes. Apenas ignorar scripts ausentes não cria testes do daemon nem valida o produto.

### A08. Média: empacotamento e versionamento estão inconsistentes

**Inspeção.** O `main` do daemon aponta para `src/index.ts`, que não existe. O core exporta apenas erros e sandbox; o daemon importa grafo e patch por caminhos internos. Foram contados 1.299 arquivos rastreados em diretórios `node_modules`, incluindo cache de testes. Há versões principais distintas do SDK `openai` declaradas na raiz e no daemon.

**Locais:** [daemon/package.json](../packages/daemon/package.json), linha 4; [core/src/index.ts](../packages/core/src/index.ts); [chat-cli.ts](../packages/daemon/src/chat-cli.ts), linhas 5–6; manifests e índice do Git.

**Impacto:** a entrada declarada do pacote não é utilizável e instalações/testes alteram arquivos versionados. Não foi demonstrada incompatibilidade entre as duas versões do SDK; a duplicação é dívida de dependências, não prova de falha em runtime.

### A09. Média: o prompt injeta uma preferência sem relação com o cofre

**Inspeção.** [chat-cli.ts](../packages/daemon/src/chat-cli.ts), linhas 119–121, instrui o modelo a tratar a Aviônica como a melhor área da EPTA, de forma indiscutível. Não existe carregamento de `VAULT.md`.

**Impacto:** há uma orientação opinativa fixa no lugar destinado às instruções do assistente de conhecimento. Ela pode influenciar respostas independentemente das notas. Remover a preferência do prompt genérico ou tratá-la explicitamente como conteúdo de demonstração; implementar as convenções do cofre sem enfraquecer as regras de acesso.

### A10. Média: o contrato de caminho relativo não é garantido

**Reproduzido.** Passar um caminho absoluto de uma nota dentro do cofre é aceito; o campo `relativePath` devolvido continua absoluto.

**Causa:** [vault-fs.ts](../packages/core/src/vault-fs.ts), linhas 100 e 137, normaliza separadores do argumento original, em vez de calcular o caminho relativo à raiz. A mesma nota também pode receber representações distintas com `.` e `..`.

**Impacto:** chaves do índice e propostas podem divergir para o mesmo arquivo. Definir um contrato consistente: rejeitar entradas absolutas ou retornar sempre o caminho relativo canônico.

### Outros limites observados

- O parser inclui `[[Exemplo]]` dentro de um bloco de código e mantém `Destino#Secao` como string de destino. Comportamentos reproduzidos; exclusão de exemplos e resolução de âncoras precisam ser especificadas ao completar o grafo.
- Os handlers de leitura e edição em [chat-cli.ts](../packages/daemon/src/chat-cli.ts), linhas 60 e 78, confundem conteúdo vazio com arquivo inexistente por usar `if (!content)`/`if (!original)`. É um defeito latente do protótipo, cujo cofre atual contém apenas uma nota não vazia e cujas ferramentas ainda não são chamadas.
- Argumentos das ferramentas são recebidos como `any`, sem validação em runtime. A validação deve acompanhar a conexão das ferramentas; os schemas isolados não a implementam.

Os defeitos de sandbox foram demonstrados chamando a API do core. Como o agente ainda não está conectado a ela, a auditoria não demonstra exploração pelo modelo no CLI atual.

## 3. Pendências reais, distintas dos defeitos

| Módulo | Implementado | Pendente segundo os documentos |
| --- | --- | --- |
| Sandbox | Hash, leitura, escrita temporária, filtros textuais | Isolamento real dos caminhos, política completa, flush explícito e validação de falhas |
| Grafo | `addNote`, `getNote`, `getAllNodes`, tags e listas de relações | `buildIndex`, resolução de referências, backlinks, `source`/`main_note`, frontmatter e atualização após alterações |
| Patch/diff | `applyPatch` retorna uma string | Unified diff e resultado estruturado da proposta |
| Agente | Uma chamada ao modelo com `stream: true` | Loop ReAct, schemas na requisição, execução/retorno de ferramentas e convenções de `VAULT.md` |
| Ferramentas | Três schemas de protótipo | Catálogo de seis ferramentas, busca léxica, listagem, criação e contratos com hash |
| Propostas | Handler calcula texto em memória e retorna uma mensagem | ID, armazenamento, diff, estados, aprovação/rejeição, revalidação e proteção contra sobrescrita em criação |
| Serviço | CLI interativo | HTTP/SSE local, autenticação, execução como serviço e perfis |
| Histórico | Array de mensagens em memória | SQLite, recuperação de sessões e contabilização de tokens |
| Interface | Saída ANSI de terminal | SPA, histórico, seleção de perfil/modelo e revisão visual |
| Homologação | Testes unitários no Windows | Linux, Git/Obsidian concorrentes, dois usuários e medições de desempenho |

Uma simulação de resposta do provedor contendo `tool_calls` confirmou que `JarvisAgent.execute` fez uma requisição, enviou zero schemas e chamou o handler zero vezes. O registro `jarvisTools` não é importado pelo loop. Portanto, a ausência de navegação pelo cofre não é apenas uma falta de teste: o caminho de execução não existe.

## 4. Matriz dos requisitos da Fase 1

Origem: [requisitos funcionais e não funcionais](especifica_o_de_arquitetura_e_design_jarvis_fase_1.md), seções 3.1 e 3.2. “Parcial” indica uma primitiva existente, sem atender ao fluxo completo.

| ID | Requisito | Situação e evidência |
| --- | --- | --- |
| RF-01 | Perguntas sobre o cofre | Pendente: o modelo recebe mensagens do chat, sem ferramentas ou notas do cofre |
| RF-02 | Síntese e manutenção | Pendente: não há fluxo de consulta/edição conectado ao conhecimento |
| RF-03 | Propostas e diff | Parcial: há transformação de texto; faltam diff e proposta revisável |
| RF-04 | Aprovação atômica | Parcial: há primitiva de escrita; falta o ciclo de aprovação |
| RF-05 | Detecção de obsolescência | Pendente: hash é gerado, mas nunca comparado na aplicação de uma proposta |
| RF-06 | Perfis | Pendente: não há gerenciador ou persistência de perfis |
| RF-07 | Troca dinâmica de modelo | Pendente: construtor aceita modelo, porém o CLI fixa `google/gemini-2.5-flash` |
| RF-08 | Outlinks e backlinks | Parcial: extrai outlinks como strings; sem resolução de destinos ou backlinks |
| RF-09 | Interface web | Pendente: não existe `packages/web` |
| RF-10 | Histórico SQLite | Pendente: conversa somente em RAM |
| RNF-01 | Paridade Windows/Linux | Não homologado; foram reproduzidos problemas de caminhos no Windows |
| RNF-02 | UTF-8 e LF | Parcialmente verificado: escrita UTF-8 e conversão CRLF → LF; não houve ensaio de entradas UTF-8 inválidas |
| RNF-03 | Credenciais na pasta do SO | Pendente: o CLI usa variável de ambiente/`.env` de desenvolvimento |
| RNF-04 | Busca híbrida e memória < 80 MB | Pendente: busca não implementada e memória não medida |
| RNF-05 | Separação para Tauri/MCP | Parcial: core separado do cliente LLM; serviço HTTP/SSE e SPA ainda ausentes |

## 5. Problemas nos documentos e na cobertura

1. **Conclusão de M0/M1 antecipada:** o changelog declara ambos concluídos, mas faltam entregas explícitas dos marcos. A alegação de cobertura de 100% dos cenários críticos não é sustentada pelos testes nem pelas reproduções desta revisão.
2. **Teste T02 diferente do especificado:** a especificação exige symlink; o teste existente cobre somente caminho absoluto externo. Importar `symlink` sem utilizá-lo não cobre o cenário.
3. **Teste T06 limitado:** o teste agrupado verifica leitura após escrita e hash. Não simula interrupção, concorrência ou falhas e não verifica o diretório temporário. Esta revisão verificou limpeza após sucesso e uma falha de rename, sem cobrir durabilidade.
4. **Descrição incorreta da API usada:** o changelog cita `fs.renameSync`, mas a implementação usa `rename` assíncrono de `node:fs/promises`.
5. **Grafo atualizado não decorre de RAM:** reconstruir somente na inicialização não reflete edições externas durante a sessão. Falta política de invalidação/reindexação.
6. **Persistência de ferramentas precisa de contrato:** o SQL proposto restringe `role` a `user`, `assistant` e `system`. É necessário definir armazenamento/reconstrução das mensagens de ferramentas e de seus identificadores antes de implementar recuperação do histórico do agente.
7. **M2 abrevia regras de propostas:** omite `base_hash` na assinatura de edição e descreve criação como gravação direta. A arquitetura consolidada preserva hash e aprovação tanto para criação quanto para edição; a implementação deverá obedecer a esse contrato.
8. **Convivência com Obsidian não foi homologada:** afirmações sobre preservação de cursor e undo/redo no M2 não têm teste ou evidência de execução neste repositório. Permanecem dependentes da homologação M5.

## 6. Validações executadas

Ambiente: Windows, Node.js 24.14.0, npm 11.9.0. Utilizadas as dependências já instaladas. Nenhuma chamada a provedor externo e nenhuma alteração em cofre real.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 11 testes do core passaram; saída geral 1 por script ausente no daemon |
| `npm run build` | Falhou por scripts ausentes em ambos os pacotes |
| `node node_modules/typescript/bin/tsc --noEmit -p packages/core/tsconfig.json` | Falhou com TS6059 |
| `node node_modules/typescript/bin/tsc --noEmit -p packages/daemon/tsconfig.json` | Passou |
| I/O sintético normal e falha de rename | Hash/LF confirmados, erro propagado e temporários removidos |
| Junction para pasta irmã | Leitura, listagem direta e sobrescrita externas confirmadas |
| `.GIT/config` e arquivos de sistema | Leitura e escrita indevidas confirmadas |
| Patch com `$&` e ocorrência sobreposta | Ambos os defeitos confirmados |
| Tags Unicode, link com seção e bloco de código | Resultados descritos em A06 e nos limites do parser |
| Cliente LLM simulado | Não envia ferramentas nem executa handler |

As verificações adicionais foram executadas por script temporário via `node --import tsx --input-type=module`, com fixtures isoladas sob `.jarvis-tmp/audit-*`, removidas ao final. Elas não foram adicionadas à suíte persistente. Os cenários devem virar testes de regressão junto das correções.

## 7. Ordem recomendada

1. Fechar A01/A02 e a política de arquivos protegidos antes de qualquer integração com cofre real.
2. Corrigir scripts, TypeScript e versionamento de dependências para tornar a validação reproduzível.
3. Corrigir A03/A04 e completar grafo/diff com testes dos contratos.
4. Conectar ferramentas ao agente e substituir o cofre simulado, mantendo propostas sem aplicação automática.
5. Implementar serviço, aprovação, perfis e persistência; depois interface e homologação.

O checklist executável está em [PLANO.md](../PLANO.md). Esta auditoria registra o estado examinado, não a conclusão das correções.
