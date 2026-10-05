// packages/daemon/src/chat-cli.ts

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import type OpenAI from 'openai';
import { JarvisAgent, buildSystemPrompt } from './agent-loop.js';
import { initVaultContext } from './vault-context.js';
import { ToolExecutor } from './tool-executor.js';

// Carrega as chaves do .env na raiz de packages/daemon
dotenv.config();

// Utilitários visuais para terminal (ANSI escape codes)
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
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

if (!API_KEY) {
  console.error(`${CLI_COLORS.red}${CLI_COLORS.bold}[ERRO FATAL]${CLI_COLORS.reset} Variável OPENROUTER_API_KEY não definida no arquivo .env.`);
  console.error(`${CLI_COLORS.gray}Crie ou configure o arquivo .env em packages/daemon com sua chave do OpenRouter.${CLI_COLORS.reset}`);
  process.exit(1);
}

async function startChat() {
  console.log(`${CLI_COLORS.gray}[SISTEMA] Inicializando contexto do cofre e indexador de grafo...${CLI_COLORS.reset}`);
  
  let vaultContext;
  try {
    vaultContext = await initVaultContext();
  } catch (err: any) {
    console.error(`${CLI_COLORS.red}[ERRO CRÍTICO AO INICIALIZAR COFRE]${CLI_COLORS.reset}`, err.message);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.on('SIGINT', () => {
    console.log(`\n${CLI_COLORS.yellow}Sinal de interrupção recebido. Encerrando JARVIS CLI...${CLI_COLORS.reset}`);
    process.exit(0);
  });

  const promptApproval = (diff: string, path: string): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log(`\n${CLI_COLORS.yellow}--- UNIFIED DIFF GERADO ---${CLI_COLORS.reset}`);
      const lines = diff.split('\n');
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          console.log(`${CLI_COLORS.green}${line}${CLI_COLORS.reset}`);
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          console.log(`${CLI_COLORS.red}${line}${CLI_COLORS.reset}`);
        } else {
          console.log(`${CLI_COLORS.gray}${line}${CLI_COLORS.reset}`);
        }
      }

      rl.question(`\n${CLI_COLORS.bold}${CLI_COLORS.cyan}[APROVAÇÃO HUMANA]${CLI_COLORS.reset} Deseja aplicar esta alteração em disco no arquivo "${path}"? [S/n]: `, (answer) => {
        const trimmed = answer.trim().toLowerCase();
        const approved = trimmed === '' || trimmed === 's' || trimmed === 'sim' || trimmed === 'y' || trimmed === 'yes';
        if (approved) {
          console.log(`${CLI_COLORS.green}✔ Alteração APROVADA. Gravando atomicamente em disco...${CLI_COLORS.reset}`);
        } else {
          console.log(`${CLI_COLORS.red}✖ Alteração REJEITADA. O arquivo em disco permaneceu intacto.${CLI_COLORS.reset}`);
        }
        resolve(approved);
      });
    });
  };

  const toolExecutor = new ToolExecutor(vaultContext, async (proposal) => {
    return await promptApproval(proposal.unifiedDiff, proposal.path);
  });

  const agent = new JarvisAgent({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    vaultConventions: vaultContext.vaultConventions
  });

  const systemPrompt = buildSystemPrompt(vaultContext.vaultConventions);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];


  const totalNotes = vaultContext.graph.getAllNodes().length;
  console.log(`\n${CLI_COLORS.green}${CLI_COLORS.bold}========================================${CLI_COLORS.reset}`);
  console.log(`${CLI_COLORS.green}${CLI_COLORS.bold}        JARVIS CLI — Módulo Ativo       ${CLI_COLORS.reset}`);
  console.log(`${CLI_COLORS.green}${CLI_COLORS.bold}========================================${CLI_COLORS.reset}`);
  console.log(`${CLI_COLORS.gray}Cofre Ativo:${CLI_COLORS.reset} ${vaultContext.vaultPath}`);
  console.log(`${CLI_COLORS.gray}Notas no Grafo:${CLI_COLORS.reset} ${totalNotes} notas indexadas`);
  console.log(`${CLI_COLORS.gray}Governança (VAULT.md):${CLI_COLORS.reset} ${vaultContext.vaultConventions ? 'Carregada' : 'Nenhuma'}`);
  console.log(`${CLI_COLORS.gray}Modelo:${CLI_COLORS.reset} ${MODEL}`);
  console.log(`${CLI_COLORS.gray}Comandos: Digite 'exit' para sair.${CLI_COLORS.reset}\n`);

  const ask = () => {
    rl.question(`\n${CLI_COLORS.bold}Você:${CLI_COLORS.reset} `, async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log(`${CLI_COLORS.green}Sessão encerrada com sucesso. Até logo!${CLI_COLORS.reset}`);
        rl.close();
        return;
      }

      if (!trimmed) {
        ask();
        return;
      }

      messages.push({ role: 'user', content: trimmed });

      try {
        const stream = agent.execute(messages, toolExecutor, {
          onToolStart: (name, args) => {
            console.log(`\n${CLI_COLORS.magenta}${CLI_COLORS.bold}[TOOL CALL]${CLI_COLORS.reset} ${CLI_COLORS.cyan}${name}${CLI_COLORS.reset}`);
            console.log(`${CLI_COLORS.gray}${JSON.stringify(args, null, 2)}${CLI_COLORS.reset}`);
          },
          onToolEnd: (name, result) => {
            if (result.isSuccess) {
              console.log(`${CLI_COLORS.green}[TOOL SUCESSO - ${name}]${CLI_COLORS.reset}`);
              if (result.data?.status === 'APPLIED') {
                console.log(`${CLI_COLORS.green}[STATUS]: Alteração aplicada e persistida no disco com sucesso.${CLI_COLORS.reset}`);
              } else if (result.data?.status === 'REJECTED') {
                console.log(`${CLI_COLORS.yellow}[STATUS]: Proposta rejeitada pelo usuário.${CLI_COLORS.reset}`);
              }
            } else {
              console.log(`${CLI_COLORS.red}[TOOL FALHA - ${name}]: ${result.error}${CLI_COLORS.reset}`);
            }
          }

        });

        process.stdout.write(`\n${CLI_COLORS.blue}${CLI_COLORS.bold}JARVIS:${CLI_COLORS.reset} `);
        let fullResponse = '';

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          process.stdout.write(content);
          fullResponse += content;
        }

        messages.push({ role: 'assistant', content: fullResponse });

      } catch (err: any) {
        console.error(`\n\n${CLI_COLORS.red}${CLI_COLORS.bold}[ERRO CRÍTICO NO AGENTE]${CLI_COLORS.reset}`);
        console.error(`${CLI_COLORS.yellow}Mensagem:${CLI_COLORS.reset} ${err.message}`);
        if (err.stack) {
          console.error(`${CLI_COLORS.gray}${err.stack}${CLI_COLORS.reset}`);
        }
      }

      process.stdout.write('\n');
      ask();
    });
  };

  ask();
}

startChat();