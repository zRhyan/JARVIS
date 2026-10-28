# RFC-006: Multi-Agent Collaboration & Dialectic Swarm Engine (Núcleo Multi-Agente)

* **Status:** `EM ANDAMENTO / RFC`
* **Autor:** zRhyan & JARVIS
* **Data de Criação:** 2026-10-26
* **Última Atualização:** 2026-10-26
* **Módulo Alvo:** `@jarvis/core`, `@jarvis/daemon`, `@jarvis/web`

---

## 1. Contexto e Motivação

Modelos de linguagem monolíticos, embora versáteis, enfrentam uma limitação intrínseca quando submetidos a tarefas complexas e multifacetadas: **a dispersão de atenção no contexto**. Ao tentar simultaneamente redigir com rigor formal, garantir didática acessível, checar precisão histórica e auditar falhas lógicas, a LLM generalista tende a nivelar a qualidade por baixo, negligenciando detalhes críticos.

Adicionalmente, no campo do aprendizado e investigação de teses, a melhor forma de amadurecer um argumento complexo é expô-lo a um confronto de alta intensidade com um oponente preparado. A capacidade de colocar duas instâncias de IA debatendo autonomamente entre si com acesso a ferramentas externas (como web search e leitura do Vault) permite extrair a essência de um problema sem viés de confirmação.

Esta RFC propõe um **Núcleo Modular de Multi-Agentes** para o JARVIS, fornecendo barramento de mensagens, papéis desacoplados e protocolos de convergência lógica.

---

## 2. Padrões de Orquestração do Núcleo

```mermaid
graph TD
    subgraph Orquestração Central
        Dispatcher["Master Orchestrator / Dispatcher<br/>(@jarvis/daemon)"]
    end

    subgraph Caso 1: Dialética Autônoma com Convergência
        AgentA["Agente Proponente (Tese)<br/>+ Web Search / Vault"] <-->|Troca de Argumentos| AgentB["Agente Opositor (Antítese)<br/>+ Web Search / Vault"]
        AgentA --> Judge["Moderador Epistêmico<br/>(Detector de Convergência & Síntese)"]
        AgentB --> Judge
        Judge --> SynthesisDoc["Síntese Consensual Estruturada"]
    end

    subgraph Caso 2: Comitê de Especialistas (Multi-Perspective)
        Dispatcher --> Spec1["Especialista: Rigor Lógico/Formal"]
        Dispatcher --> Spec2["Especialista: Didática & Clareza"]
        Dispatcher --> Spec3["Especialista: Contexto & Conexões do Vault"]
        Dispatcher --> Spec4["Auditor Crítico (Red Team)"]
        
        Spec1 --> Integrator["Agente Integrador / Editor-Chefe"]
        Spec2 --> Integrator
        Spec3 --> Integrator
        Spec4 --> Integrator
        Integrator --> MasterProject["Documento / Projeto Consolidado"]
    end

    Dispatcher --> AgentA
    Dispatcher --> AgentB
```

---

## 3. Detalhamento dos Dois Modos Fundamentais

### 3.1. Modo Dialética Autônoma (Debate IA vs IA com Convergência Obrigatória)
* **Dinâmica:**
  1. O usuário submete uma tese ou uma questão em aberto (ex.: *"A hipótese do continuo na teoria dos conjuntos"* ou *"Paradigma relacional vs documental para grafos esparsos"*).
  2. O sistema instancia dois agentes simétricos com personalidades e heurísticas antagônicas:
     * **Agente A (Defensor):** Fornece premissas, axiomas e evidências favoráveis.
     * **Agente B (Contraditor):** Busca contraexemplos, casos de borda e inconsistências fundamentais.
  3. Ambos possuem acesso à `search_web` e ao extrator semântico do Vault para embasar suas réplicas com fatos.
* **Garantia Crítica: Condição de Parada e Critério de Convergência (*Stop Condition*):**
  * Para evitar looping dialético infinito e explosão de tokens:
    - **Limite Máximo de Turnos:** Número fixo de rodadas (ex.: 3 rodadas de *Tese $\leftrightarrow$ Antítese*).
    - **Métrica de Entropia Argumentativa:** Um terceiro agente leve (Moderador/Juiz) monitora se novos argumentos substanciais estão sendo introduzidos ou se há redundância retórica.
    - **Fase Obrigatória de Síntese Hegeliana:** Na última rodada, a instrução dos agentes comuta de "refutação" para "conciliação": os agentes devem listar os pontos de consenso irrefutáveis, os desacordos insolúveis e formular a síntese final.

### 3.2. Modo Comitê de Especialistas (Engenharia de Múltiplas Óticas)
* **Dinâmica:**
  1. O usuário solicita a criação ou refatoração de um projeto/documento denso.
  2. Em vez de uma única chamada exaustiva, o orquestrador aciona uma equipe de agentes com **Prompts de Sistema Especializados e Isolamento de Contexto**:
     * **Agente Ontológico:** Valida a hierarquia de definições contra a taxonomia do Vault (RFC-002).
     * **Agente Pedagógico:** Garante clareza na exposição, progressão didática suave e analogias ricas.
     * **Agente Técnico/Formal:** Audita equações, demonstrações matemáticas ou implementações de código.
     * **Agente Red Team:** Tenta ativamente encontrar furos e ambiguidades no rascunho.
  3. **Camada de Fusão (Integrator Agent):** Coleta as contribuições modulares de cada especialista, resolve contradições e monta o documento unificado sem a perda de foco de um modelo genérico.

---

## 4. Arquitetura de Comunicação no Daemon

* **Isolamento de Janela de Contexto:** Cada subagente opera em seu próprio canal de mensagens (`AgentExecutionThread`). O Agente Especialista em Lógica não precisa ler todo o histórico de tentativas do Agente Didático, reduzindo drasticamente o consumo de tokens.
* **Barramento de Mensagens Centralizado (`AgentMessageBus`):**
  - Eventos de disparo: `AGENT_TASK_SPAWNED`, `AGENT_TURN_COMPLETED`, `CONVERGENCE_DETECTED`.
  - Persistência estruturada de cada turno no SQLite do daemon (`multi_agent_sessions` e `agent_turns`).

---

## 5. Pontos em Aberto e Tópicos para Discussão (RFC)

1. **Seleção Heterogênea de Modelos (Model Mixing):**
   * Devemos permitir modelos diferentes para agentes diferentes?
   * Exemplo: Um modelo mais rápido e econômico para a moderação/convergência, e um modelo de raciocínio de ponta para o Agente Formal e o Red Team.
2. **Interface na Web UI (`packages/web`):**
   * Como exibir o debate de IAs em tempo real? Sugestão: visualização em tela dividida (Split-Terminal) com balões de diálogo das duas IAs e um indicador de progresso rumo à convergência.
3. **Intervenção Humana Opcional (*Human-in-the-Loop*):**
   * O usuário deve poder "injetar" uma pergunta ou objeção no meio do debate entre as IAs, redirecionando o rumo da discussão?
