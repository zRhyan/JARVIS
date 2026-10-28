# RFC-007: Goal-Driven Autonomous Execution & Deep Work Engine (Execução Orientada a Metas)

* **Status:** `EM ANDAMENTO / RFC`
* **Autor:** zRhyan & JARVIS
* **Data de Criação:** 2026-10-26
* **Última Atualização:** 2026-10-26
* **Módulo Alvo:** `@jarvis/core`, `@jarvis/daemon`, `@jarvis/web`

---

## 1. Contexto e Motivação

Interações convencionais com assistentes de IA operam no modelo de resposta síncrona a prompts individuais (pergunta $\to$ resposta). Contudo, tarefas de engenharia do conhecimento e manutenção do Vault frequentemente exigem **trabalho profundo, repetitivo e multi-etapas**, tais como:
* *"Varra todas as 300 notas do Vault relacionadas a Teoria dos Grafos, identifique inconsistências de taxonomia e proponha uma refatoração em lote."*
* *"Pesquise exaustivamente todas as menções a 'Algoritmos Gulosos', leia o conteúdo das notas, cruze com fontes externas e formule um documento canônico de síntese."*

Ferramentas avançadas como Claude Code, Codex e Antigravity introduziram o paradigma do comando `/goal`: o usuário define um objetivo final de alto nível e o agente trabalha autonomamente em segundo plano, dividindo o problema em sub-etapas até atingir o critério de sucesso.

Para o JARVIS, essa capacidade é transformadora. Porém, requer salvaguardas rigorosas de engenharia para evitar três riscos críticos:
1. **Desperdício e explosão de tokens:** Evitar chamadas desnecessárias ou promessas não orçadas.
2. **Estouro e degradação da janela de contexto:** A proliferação desordenada de histórico degrada a atenção do modelo.
3. **Looping infinito e perda de rumo:** Garantir que o agente não fique repetindo tentativas estéreis.

---

## 2. Ciclo de Execução Profunda (Deep Work Loop)

```mermaid
graph TD
    UserGoal["Usuário define Meta (/goal)<br/>+ Limite de Tokens & Escopo"] --> Planner["Meta-Planner<br/>(Decompõe em Subtarefas no SQLite)"]
    Planner --> CheckpointDB["Tabela de Tarefas e Checkpoints<br/>(jarvis.db)"]
    
    subgraph Execution Loop (Background Daemon)
        CheckpointDB --> NextTask["Próxima Subtarefa Pendente"]
        NextTask --> ContextCompressor["Compressor de Contexto<br/>(Carrega apenas estado atual + scratchpad)"]
        ContextCompressor --> Worker["Worker Agent (Executa ferramentas)"]
        Worker --> ResultVerifier["Verificador de Progresso & Tokens"]
        
        ResultVerifier -->|Falha repetida / Sem progresso| StagnationGuard["Guarda de Estagnação<br/>(Pausa ou pede auxílio ao usuário)"]
        ResultVerifier -->|Progresso válido| TaskComplete["Marca Subtarefa Concluída"]
        TaskComplete --> CheckpointDB
    end

    TaskComplete --> GoalEvaluator{"Todas as subtarefas<br/>concluídas?"}
    GoalEvaluator -->|Sim| FinalSynthesis["Síntese Final & Relatório de Modificações"]
    GoalEvaluator -->|Não| NextTask
```

---

## 3. Pilares de Robustez e Proteção

### 3.1. Orçamento Estrito de Tokens (*Token Budgeting*)
* Cada meta é instanciada com um **teto de orçamento** configurável:
  - Teto padrão de segurança (ex.: máx. $200.000$ tokens totais ou \$0.50 por execução).
  - Limite por iteração individual para evitar que uma única nota de 50kB sature o prompt.
* Se a meta atingir $80\%$ do teto sem concluir, o JARVIS salva o checkpoint no SQLite, entra em estado `PAUSED_BUDGET_WARNING` e notifica o usuário na Web UI solicitando autorização para prosseguir.

### 3.2. Gerenciamento e Compactação da Janela de Contexto (*Context Rolling & Scratchpad*)
Para impedir que a janela de contexto cresça descontroladamente ao longo de 50 iterações:
* **Princípio do Contexto Epêmero:** O histórico cru de mensagens e chamadas de ferramentas das subtarefas anteriores **não é acumulado** no prompt da próxima subtarefa.
* **Scratchpad Persistente:** O agente mantém um documento de estado enxuto (resumo do que já foi feito, o que falta fazer, e descobertas relevantes).
* Apenas o *System Prompt*, o *Scratchpad* e o *Contexto da Subtarefa Atual* são enviados ao modelo. O consumo de tokens por chamada permanece constante ao longo de horas de execução.

### 3.3. Guarda Anti-Looping e Detecção de Estagnação (*Stagnation Guard*)
* Se o modelo invocar a mesma ferramenta com argumentos substancialmente idênticos mais de 2 vezes consecutivas sem gerar alteração de estado no Vault ou no banco, o loop é travado.
* Se nenhuma subtarefa for dada como concluída após $N$ tentativas, o status muda para `BLOCKED_NEED_INPUT`, gerando uma mensagem diagnóstica precisa para o usuário.

### 3.4. Resiliência a Falhas do Daemon (*Crash-Safe Checkpoints*)
* O progresso é gravado de forma transacional no SQLite antes e depois de cada ação.
* Se o daemon reiniciar ou a máquina desligar, a meta permanece registrada como `INTERRUPTED`. Ao religar, o JARVIS oferece: *"A meta 'Refatorar taxonomia de Grafos' parou na etapa 42 de 100. Deseja retomar do último checkpoint?"*.

---

## 4. Integração com o Vault do Obsidian

Para varreduras profundas (não apenas busca por nome de arquivo):
1. **Indexador em Lotes (Batch Crawler):** O daemon lê e avalia as notas em lotes assíncronos (ex.: 10 notas por bloco), evitando travamentos de I/O.
2. **Propostas Seguras de Modificação (Diff & Sandbox):**
   * Modificações no Vault respeitam a arquitetura já estabelecida no JARVIS: o agente não sobregrava arquivos diretamente às cegas; ele gera um plano de diff ou proposta de alteração em lote que pode ser revisada visualmente antes ou aplicada com rollback garantido.

---

## 5. Pontos em Aberto e Tópicos para Discussão (RFC)

1. **Gatilhos de Inicialização:**
   * Via slash command no chat (`/goal <descrição>`), via formulário dedicado na Web UI com sliders de orçamento de tokens, ou ambos?
2. **Nível de Autonomia:**
   * Modo *Supervisionado*: O agente para e pede confirmação para aplicar alterações em arquivos reais.
   * Modo *Totalmente Autônomo*: O agente aplica alterações diretamente e gera um log auditável com rollback.
3. **Notificação de Término:**
   * Notificação sonora/visual na Web UI e geração de uma nota de relatório no Vault detalhando o que foi alterado e o custo em tokens.
