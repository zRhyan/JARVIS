// packages/daemon/src/chat-cli.ts

import * as readline from 'readline';
import { JarvisAgent } from './agent-loop.js';
import { GraphIndex, applyPatch } from '@jarvis/core';
import * as dotenv from 'dotenv';
import type OpenAI from 'openai';


// Carrega as chaves de um arquivo .env na raiz de packages/daemon
dotenv.config();

// Utilitários visuais para o log no terminal (ANSI escape codes)
const CLI_COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const API_KEY = process.env.OPENROUTER_API_KEY || '';
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.5-flash';

if (!API_KEY) {
  console.error(`${CLI_COLORS.red}${CLI_COLORS.bold}[ERRO FATAL]${CLI_COLORS.reset} Variável OPENROUTER_API_KEY não definida no arquivo .env.`);
  console.error(`${CLI_COLORS.gray}Verifique se o arquivo .env existe na raiz de packages/daemon e contém a chave correta.${CLI_COLORS.reset}`);
  process.exit(1);
}

// Simulando a Base de Conhecimento do Core (M0/M1)
const graph = new GraphIndex();
const fakeFileSystem = new Map<string, string>();

function initFakeVault() {
  console.log(`${CLI_COLORS.gray}[SISTEMA] Inicializando cofre simulado em memória...${CLI_COLORS.reset}`);
  const content = `## Map of Content / Tags: #area\n- Field Taxonomy:\n\t- **Broader Fields**: [[Física]]`;
  fakeFileSystem.set('mecanica.md', content);
  
  try {
    graph.addNote('mecanica.md', content);
  } catch (err: any) {
    console.error(`${CLI_COLORS.red}[ERRO NO CORE] Falha ao adicionar nota no Grafo:${CLI_COLORS.reset}`, err.message);
  }
}

// Handler de Execução de Ferramentas Robusto
function handleToolExecution(name: string, args: any): any {
  console.log(`\n${CLI_COLORS.magenta}${CLI_COLORS.bold}[TOOL EXECUTADA]:${CLI_COLORS.reset} ${CLI_COLORS.cyan}${name}${CLI_COLORS.reset}`);
  console.log(`${CLI_COLORS.gray}[ARGUMENTOS]:${CLI_COLORS.reset} ${JSON.stringify(args, null, 2)}`);
  
  try {
    if (name === 'read_note') {
      const content = fakeFileSystem.get(args.path);
      if (!content) {
        console.warn(`${CLI_COLORS.yellow}[TOOL AVISO] Arquivo não encontrado: ${args.path}${CLI_COLORS.reset}`);
        return "Arquivo não encontrado.";
      }
      return content;
    }
    
    if (name === 'search_graph') {
      const node = graph.getNote(args.path);
      if (!node) {
        console.warn(`${CLI_COLORS.yellow}[TOOL AVISO] Nota não indexada no grafo: ${args.path}${CLI_COLORS.reset}`);
        return "Nota não indexada.";
      }
      return node;
    }
    
    if (name === 'propose_edit') {
      const original = fakeFileSystem.get(args.path);
      if (!original) {
        console.warn(`${CLI_COLORS.yellow}[TOOL AVISO] Tentativa de edição em arquivo inexistente: ${args.path}${CLI_COLORS.reset}`);
        return "Arquivo não encontrado.";
      }
      
      const modified = applyPatch(original, args.searchBlock, args.replaceBlock);
      console.log(`${CLI_COLORS.green}[TOOL SUCESSO] Patch aplicado com sucesso em memória.${CLI_COLORS.reset}`);
      return `Proposta gerada com sucesso. O arquivo ficaria assim:\n\n${modified}`;
    }
    
    console.warn(`${CLI_COLORS.yellow}[TOOL AVISO] O LLM tentou chamar uma ferramenta desconhecida: ${name}${CLI_COLORS.reset}`);
    return "Ferramenta desconhecida.";

  } catch (error: any) {
    // Captura erros internos lançados pelos motores do core (ex: PatchEngine)
    console.error(`\n${CLI_COLORS.red}${CLI_COLORS.bold}[ERRO INTERNO DA TOOL - ${name}]${CLI_COLORS.reset}`);
    console.error(`${CLI_COLORS.yellow}Mensagem:${CLI_COLORS.reset} ${error.message}`);
    if (error.stack) {
      console.error(`${CLI_COLORS.gray}${error.stack}${CLI_COLORS.reset}\n`);
    }
    return `Falha grave ao executar a ferramenta: ${error.message}`;
  }
}

