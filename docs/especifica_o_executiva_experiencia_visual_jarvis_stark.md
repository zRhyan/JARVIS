# JARVIS — Especificação Executiva: Experiência Visual Imersiva (Tony Stark HUD / Arc Reactor & Voice Onboarding)

**Foco:** Redesign de Experiência do Usuário (UX/UI), Animação HUD Reativa ("Arc Reactor Orb"), Saudação Contextual (Horário/Perfil) e Transição Fluida para o Workspace  
**Status:** CONCLUÍDO — Homologado e Testado com Sucesso  
**Data:** 2026-10-17  
**Autor:** Antigravity / Pair Programming JARVIS  

---

## 1. Visão Geral e Objetivo Executivo

Atualmente, o JARVIS possui uma interface funcional e moderna de chat com streaming, perfis e diff viewer. No entanto, sua experiência inicial de entrada ainda se assemelha a uma interface padrão de assistente de IA convencional (sidebar à esquerda + feed de chat estático no centro).

**A meta desta evolução é transformar o primeiro contato e o uso contínuo do JARVIS em uma experiência icônica inspirada no J.A.R.V.I.S. de Tony Stark (Iron Man / Marvel):**
1. **Abertura Cinematográfica (Boot Sequence & Greeting):**
   - Ao carregar a aplicação, o usuário é recepcionado por uma sequência de inicialização de sistemas (*HUD Diagnostic Boot*).
   - O JARVIS identifica contextualmente o horário local do usuário (*Bom dia*, *Boa tarde*, *Boa noite*), o nome do perfil ativo e o status do cofre Obsidian.
   - Uma orbe holográfica reativa estilo **Arc Reactor** pulsa no centro da tela enquanto a mensagem de boas-vindas é exibida/narrada com efeito de digitação ou onda sonora.
2. **Transição Holográfica Suave (Holographic Unfold):**
   - Ao término da saudação (ou ao toque/clique do usuário em *Pular* / *Entrar no Workspace*), o orbe holográfico se contrai suavemente para o canto superior ou integra-se ao cabeçalho/status do sistema, revelando o ambiente de trabalho e o painel de chat.
3. **Presença Viva do JARVIS durante o Chat:**
   - O orbe holográfico não desaparece por completo: ele passa a atuar como o **núcleo de estado da IA** no cabeçalho ou na barra de input (pulsando calmamente em *Standby*, girando anéis em *Thinking / Executando Ferramentas*, e reagindo com ondas sonoras ao fazer streaming de respostas).

---

## 2. Arquitetura da Experiência Visual

Abaixo está o diagrama de fluxo de estados da nova experiência de inicialização:

