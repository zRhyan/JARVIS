// packages/daemon/test/agent-loop.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JarvisAgent, buildSystemPrompt } from '../src/agent-loop.js';
import type { ToolExecutor } from '../src/tool-executor.js';

describe('JarvisAgent ReAct Loop', () => {
  it('buildSystemPrompt: deve incluir convenções do VAULT.md quando fornecidas', () => {
    const prompt = buildSystemPrompt('Regra 1: Use sempre tags');
    expect(prompt).toContain('Regra 1: Use sempre tags');
    expect(prompt).toContain('VAULT.md');
  });

  it('execute: deve executar o ciclo ReAct com tool calling e gerar chunks', async () => {
    const mockToolExecutor = {
      execute: vi.fn().mockResolvedValue({
        tool: 'read_note',
        isSuccess: true,
        data: { content: '# Física Quântica' }
      })
    } as unknown as ToolExecutor;

    const agent = new JarvisAgent('fake-api-key');

    // Mock do client.chat.completions.create
    let callCount = 0;
    (agent as any).client = {
      chat: {
        completions: {
          create: vi.fn().mockImplementation(async (params: any) => {
            callCount++;
            if (callCount === 1) {
              // 1ª chamada: modelo decide chamar read_note
              return {
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: null,
                      tool_calls: [
                        {
                          id: 'call_123',
                          type: 'function',
                          function: {
                            name: 'read_note',
                            arguments: JSON.stringify({ path: 'areas/fisica.md' })
                          }
                        }
                      ]
                    }
                  }
                ]
              };
            } else if (callCount === 2) {
              // 2ª chamada: modelo responde sem tool calls
              return {
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: 'A física é uma ciência fundamental.',
                      tool_calls: []
                    }
                  }
                ]
              };
            } else {
              // 3ª chamada: streaming final
              return (async function* () {
                yield { choices: [{ delta: { content: 'A física é ' } }] };
                yield { choices: [{ delta: { content: 'uma ciência fundamental.' } }] };
              })();
            }
          })
        }
      }
    };

    const messages: any[] = [{ role: 'user', content: 'O que é física?' }];
    const toolStartSpy = vi.fn();
    const toolEndSpy = vi.fn();

    const stream = agent.execute(messages, mockToolExecutor, {
      onToolStart: toolStartSpy,
      onToolEnd: toolEndSpy
    });

    let fullOutput = '';
    for await (const chunk of stream) {
      fullOutput += chunk.choices[0]?.delta?.content || '';
    }

    expect(toolStartSpy).toHaveBeenCalledWith('read_note', { path: 'areas/fisica.md' });
    expect(mockToolExecutor.execute).toHaveBeenCalledWith('read_note', { path: 'areas/fisica.md' });
    expect(toolEndSpy).toHaveBeenCalled();
    expect(fullOutput).toBe('A física é uma ciência fundamental.');
  });

  it('execute: deve encerrar imediatamente e capturar finish_reason quando o modelo retorna vazio sem ferramentas', async () => {
    const mockToolExecutor = {
      execute: vi.fn()
    } as unknown as ToolExecutor;

    const agent = new JarvisAgent('fake-api-key');

    let createCalls = 0;
    (agent as any).client = {
      chat: {
        completions: {
          create: vi.fn().mockImplementation(async (params: any) => {
            createCalls++;
            if (params.stream) {
              // Fallback de streaming também retorna vazio
              return (async function* () {})();
            }
            // Chamada não-streaming retorna content vazio e finish_reason length
            return {
              choices: [
                {
                  finish_reason: 'length',
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: null
                  }
                }
              ]
            };
          })
        }
      }
    };

    const messages: any[] = [{ role: 'user', content: 'Pergunta complexa' }];
    const stream = agent.execute(messages, mockToolExecutor);

    let output = '';
    for await (const chunk of stream) {
      output += chunk.choices[0]?.delta?.content || '';
    }

    expect(output).toBe('');
    // Deve fazer exatamente 2 chamadas: 1 tentativa inicial + 1 fallback de streaming
    // NÃO deve repetir 25 vezes!
    expect(createCalls).toBe(2);
    expect(agent.lastFinishReason).toBe('length');
    expect(agent.totalToolsExecuted).toBe(0);
    // Não deve poluir o array original de mensagens com instruções de sistema
    expect(messages.some((m) => m.role === 'system')).toBe(false);
  });
});
