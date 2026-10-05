// packages/daemon/src/agent-loop.ts

import OpenAI from 'openai';
import { jarvisTools } from './tool-registry.js';
import type { ToolExecutor } from './tool-executor.js';

export interface AgentConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  vaultConventions?: string;
}

export interface ToolCallbacks {
  onToolStart?: (name: string, args: any) => void;
  onToolEnd?: (name: string, result: any) => void;
}

/**
 * Constrói o System Prompt oficial do JARVIS com injeção do VAULT.md caso exista.
 */
export function buildSystemPrompt(vaultConventions?: string): string {
  let prompt = `Você é o JARVIS, assistente de engenharia e gestão de conhecimento da equipe.
Seu objetivo é gerenciar e estruturar o cofre do Obsidian utilizando ferramentas de percepção e ação com precisão absoluta.
Nunca alucine notas inexistentes e respeite rigorosamente as taxonomias de Áreas e Conceitos.

[DIRETRIZES DE USO DE FERRAMENTAS]
1. Para responder dúvidas conceituais, use 'get_graph_neighborhood' para descobrir conceitos pressupostos (Presupposed Concepts) e 'read_note' para examinar o conteúdo.
2. Para localizar notas por palavras-chave ou tags, use 'search_notes' ou 'list_notes'.
3. Para MODIFICAR ou ADICIONAR texto em notas existentes:
   - NUNCA invente parâmetros inexistentes como 'block_id'.
   - NUNCA imprima chamadas de função como código Python (ex: print(propose_block_replace(...))). Você deve SEMPRE invocar a ferramenta nativa via function calling.
   - SEMPRE chame 'read_note' PRIMEIRO para inspecionar o conteúdo atual da nota antes de emitir a proposta.
   - Para ADICIONAR texto ao final do arquivo: utilize 'search_block: "$END"' e coloque o novo texto em 'replace_block' (ou use as últimas linhas do arquivo como 'search_block' e adicione o novo texto em 'replace_block').
   - Para INSERIR texto no meio ou após uma seção: copie o trecho de referência existente para 'search_block' e em 'replace_block' repita esse trecho acompanhado do novo texto.
4. Para sugerir novas notas, use 'propose_create' respeitando os templates e taxonomias da equipe.
`.trim();


  if (vaultConventions && vaultConventions.trim().length > 0) {
    prompt += `\n\n[CONVENÇÕES E GOVERNANÇA DO COFRE (VAULT.md)]\n${vaultConventions.trim()}`;
  }

  return prompt;
}

export class JarvisAgent {
  private client: OpenAI;
  private model: string;
  private vaultConventions?: string;

  constructor(config: AgentConfig | string, baseURL?: string, model?: string) {
    let apiKey: string;
    let base: string = 'https://openrouter.ai/api/v1';
    let mdl: string = 'google/gemini-2.5-flash';

    if (typeof config === 'string') {
      apiKey = config;
      if (baseURL) base = baseURL;
      if (model) mdl = model;
    } else {
      apiKey = config.apiKey;
      if (config.baseURL) base = config.baseURL;
      if (config.model) mdl = config.model;
      this.vaultConventions = config.vaultConventions;
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: base,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JARVIS CLI',
      },
    });
    this.model = mdl;
  }

  /**
   * Executa o ciclo ReAct do agente.
   * Realiza chamadas de ferramentas de forma autônoma nos bastidores (batching)
   * e transmite os tokens da resposta conversacional final via streaming.
   */
  public async *execute(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    toolExecutor: ToolExecutor,
    callbacks?: ToolCallbacks
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown> {
    const maxIterations = 10;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // 1. Chamada de inferência com ferramentas habilitadas (não-streaming para tool calling seguro)
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: jarvisTools,
        stream: false
      });

      const choice = response.choices[0];
      const message = choice.message;

      // 2. Se o modelo invocou chamadas de ferramenta
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          let parsedArgs: Record<string, any> = {};

          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }

          if (callbacks?.onToolStart) {
            callbacks.onToolStart(toolName, parsedArgs);
          }

          const executionResult = await toolExecutor.execute(toolName, parsedArgs);

          if (callbacks?.onToolEnd) {
            callbacks.onToolEnd(toolName, executionResult);
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(executionResult)
          });
        }

        // Continua o loop para a IA analisar os resultados das ferramentas
        continue;
      }

      // 3. Se não há tool calls, o modelo gerou a resposta final.
      // Realizamos o streaming contínuo da resposta final para a interface/CLI
      const finalStream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        stream: true
      });

      for await (const chunk of finalStream) {
        if ((chunk as any).error) {
          throw new Error(`OpenRouter Error: ${JSON.stringify((chunk as any).error)}`);
        }
        yield chunk;
      }

      return;
    }

    throw new Error('Limite máximo de iterações do ReAct atingido sem resposta conclusiva.');
  }
}