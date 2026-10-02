// packages/daemon/src/agent-loop.ts

import OpenAI from 'openai';

export class JarvisAgent {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseURL: string, model: string) {
    // Inicialização oficial do SDK da OpenAI apontando para o OpenRouter
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JARVIS CLI',
      },
    });
    this.model = model;
  }

  /**
   * Função geradora assíncrona (Async Generator).
   * Ela faz o fetch e "cospe" (yield) pedaço por pedaço da resposta para o chat-cli.ts imprimir em tempo real.
   */
  public async *execute(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    toolHandler: (name: string, args: any) => any
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown> {
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        stream: true,
        // No futuro próximo, adicionaremos o array 'tools: [...]' aqui
      });

      for await (const chunk of stream) {
        // 1. Verificação de Erro Embutido do OpenRouter
        // Às vezes o OpenRouter não dá crash HTTP, ele manda o erro como um JSON na stream.
        if ((chunk as any).error) {
          console.error(`\n\x1b[31m[OpenRouter Stream Error]:\x1b[0m`, JSON.stringify((chunk as any).error, null, 2));
          throw new Error("A API retornou um erro estruturado dentro da stream.");
        }

        // 2. Repassa o chunk saudável para o CLI
        yield chunk;
      }

    } catch (error: any) {
      // Captura falhas de conexão, timeout ou rate limit
      console.error(`\n\x1b[31m[Falha Crítica no Motor de Inferência]\x1b[0m`);
      throw error;
    }
  }
}