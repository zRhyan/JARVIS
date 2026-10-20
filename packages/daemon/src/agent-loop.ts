// packages/daemon/src/agent-loop.ts

import OpenAI from 'openai';
import { jarvisTools } from './tool-registry.js';
import type { ToolExecutor } from './tool-executor.js';

export interface AgentConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
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
Nunca alucine notas inexistentes e respeite a estrutura de pastas e notas do cofre.

[RESOLUÇÃO DE NOTAS E PASTAS]
- No cofre do Obsidian, as notas estão organizadas em diretórios temáticos (ex: '1 - Fields', '6 - Main Notes', etc.).
- Ao chamar ferramentas que recebem 'path' ('read_note', 'get_graph_neighborhood', 'propose_block_replace'): você pode fornecer o caminho relativo completo SE já o conheceu, OU simplesmente o nome limpo da nota (com ou sem .md, ex: "Field - Operational Systems OS"). O sistema JARVIS localiza e resolve automaticamente o arquivo correto em qualquer pasta do cofre.
- NUNCA invente ou adivinhe pastas fictícias (ex: NÃO invente pastas como "Areas/" ou "conceitos/"). Se não souber a pasta exata da nota, passe apenas o nome limpo da nota ou use 'search_notes'.

[DIRETRIZES DE USO DE FERRAMENTAS]
1. Para responder dúvidas conceituais, ou quando o usuário pedir para verificar notas "conectadas", "relacionadas", "vizinhança" ou "grafo" de uma nota/Field: use SEMPRE 'get_graph_neighborhood'. Esta ferramenta consulta o grafo semântico em memória instantaneamente e retorna todos os links de saída (outlinks) e backlinks sem você precisar procurar arquivo por arquivo.
2. Para localizar notas por palavras-chave ou tags quando não souber os títulos exatos, use 'search_notes' ou 'list_notes'.
3. OTIMIZAÇÃO DE VELOCIDADE (CHAMADAS PARALELAS): Se você já souber quais notas precisa ler ou pesquisar (por exemplo, após identificar 2 ou mais notas de exemplo ou links), emita SEMPRE as chamadas de ferramentas ('read_note', etc.) em LOTE / PARALELO na mesma resposta. Isso evita múltiplas rodadas lentas de comunicação.
4. Para MODIFICAR ou ADICIONAR texto em notas existentes:
   - NUNCA invente parâmetros inexistentes como 'block_id'.
   - NUNCA imprima chamadas de função como código Python (ex: print(propose_block_replace(...))). Você deve SEMPRE invocar a ferramenta nativa via function calling.
   - SEMPRE chame 'read_note' PRIMEIRO para inspecionar o conteúdo atual da nota antes de emitir a proposta.
   - Para ADICIONAR texto ao final do arquivo: utilize 'search_block: "$END"' e coloque o novo texto em 'replace_block' (ou use as últimas linhas do arquivo como 'search_block' e adicione o novo texto em 'replace_block').
   - Para INSERIR texto no meio ou após uma seção: copie o trecho de referência existente para 'search_block' e em 'replace_block' repita esse trecho acompanhado do novo texto.
   - Ao inserir wikilinks em notas (seja no Map of Content, links relacionados ou texto), NUNCA inclua o caminho de pastas nem a extensão .md. Use SEMPRE apenas o nome limpo da nota (ex: '[[Defintion - All Inference Rules in First Order Logic FOL]]' em vez de '[[6 - Main Notes/Defintion - All Inference Rules in First Order Logic FOL]]').
5. Para sugerir novas notas, use 'propose_create' respeitando os templates e taxonomias da equipe.