```
    ┌───────────────────────────────────────────────────────────────┐
    │                INICIALIZAÇÃO / CARGA DA SPA                   │
    │  (Resolução de Token, Verificação de Saúde do Daemon Fastify)  │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │               ESTADO 1: HUD BOOT & GREETING                   │
    │  - Tela em Fullscreen Sci-Fi Minimalista (Fundo Grid Holográfico)
    │  - Orbe Central Arc Reactor: Rotação de anéis, brilho ciano/dourado
    │  - Saudação Contextual (Ex: "Bom dia, Tony. Todos os sistemas
    │    operacionais. 1.420 notas indexadas no cofre.")            │
    │  - Áudio opcional (Web Speech Synthesis / TTS nativo do browser)
    │  - Botão sutil [Pular / Entrar no Workspace] (acessibilidade) │
    └───────────────────────────────┬───────────────────────────────┘
                                    │ (Terminou fala / timeout / clique)
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │               ESTADO 2: TRANSIÇÃO HOLOGRÁFICA (UNFOLD)        │
    │  - O Arc Reactor central escala suavemente e se move para o topo
    │  - As barras laterais e painel de chat deslizam com fade-in   │
    │  - Efeito sonoro sutil de interface futurista (opcional)      │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │               ESTADO 3: WORKSPACE ATIVO (LIVING HUD)          │
    │  - Interface de Chat Completa (Histórico, Diffs, Modelos)     │
    │  - Mini Arc Reactor no Header indicando estado:               │
    │      * IDLE: Pulso suave ciano (Respiração)                   │
    │      * THINKING: Rotação acelerada com anéis concêntricos     │
    │      * STREAMING: Equalizador de partículas responsivo        │
    └───────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Centrais a Serem Construídos

### 3.1. `JarvisArcOrb` (Núcleo Holográfico Reativo)
- Renderização via SVG com gradientes e filtros CSS, ou Canvas 2D/WebGL de alta performance (60 FPS, sem pesar na CPU).
- **Camadas Visuais:**
  - Anel externo com traços segmentados giratórios (sentido horário).
  - Anel intermediário com marcações angulares HUD (sentido anti-horário).
  - Triângulo invertido característico do Arc Reactor (Vibranium Core).
  - Núcleo central emissor de partículas ou ondas de áudio.
- **Props de Estado:** `state: 'boot' | 'idle' | 'speaking' | 'thinking' | 'compact'`.

### 3.2. `JarvisWelcomeExperience` (Overlay / Tela de Boas-Vindas)
- Calcula o cumprimento temporal:
  - `05:00 - 11:59`: *"Bom dia"*
  - `12:00 - 17:59`: *"Boa tarde"*
  - `18:00 - 04:59`: *"Boa noite"*
- Coleta telemetria do daemon em milissegundos:
  - Quantidade de notas indexadas no cofre ativo (`vaultStats.indexedNotes`).
  - Nome do perfil ativo (`activeProfile.name`).
  - Modelo configurado (`selectedModel`).
- Monta a locução:
  - *"Bom dia. Todos os sistemas online. O cofre [Nome] está sincronizado com [N] notas prontas para consulta. Como posso ajudar agora?"*
- Texto animado com efeito de teletipo/HUD (`TypewriterEffect`).

### 3.3. Transição Cinema (Morphing para o Layout Principal)
- Gerenciamento de estado na raiz (`App.tsx`):
  - `const [hasCompletedIntro, setHasCompletedIntro] = useState(false)`.
  - Opção no `localStorage` (`jarvis_skip_intro: true/false`) para quem prefere abrir direto no chat sem aguardar a animação toda vez.
- Transição fluida usando Framer Motion ou Tailwind transitions com curvas cúbicas suaves (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 4. Decisões Arquiteturais e de Design Fechadas

Com base no alinhamento de requisitos, as definições oficiais para a implementação são:

1. **Efeitos Sonoros Sci-Fi Sutis (Web Audio API nativa):**
   - **Sem sintetização de voz:** O foco é a elegância do som tecnológico (bips de diagnóstico, pulso do reator, clique holográfico e teletipo suave).
   - Gerado nativamente via **Web Audio API** (`AudioContext` / osciladores e envelopes senoidais leves), **sem necessidade de carregar arquivos MP3 pesados ou depender de rede**.
   - Respeita política de autoplay dos navegadores (ativa som no primeiro gesto ou clique do usuário).
2. **Frequência e Controle de Inicialização:**
   - **Padrão:** Executa apenas na **1ª abertura do dia / sessão** (registrado com timestamp no `localStorage` chave `jarvis_last_intro_date`).
   - **Configuração no Header/Modal de Configurações:** Três opções selecionáveis pelo usuário:
     - `once_per_day` (Padrão: 1 vez ao dia)
     - `always` (Sempre ao carregar)
     - `never` (Totalmente desativado — entra direto no chat)
   - **Atalho Universal de Pular:** A tecla `Enter` (ou clique em qualquer lugar da tela / botão sutil `[Pular (Enter)]`) encerra a animação imediatamente e faz a transição rápida para o chat em qualquer modo.
3. **Estética do Arc Reactor (Híbrido SVG HUD + Ondas Sonoras):**
   - Anéis concêntricos SVG de precisão geométrica com rotações opostas em CSS (`transform: rotate`).
   - Barras ou ondas de frequência sonora pulsando no centro em sincronicidade com o teletipo do texto.
   - Glow ciano `#06b6d4` / `#22d3ee` e toques em dourado/âmbar discreto, 100% responsivo e nítido em 4K.
4. **Locução Textual Neutra e Precisa:**
   - Saudação temporal sem vocativo: *"Bom dia. Todos os sistemas online. O cofre está sincronizado com [N] notas prontas para consulta. O que deseja explorar agora?"*

---

## 5. Plano de Implementação Passo a Passo (Roadmap de Execução)

A implementação será executada em 5 etapas modulares e testáveis:

### Etapa 1: Sintetizador de Som Sci-Fi (`sound-effects.ts`)
- Módulo puro em TypeScript usando `AudioContext` nativo do navegador.
- Efeitos sonoros ultraleves:
  - `playReactorHum()`: Zumbido de ativação do Arc Reactor com elevação de frequência tonal.
  - `playDiagnosticChirp()`: Beeps futuristas sequenciais durante a telemetria.
  - `playTeletypeClick()`: Clique suave de digitação rápida das letras na tela.
  - `playTransitionWhoosh()`: Som de transição quando o orbe se move para o topo.
- Controle global de mudo (`jarvis_sound_enabled: boolean`).

### Etapa 2: Componente Central `JarvisArcOrb`
- Componente React dedicado (`packages/web/src/components/hud/JarvisArcOrb.tsx`).
- Modos visuais suportados:
  - `intro`: Orbe central grande (280px-340px) com partículas e anéis concêntricos girando em velocidades dinâmicas.
  - `compact`: Orbe minimizado no cabeçalho (36px-42px) que continua vivo no topo da tela, reagindo quando o agente está pensando ou executando ferramentas.
- Anéis vetoriais SVG com filtros de neon blur e gradientes metálicos.

### Etapa 3: Overlay de Boas-Vindas `JarvisIntroScreen`
- Componente de tela cheia (`packages/web/src/components/hud/JarvisIntroScreen.tsx`).
- Cálculo do turno temporal (`Bom dia` / `Boa tarde` / `Boa noite`).
- Teletipo com cursor piscante ciano apresentando a telemetria do cofre e do perfil.
- Listener global para tecla `Enter` e clique para pular imediatamente.

### Etapa 4: Integração de Estados e Configurações no `App.tsx` e `Header.tsx`
- Gerenciamento de estado de introdução no `App.tsx` com transição CSS suave (`fade-out` + expansão do workspace).
- Adição da configuração de introdução no menu de configurações do usuário (`1 vez ao dia`, `Sempre`, `Nunca`).

### Etapa 5: Validação, Testes Automatizados e Build
- Criação de testes unitários para a lógica de persistência temporal e seleção de saudação.
- Validação do build de produção Vite.
