# RFC-004: Dialectic & Rhetoric Arena (Módulo de Debate & Disputatio)

* **Status:** `EM ANDAMENTO / RFC`
* **Autor:** zRhyan & JARVIS
* **Data de Criação:** 2026-10-21
* **Última Atualização:** 2026-10-21
* **Módulo Alvo:** `@jarvis/core`, `@jarvis/daemon`, `@jarvis/web`

---

## 1. Contexto e Motivação

O debate é historicamente um dos métodos mais eficazes de consolidação do conhecimento humano. Ele exige não apenas a evocação passiva de fatos, mas a articulação ativa de premissas, a estruturação de silogismos lógicos, a antecipação de objeções e o refino da retórica sob pressão dialética.

O objetivo desta feature é transformar o JARVIS em um **adversário intelectual rigoroso (sparring partner)** e em um **treinador retórico**, permitindo ao usuário exercitar teses teóricas, defender interpretações de notas do Vault e se preparar para debates reais com alto nível de rigor.

---

## 2. Estruturas e Formatos de Debate

A arena não deve operar como uma conversa genérica de chat, mas sim respeitar protocolos formais bem definidos:

### 2.1. Modo *Disputatio* Escolástica
Inspirado na tradição universitária medieval (Santo Tomás de Aquino e mestres escolásticos):
1. **Quaestio (A Questão):** Definição precisa do problema em disputa (ex: *"Se o conceito de número pode ser inteiramente reduzido à teoria dos conjuntos"*).
2. **Videtur Quod Non (Objeções Iniciais):** Oponente levanta os argumentos contrários mais fortes à tese.
3. **Sed Contra (Em Sentido Contrário):** Citação de autoridade seminal ou princípio axiológico norteador.
4. **Respondeo Dicendum (Solução / Tese Central):** O proponente articula a distinção conceitual e resolve a questão.
5. **Soluções das Objeções:** Refutação individualizada de cada argumento do *Videtur Quod Non*.

### 2.2. Modo Debate Parlamentar / Acadêmico Clássico
* Estrutura rígida de turnos:
  1. Discurso de Proposição (Abertura da tese).
  2. Discurso de Oposição (Primeira rodada de contra-argumentos).
  3. Réplica & Tréplica (Confronto ponto a ponto).
  4. Discursos Finais de Síntese (Sumarização dos pontos incontestados).

### 2.3. Modo *Elenchus* Socrático
* O JARVIS assume o papel socrático: ele não expõe teses próprias, apenas formula perguntas cirúrgicas e implacáveis para testar a consistência e extrair eventuais contradições lógicas das definições do usuário.

---

## 3. Matriz de Configuração da Persona e Adversário

Antes de iniciar a sessão, o usuário parametriza o combate intelectual:

| Parâmetro | Valores Possíveis | Descrição |
| :--- | :--- | :--- |
| **Estrutura** | Escolástica, Parlamentar, Socrática, Livre | Regras de transição de turnos e fases da disputa. |
| **Nível de Rigor** | Introdutório, Intermediário, Acadêmico Implacável | Tolerância a imprecisões e agressividade nas refutações. |
| **Postura / Estilo** | Puramente Analítico, Retórico/Oratório, Cético Radical | Tom da argumentação (estilo silogístico seco vs persuasivo e estilístico). |
| **Papel da Tese** | Proponente direto ou *Advogado do Diabo* | Possibilidade do usuário defender uma tese contrária à sua convicção pessoal para treinar antecipação de argumentos. |
| **Escopo do Vault** | Notas específicas, Field inteiro ou Tese externa | Base textual que fundamenta os conceitos permitidos na discussão. |

---

## 4. O "Juiz Dialético" (Post-Debate Analysis & Feedback)

Ao término da sessão de debate, um módulo independente de avaliação (atuando como juiz neutro) compila um relatório analítico contendo:

1. **Detecção de Falácias:**
   * Falácias Formais: Afirmação do consequente, negação do antecedente, etc.
   * Falácias Informais: *Ad hominem*, espantalho (*straw man*), petição de princípio, falsa dicotomia.
2. **Avaliação Silogística:** Identificação de premissas implícitas que não foram justificadas ao longo da discussão.
3. **Métricas Retóricas:** Clareza de exposição, concisão, precisão do vocabulário técnico e efetividade das concessões feitas.

---

## 5. Pontos em Aberto e Tópicos para Discussão (RFC)

1. **Intervenção por Turnos vs Tempo Real:**
   * Deve ser um formato baseado em rodadas de texto com limite de caracteres/palavras por intervenção, para emular discursos cronometrados?
2. **Interface na Web UI:**
   * Como projetar a visualização da arena? Sugestão: layout com duas colunas de confrontação (Tese vs Antítese) e timeline de turnos com status de cada fase.
3. **Persistência e Histórico de Debates:**
   * Os debates concluídos devem gerar uma nota de síntese no Vault com as objeções resolvidas e aprendizados retóricos?
