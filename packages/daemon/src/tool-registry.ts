// packages/daemon/src/tool-registry.ts

import type { RunnableToolFunction } from 'openai/lib/RunnableFunction';

export const jarvisTools = [
  {
    type: 'function',
    function: {
      name: 'read_note',
      description: 'Lê o conteúdo integral de uma nota Markdown do cofre.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho relativo da nota no cofre. Exemplo: "conceitos/forca.md"'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_graph',
      description: 'Consulta a taxonomia de uma nota no índice em memória (Áreas, Conceitos, Links).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho relativo da nota para inspecionar as conexões.'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_edit',
      description: 'Propõe uma alteração atômica em uma nota utilizando blocos SEARCH e REPLACE.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Caminho relativo da nota.' },
          searchBlock: { type: 'string', description: 'Trecho exato do texto original a ser substituído.' },
          replaceBlock: { type: 'string', description: 'Novo texto que substituirá o trecho.' }
        },
        required: ['path', 'searchBlock', 'replaceBlock']
      }
    }
  }
];