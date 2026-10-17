# 🧠 JARVIS — Obsidian AI Copilot

<p align="center">
  <img src="docs/jarvis-icon.svg" alt="JARVIS Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>Seu copiloto de IA local, autônomo e focado em privacidade para vaults do Obsidian.</strong>
</p>

<p align="center">
  <a href="#-instalação-rápida">Instalação Rápida</a> •
  <a href="#-como-usar">Como Usar</a> •
  <a href="#-principais-recursos">Recursos</a> •
  <a href="#-arquitetura">Arquitetura</a>
</p>

---

## ⚡ Instalação Rápida

### Pré-requisitos
- [Node.js](https://nodejs.org) (versão 18 ou superior).

---

### 🪟 No Windows (1 Clique)
1. Baixe ou clone este repositório no seu computador:
   ```bash
   git clone https://github.com/zRhyan/JARVIS.git
   ```
2. Abra a pasta do JARVIS e dê **duplo clique no arquivo `jarvis.bat`**.
3. Na primeira execução, o JARVIS instalará as dependências, compilará a interface web, iniciará o servidor e **abrirá o navegador automaticamente**. Nas próximas vezes, a inicialização é instantânea!

---

### 🐧 No Linux / macOS
1. Clone o repositório e acesse a pasta:
   ```bash
   git clone https://github.com/zRhyan/JARVIS.git
   cd JARVIS
   ```
2. Inicie com um único comando:
   ```bash
   ./jarvis.sh
   ```
   *(Ele instalará as dependências na 1ª vez e abrirá o navegador padrão automaticamente).*

#### 💡 Opcional: Criar Ícone no Menu de Programas do Linux
Se você usa Ubuntu, Fedora, Debian ou outra distro Linux e quiser abrir o JARVIS pelo menu de aplicativos como qualquer programa comum:
```bash
./scripts/install-desktop-shortcut.sh
```
Pronto! O **JARVIS Copilot** agora aparecerá na pesquisa de aplicativos do seu sistema com o ícone oficial.

---

## 🎯 Como Usar

Assim que o JARVIS iniciar, a interface web abrirá automaticamente em `http://127.0.0.1:4173`:

1. **Autenticação Automática:** O token de segurança local é sincronizado automaticamente — você não precisa copiar e colar chaves nem navegar em pastas de sistema.
2. **Selecione ou Crie seu Perfil:**
   - Aponte para a pasta do seu cofre do Obsidian (Vault).
   - Insira sua chave de API do OpenRouter.
3. **Comece a conversar:**
   - Peça para o JARVIS pesquisar notas, cruzar temas, resumir reuniões ou sugerir novas notas.
   - Qualquer proposta de criação ou edição de nota abre um **Diff Interativo** com preview para você aprovar ou rejeitar com total controle.

---

## 🛡️ Principais Recursos

- **Auto-Sync & File Watcher:** Sincronização em tempo real com seu vault do Obsidian. Qualquer nota que você crie, renomeie ou edite no Obsidian é reindexada no grafo instantaneamente.
- **Diffs Seguros:** O JARVIS nunca sobrescreve suas notas sem sua prévia autorização. Você revisa linha a linha o que mudou.
- **Grafo Semântico Local:** Indexa links, tags e conexões de notas em memória e banco SQLite local ultrarrápido.
- **Resolução Inteligente de Caminhos:** O agente localiza notas pelo nome mesmo que pastas mudem ou que links estejam incompletos.
- **100% Localhost:** Daemon Fastify em loopback (`127.0.0.1`) com autenticação protegida via permissão `0600`.

---

## 🛠️ Comandos de Desenvolvimento (Avançado)

Se preferir rodar via terminal ou contribuir para o código:

```bash
# Instala dependências do monorepo
npm install

# Executa todos os testes unitários e de integração
npm test

# Inicia o daemon em modo de desenvolvimento
npm run dev:daemon

# Inicia a interface web Vite em modo de desenvolvimento
npm run dev:web
```

---

## 📄 Licença
Distribuído sob licença MIT. Desenvolvido para transformar anotações pessoais em conhecimento vivo.
