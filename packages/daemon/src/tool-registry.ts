// packages/daemon/src/tool-registry.ts

import type OpenAI from 'openai';

/**
 * Catálogo canônico das 6 ferramentas formais do JARVIS (Marco 2).
 * Formato em JSON Schema estrito para compatibilidade total com o SDK da OpenAI e OpenRouter.
 */
export const jarvisTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_notes',
      description: 'Lista os caminhos relativos de todas as notas Markdown (.md) permitidas no cofre ou em um subdiretório especificado.',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Subdiretório opcional para filtrar a listagem (ex: "1 - Fields" ou "6 - Main Notes"). Se omitido, lista todo o cofre.'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_note',
      description: 'Lê o conteúdo integral de uma nota Markdown do cofre e retorna o texto normalizado acompanhado do seu Hash SHA-256. Você pode fornecer o caminho relativo completo OU apenas o nome da nota (o sistema resolve a pasta correta automaticamente).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho relativo ou apenas o nome da nota no cofre (ex: "Field - Operational Systems OS" ou "1 - Fields/Field - Operational Systems OS.md").'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_graph_neighborhood',
      description: 'Consulta o índice do grafo semântico em memória e retorna a vizinhança de 1-salto da nota: links de saída classificados pela taxonomia da equipe (Broader, Coordinate, Narrower, Presupposed, Derived, etc.) e backlinks (quais notas apontam para esta).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho ou nome da nota a ser consultada no grafo (ex: "Field - Operational Systems OS" ou "1 - Fields/Field - Operational Systems OS.md").'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_notes',
      description: 'Realiza busca textual ou por palavras-chave em todos os arquivos Markdown permitidos do cofre (busca tanto no conteúdo das notas quanto no caminho e nome dos arquivos).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Texto, palavra-chave ou termo a ser pesquisado nas notas.'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_block_replace',
      description: 'Propõe uma alteração pontual e atômica em uma nota existente via busca e substituição (SEARCH/REPLACE). Para inserir texto (no final ou após uma seção), primeiro leia a nota com "read_note", copie o trecho adjacente existente no "search_block" e no "replace_block" repita o trecho acompanhado do novo texto (ou informe "$END" no "search_block" para adicionar texto ao final do arquivo).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho relativo ou nome da nota a ser alterada (ex: "Field - Operational Systems OS.md" ou caminho completo).'
          },
          search_block: {
            type: 'string',
            description: 'Trecho exato do texto original a ser substituído, ou "$END" para adicionar ao final do arquivo.'
          },
          replace_block: {
            type: 'string',
            description: 'Novo texto que substituirá o trecho original ou texto a ser adicionado.'
          }
        },
        required: ['path', 'search_block', 'replace_block']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'propose_create',
      description: 'Propõe a criação de uma nova nota Markdown no cofre de forma atômica e segura. Falha se a nota já existir com conteúdo.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Caminho relativo da nova nota incluindo subpasta (ex: "6 - Main Notes/Nova Nota.md").'
          },
          content: {
            type: 'string',
            description: 'Conteúdo Markdown completo da nova nota, respeitando os padrões de cabeçalho e taxonomia da equipe.'
          }
        },
        required: ['path', 'content']
      }
    }
  }
];