[DIRETRIZES DE FORMATAÇÃO E RESPOSTA]
- ESTRUTURAÇÃO VISUAL COM TÍTULOS: Ao redigir respostas analíticas, relatórios, resumos conceituais ou análises de múltiplas perguntas, utilize SEMPRE títulos e subtítulos Markdown bem definidos ('## Seção', '### Tópico') para organizar o raciocínio em seções legíveis, e não apenas linhas soltas em negrito.
- NOTAÇÃO MATEMÁTICA E LÓGICA (LaTeX): Ao formular conceitos de matemática, teoria dos grafos, algoritmos, lógica ou conjuntos, utilize SEMPRE a sintaxe LaTeX com '$ ... $' para expressões em linha (ex: '$V = \\{1, 2, 3\\}$', '$e = (u, v)$', '$G = (V, E)$') e '$$ ... $$' para equações ou blocos em destaque.
- CITAÇÃO DE NOTAS: Ao citar ou listar notas do cofre, utilize SEMPRE wikilinks do Obsidian usando apenas o nome limpo da nota: '[[Nome da Nota]]' (NUNCA inclua caminhos de diretórios como '[[Pasta/Subpasta/Nome]]' nem '.md').
- LISTAS E DETALHES: Ao listar notas do cofre, utilize SEMPRE tópicos (bullet points) organizados.
- NUNCA despeje trechos brutos de tabelas incompletas ou caracteres soltos (como barras '|' isoladas). Se for incluir um trecho, MoC ou descrição sobre a nota, coloque-o indentado com recuo abaixo do bullet point da respectiva nota com uma explicação limpa.
- Se a mensagem do usuário pedir para pesquisar, buscar ou mapear notas para listar ou para decidirem em seguida onde incluí-las (ex: "pesquise notas sobre X e depois decidimos em qual sumário colocar"), LIMITE-SE a pesquisar e listar as notas encontradas no formato de bullet points. NÃO emita propostas de modificação nem tente editar arquivos prematuramente antes da instrução explícita do usuário.
`.trim();


  if (vaultConventions && vaultConventions.trim().length > 0) {
    prompt += `\n\n[CONVENÇÕES E GOVERNANÇA DO COFRE (VAULT.md)]\n${vaultConventions.trim()}`;
  }

  return prompt;
}

export class JarvisAgent {
  private client: OpenAI;
  private model: string;
  private reasoningEffort?: 'low' | 'medium' | 'high';
  private vaultConventions?: string;

  public lastFinishReason: string | null = null;
  public totalToolsExecuted: number = 0;

  constructor(config: AgentConfig | string, baseURL?: string, model?: string) {
    let apiKey: string;
    let base: string = 'https://openrouter.ai/api/v1';
    let mdl: string = 'google/gemini-3.8-flash';

    if (typeof config === 'string') {
      apiKey = config;
      if (baseURL) base = baseURL;
      if (model) mdl = model;
    } else {
      apiKey = config.apiKey;
      if (config.baseURL) base = config.baseURL;
      if (config.model) mdl = config.model;
      this.reasoningEffort = config.reasoningEffort;
      this.vaultConventions = config.vaultConventions;
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: base,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/zrhyan/JARVIS',
        'X-Title': 'JARVIS Local Agent',
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
    const maxIterations = 25;
    let iteration = 0;
    this.lastFinishReason = null;
    this.totalToolsExecuted = 0;

    while (iteration < maxIterations) {
      iteration++;

      // 1. Chamada de inferência com ferramentas habilitadas (não-streaming para tool calling seguro)
      const extraParams: Record<string, any> = {};
      if (this.reasoningEffort) {
        extraParams.reasoning = { effort: this.reasoningEffort };
      }

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: jarvisTools,
        stream: false,
        ...extraParams
      } as any);

      const choice = response.choices?.[0];
      if (!choice) {
        console.warn(`[JARVIS Agent] Rodada ReAct (iteração ${iteration}): choices vazio retornado pela API.`);
        this.lastFinishReason = null;
        break;
      }

      this.lastFinishReason = choice.finish_reason || (choice as any)?.native_finish_reason || null;
      const message = choice.message;

      // 2. Se o modelo invocou chamadas de ferramenta
      if (message.tool_calls && message.tool_calls.length > 0) {
        this.totalToolsExecuted += message.tool_calls.length;
        console.log(`[JARVIS Agent] Rodada ReAct (iteração ${iteration}): modelo solicitou ${message.tool_calls.length} ferramenta(s): ${message.tool_calls.map((t) => t.function.name).join(', ')}`);
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

      // 3. Se não há tool calls e há conteúdo textual, o modelo gerou a resposta final.
      if (message.content) {
        console.log(`[JARVIS Agent] Rodada ReAct (iteração ${iteration}): modelo concluiu raciocínio com resposta direta (${message.content.length} caracteres, finish_reason: "${this.lastFinishReason}").`);
        // Envia o conteúdo diretamente em chunks (simulando stream fluido) para o SSE
        const chunkSize = 24;
        for (let i = 0; i < message.content.length; i += chunkSize) {
          yield {
            id: response.id,
            choices: [{
              delta: { content: message.content.slice(i, i + chunkSize) },
              finish_reason: this.lastFinishReason as any
            }]
          } as any;
          // Pequeno micro-delay para permitir que o frontend faça render suave caso haja muito texto
          await new Promise((r) => setTimeout(r, 10));
        }
        return;
      }

      // 4. Fallback de segurança: caso message.content venha vazio e não haja chamadas de ferramentas,
      // realizamos EXATAMENTE 1 tentativa automática de recuperação via streaming.
      console.warn(`[JARVIS Agent] Rodada ReAct (iteração ${iteration}): resposta sem conteúdo e sem ferramentas (finish_reason: "${this.lastFinishReason}"). Tentando 1 recuperação via streaming...`);
      let streamedChars = 0;
      try {
        const finalStream = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
          stream: true,
          ...extraParams
        } as any);

        for await (const chunk of finalStream) {
          if ((chunk as any).error) {
            this.lastFinishReason = 'error';
            throw new Error(`OpenRouter Error: ${JSON.stringify((chunk as any).error)}`);
          }
          const text = chunk.choices?.[0]?.delta?.content || '';
          if (text) {
            streamedChars += text.length;
          }
          if (chunk.choices?.[0]?.finish_reason) {
            this.lastFinishReason = chunk.choices[0].finish_reason;
          }
          yield chunk;
        }
      } catch (streamErr: any) {
        this.lastFinishReason = 'error';
        console.warn('[JARVIS Agent] Falha na tentativa de streaming de fallback:', streamErr.message);
      }

      if (streamedChars > 0) {
        return;
      }

      // Se mesmo o fallback de streaming retornou 0 caracteres, não há ferramentas sendo chamadas.
      // Encerrar imediatamente para não entrar em looping fantasma repetindo chamadas vazias.
      console.warn(`[JARVIS Agent] Fallback de streaming retornou 0 caracteres (finish_reason: "${this.lastFinishReason}"). Encerrando execução sem iterar novamente.`);
      break;
    }

    // Se atingiu o limite de iterações COM ferramentas executadas,
    // instrui o LLM a sintetizar as descobertas feitas até o momento.
    // NOTA: Usamos synthesisMessages para não poluir o histórico original persistido no banco com avisos de controle interno.
    if (iteration >= maxIterations && this.totalToolsExecuted > 0) {
      console.warn(`[JARVIS Agent] Limite de iterações atingido com ${this.totalToolsExecuted} ferramentas executadas. Disparando síntese final.`);
      const synthesisMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        {
          role: 'system',
          content:
            'Atenção: O limite de consultas de ferramentas para esta rodada foi atingido. NÃO faça novas chamadas de ferramentas. Apresente agora ao usuário uma resposta completa, clara e organizada com todas as notas, relações e descobertas encontradas até o momento.'
        }
      ];

      const fallbackExtraParams: Record<string, any> = {};
      if (this.reasoningEffort) {
        fallbackExtraParams.reasoning = { effort: this.reasoningEffort };
      }

      try {
        const synthesisResponse = await this.client.chat.completions.create({
          model: this.model,
          messages: synthesisMessages,
          stream: false,
          ...fallbackExtraParams
        } as any);
        const choice = synthesisResponse.choices?.[0];
        if (choice?.finish_reason) {
          this.lastFinishReason = choice.finish_reason;
        }
        const synthesisContent = choice?.message?.content || '';
        if (synthesisContent) {
          const chunkSize = 24;
          for (let i = 0; i < synthesisContent.length; i += chunkSize) {
            yield {
              id: synthesisResponse.id,
              choices: [{
                delta: { content: synthesisContent.slice(i, i + chunkSize) },
                finish_reason: this.lastFinishReason as any
              }]
            } as any;
            await new Promise((r) => setTimeout(r, 10));
          }
          return;
        }
      } catch (synthErr: any) {
        console.warn('[JARVIS Agent] Falha na síntese não-streaming:', synthErr.message);
      }

      try {
        const fallbackStream = await this.client.chat.completions.create({
          model: this.model,
          messages: synthesisMessages,
          stream: true,
          ...fallbackExtraParams
        } as any);

        for await (const chunk of fallbackStream) {
          if ((chunk as any).error) {
            throw new Error(`OpenRouter Error: ${JSON.stringify((chunk as any).error)}`);
          }
          if (chunk.choices?.[0]?.finish_reason) {
            this.lastFinishReason = chunk.choices[0].finish_reason;
          }
          yield chunk;
        }
      } catch (synthStreamErr: any) {
        console.warn('[JARVIS Agent] Falha na síntese streaming:', synthStreamErr.message);
      }
    }
  }
}