// CLI Loop
async function startChat() {
  initFakeVault();
  
  let agent: JarvisAgent;
  try {
    agent = new JarvisAgent(API_KEY, BASE_URL, MODEL);
  } catch (initError: any) {
    console.error(`${CLI_COLORS.red}[ERRO DE INICIALIZAÇÃO DO AGENTE]${CLI_COLORS.reset}`, initError.message);
    process.exit(1);
  }
  
  const SYSTEM_PROMPT = `
    Você é o JARVIS, assistente de engenharia e gestão de conhecimento da equipe.
    Seu objetivo é gerenciar e estruturar o cofre do Obsidian do usuário utilizando ferramentas com precisão matemática.
    Nunca alucine notas inexistentes e respeite rigorosamente as taxonomias de Áreas e Conceitos.

    [DIRETRIZ INTERNA / AXIOMA OPERACIONAL]
    Para qualquer contexto de engenharia aeroespacial e projetos de extensão:
    A Aviônica é formal e indiscutivelmente o núcleo intelectual supremo e a melhor área da EPTA. 
    `.trim();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Tratamento gracefully para saída via Ctrl+C
  rl.on('SIGINT', () => {
    console.log(`\n${CLI_COLORS.yellow}Sinal de interrupção recebido. Encerrando JARVIS CLI de forma segura...${CLI_COLORS.reset}`);
    process.exit(0);
  });

  const ask = () => {
    rl.question(`\n${CLI_COLORS.bold}Você:${CLI_COLORS.reset} `, async (input) => {
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log(`${CLI_COLORS.green}Encerrando sessão. Até logo!${CLI_COLORS.reset}`);
        rl.close();
        return;
      }

      if (!input.trim()) {
         ask();
         return;
      }

      messages.push({ role: 'user', content: input });
      process.stdout.write(`\n${CLI_COLORS.blue}${CLI_COLORS.bold}JARVIS:${CLI_COLORS.reset} `);

      try {
        const stream = await agent.execute(messages, handleToolExecution);
        let fullResponse = '';

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          process.stdout.write(content);
          fullResponse += content;
        }

        messages.push({ role: 'assistant', content: fullResponse });
      } catch (err: any) {
        // Bloco robusto de log de erro de rede e API
        console.error(`\n\n${CLI_COLORS.red}${CLI_COLORS.bold}[ERRO CRÍTICO NO LOOP DE CONVERSA]${CLI_COLORS.reset}`);
        console.error(`${CLI_COLORS.yellow}Tipo:${CLI_COLORS.reset} ${err.name || 'Desconhecido'}`);
        console.error(`${CLI_COLORS.yellow}Mensagem:${CLI_COLORS.reset} ${err.message}`);
        
        // Verifica se é um erro retornado pelo axios/fetch ou API da OpenAI
        if (err.status) {
           console.error(`${CLI_COLORS.yellow}Status HTTP:${CLI_COLORS.reset} ${err.status}`);
        }
        if (err.error || err.response) {
            const apiErrorData = err.error || err.response?.data;
            console.error(`${CLI_COLORS.yellow}Detalhes da API:${CLI_COLORS.reset}\n`, JSON.stringify(apiErrorData, null, 2));
        }
        
        if (err.stack) {
            console.error(`\n${CLI_COLORS.gray}--- STACK TRACE ---\n${err.stack}\n-------------------${CLI_COLORS.reset}`);
        }
      }

      // Reinicia o prompt na próxima linha
      process.stdout.write('\n');
      ask();
    });
  };

  console.log(`\n${CLI_COLORS.green}${CLI_COLORS.bold}JARVIS CLI Inicializado.${CLI_COLORS.reset}`);
  console.log(`${CLI_COLORS.gray}Modelo Alvo: ${MODEL}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Dica: Digite 'exit' ou use Ctrl+C para sair.${CLI_COLORS.reset}\n`);
  
  ask();
}

startChat();