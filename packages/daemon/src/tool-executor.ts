// packages/daemon/src/tool-executor.ts

import { PatchEngine, type VaultFSSandbox, type GraphIndex } from '@jarvis/core';
import type { VaultContext } from './vault-context.js';

export interface ToolExecutionResult {
  tool: string;
  isSuccess: boolean;
  data?: any;
  error?: string;
}

export interface ProposalApprovalContext {
  path: string;
  baseHash: string;
  unifiedDiff: string;
  patchedContent: string;
}

export type ApprovalHandler = (proposal: ProposalApprovalContext) => Promise<boolean>;

export class ToolExecutor {
  private sandbox: VaultFSSandbox;
  private graph: GraphIndex;
  private patchEngine: PatchEngine;
  private onApproval?: ApprovalHandler;

  constructor(context: VaultContext, onApproval?: ApprovalHandler) {
    this.sandbox = context.sandbox;
    this.graph = context.graph;
    this.patchEngine = new PatchEngine();
    this.onApproval = onApproval;
  }


  /**
   * Executa a ferramenta solicitada pelo LLM e retorna uma resposta estruturada em JSON.
   */
  public async execute(name: string, rawArgs: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      switch (name) {
        case 'list_notes':
          return await this.handleListNotes(rawArgs);

        case 'read_note':
          return await this.handleReadNote(rawArgs);

        case 'get_graph_neighborhood':
          return await this.handleGetGraphNeighborhood(rawArgs);

        case 'search_notes':
          return await this.handleSearchNotes(rawArgs);

        case 'propose_block_replace':
          return await this.handleProposeBlockReplace(rawArgs);

        case 'propose_create':
          return await this.handleProposeCreate(rawArgs);

        default:
          return {
            tool: name,
            isSuccess: false,
            error: `Ferramenta desconhecida: "${name}". Consulte o catálogo de ferramentas disponíveis.`
          };
      }
    } catch (err: any) {
      return {
        tool: name,
        isSuccess: false,
        error: `Falha na execução de "${name}": ${err.message || String(err)}`
      };
    }
  }

  private async handleListNotes(args: Record<string, any>): Promise<ToolExecutionResult> {
    const dir = typeof args.directory === 'string' ? args.directory.trim() : '';
    const files = await this.sandbox.listMarkdownFiles(dir);

    return {
      tool: 'list_notes',
      isSuccess: true,
      data: {
        directory: dir || 'raiz do cofre',
        totalNotes: files.length,
        notes: files
      }
    };
  }

  /**
   * Resolve tolerantemente o caminho de uma nota no cofre:
   * 1. Testa se o caminho fornecido existe diretamente.
   * 2. Testa com extensão .md se tiver sido omitida.
   * 3. Busca no Grafo em memória por correspondência de basename.
   * 4. Varre os arquivos físicos no sandbox para localizar a nota pelo nome.
   */
  public async resolveNotePath(inputPath: string): Promise<string> {
    const clean = inputPath.trim().replace(/^\.\//, '');

    // 1. Testa se o caminho exato existe
    try {
      await this.sandbox.readNote(clean);
      return clean;
    } catch {}

    // 1.1 Testa adicionando .md se omitido
    if (!clean.endsWith('.md')) {
      try {
        await this.sandbox.readNote(clean + '.md');
        return clean + '.md';
      } catch {}
    }

    // 2. Tenta resolução via grafo (com suporte a basename)
    const fromGraph = this.graph.resolveNotePath(clean);
    if (fromGraph) {
      return fromGraph;
    }

    // 3. Fallback: varre o cofre pelo basename
    const baseName = (clean.split('/').pop() || '').replace(/\.md$/i, '').trim().toLowerCase();
    try {
      const allFiles = await this.sandbox.listMarkdownFiles();
      const fileMatch = allFiles.find(f => {
        const fBase = (f.split('/').pop() || '').replace(/\.md$/i, '').trim().toLowerCase();
        return fBase === baseName;
      });
      if (fileMatch) {
        return fileMatch;
      }
    } catch {}

    return clean;
  }

  private async handleReadNote(args: Record<string, any>): Promise<ToolExecutionResult> {
    const notePath = args.path;
    if (!notePath || typeof notePath !== 'string') {
      return {
        tool: 'read_note',
        isSuccess: false,
        error: 'O parâmetro "path" é obrigatório para leitura.'
      };
    }

    const resolvedPath = await this.resolveNotePath(notePath);
    const result = await this.sandbox.readNote(resolvedPath);

    return {
      tool: 'read_note',
      isSuccess: true,
      data: {
        relativePath: result.relativePath,
        content: result.content,
        contentHash: result.contentHash,
        sizeBytes: result.sizeBytes
      }
    };
  }

  private async handleGetGraphNeighborhood(args: Record<string, any>): Promise<ToolExecutionResult> {
    const notePath = args.path;
    if (!notePath || typeof notePath !== 'string') {
      return {
        tool: 'get_graph_neighborhood',
        isSuccess: false,
        error: 'O parâmetro "path" é obrigatório.'
      };
    }

    const cleanPath = await this.resolveNotePath(notePath);
    const node = this.graph.getNote(cleanPath);
    const outlinks = this.graph.getOutlinks(cleanPath);
    const backlinks = this.graph.getBacklinks(cleanPath);

    return {
      tool: 'get_graph_neighborhood',
      isSuccess: true,
      data: {
        queriedPath: cleanPath,
        isIndexed: !!node,
        tags: node?.tags || [],
        taxonomy: node?.taxonomy || null,
        outlinks: outlinks,
        backlinks: backlinks
      }
    };
  }

  private async handleSearchNotes(args: Record<string, any>): Promise<ToolExecutionResult> {
    const query = args.query;
    if (!query || typeof query !== 'string') {
      return {
        tool: 'search_notes',
        isSuccess: false,
        error: 'O parâmetro "query" é obrigatório para busca.'
      };
    }

    const cleanQuery = query.trim().toLowerCase();
    const allFiles = await this.sandbox.listMarkdownFiles();
    const matches: Array<{ path: string; line: number; snippet: string }> = [];

    for (const file of allFiles) {
      const fileNameLower = file.toLowerCase();
      const matchesPath = fileNameLower.includes(cleanQuery);

      try {
        const { content } = await this.sandbox.readNote(file);
        const lines = content.split('\n');
        let matchedInLines = false;

        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(cleanQuery)) {
            matchedInLines = true;
            matches.push({
              path: file,
              line: idx + 1,
              snippet: line.trim()
            });
          }
        });

        // Se o termo estiver no nome/caminho do arquivo mas não houver ocorrência específica de linha,
        // inclui a nota com snippet evidenciando o título/arquivo
        if (matchesPath && !matchedInLines) {
          const header = lines.find((l) => l.startsWith('#')) || lines.find((l) => l.trim().length > 0);
          matches.push({
            path: file,
            line: 1,
            snippet: header ? `Nota: [[${file.replace(/\.md$/, '')}]] (${header.trim()})` : `Nota: [[${file.replace(/\.md$/, '')}]]`
          });
        }
      } catch {
        // Se falhar ao ler conteúdo mas casou no path, inclui a nota
        if (matchesPath) {
          matches.push({
            path: file,
            line: 1,
            snippet: `Nota: [[${file.replace(/\.md$/, '')}]]`
          });
        }
      }
    }

    return {
      tool: 'search_notes',
      isSuccess: true,
      data: {
        query: query.trim(),
        totalMatches: matches.length,
        matches: matches.slice(0, 25) // Limita a 25 resultados para não estourar o contexto
      }
    };
  }

  private async handleProposeBlockReplace(args: Record<string, any>): Promise<ToolExecutionResult> {
    const notePath = args.path;
    let searchBlock = args.search_block ?? args.searchBlock ?? args.search_text;
    const replaceBlock = args.replace_block ?? args.replaceBlock ?? args.new_content ?? args.content ?? args.replace_text;

    // Suporte tolerante caso o modelo use block_id='end' ou position='end'
    if (args.block_id === 'end' || args.block_id === '$END' || args.position === 'end') {
      searchBlock = '$END';
    } else if (args.block_id === 'start' || args.block_id === '$START' || args.position === 'start') {
      searchBlock = '$START';
    }

    if (!notePath || searchBlock === undefined || replaceBlock === undefined) {
      return {
        tool: 'propose_block_replace',
        isSuccess: false,
        error: 'Os parâmetros "path", "search_block" e "replace_block" são obrigatórios.'
      };
    }

    // 1. Resolve o caminho tolerante da nota e lê o conteúdo atual com baseHash
    const resolvedPath = await this.resolveNotePath(notePath);
    const currentNote = await this.sandbox.readNote(resolvedPath);

    // 2. Computa a substituição e o Unified Diff usando o PatchEngine
    const patchResult = this.patchEngine.applySearchAndReplace(
      currentNote.content,
      searchBlock,
      replaceBlock,
      resolvedPath
    );

    if (!patchResult.isSuccess || !patchResult.patchedContent) {
      return {
        tool: 'propose_block_replace',
        isSuccess: false,
        error: patchResult.errorMessage || 'Falha ao aplicar bloco SEARCH/REPLACE.'
      };
    }

    // 3. Se houver um manipulador de aprovação configurado (ex: CLI interativo ou Web UI)
    if (this.onApproval) {
      const isApproved = await this.onApproval({
        path: resolvedPath,
        baseHash: currentNote.contentHash,
        unifiedDiff: patchResult.unifiedDiff || '',
        patchedContent: patchResult.patchedContent
      });

      if (isApproved) {
        // Gravação atômica direta no disco após confirmação do usuário
        const writeResult = await this.sandbox.writeAtomic(resolvedPath, patchResult.patchedContent);
        this.graph.addNote(writeResult.relativePath, writeResult.content);

        return {
          tool: 'propose_block_replace',
          isSuccess: true,
          data: {
            path: resolvedPath,
            status: 'APPLIED',
            contentHash: writeResult.contentHash,
            unifiedDiff: patchResult.unifiedDiff,
            message: 'A alteração foi revisada e APROVADA pelo usuário. O arquivo foi atualizado com sucesso no disco.'
          }
        };
      } else {
        return {
          tool: 'propose_block_replace',
          isSuccess: true,
          data: {
            path: resolvedPath,
            status: 'REJECTED',
            unifiedDiff: patchResult.unifiedDiff,
            message: 'A proposta de alteração foi REJEITADA pelo usuário. O arquivo em disco permaneceu intacto.'
          }
        };
      }
    }

    return {
      tool: 'propose_block_replace',
      isSuccess: true,
      data: {
        path: resolvedPath,
        baseHash: currentNote.contentHash,
        status: 'PENDING',
        searchBlock,
        replaceBlock,
        unifiedDiff: patchResult.unifiedDiff,
        patchedContent: patchResult.patchedContent,
        instructions: 'Proposta de alteração gerada com sucesso. O Diff unificado está pronto para revisão e aprovação.'
      }
    };
  }

  private async handleProposeCreate(args: Record<string, any>): Promise<ToolExecutionResult> {
    const notePath = args.path;
    const content = args.content;

    if (!notePath || typeof notePath !== 'string' || content === undefined) {
      return {
        tool: 'propose_create',
        isSuccess: false,
        error: 'Os parâmetros "path" e "content" são obrigatórios.'
      };
    }

    const cleanPath = notePath.trim();

    // 1. Garante que o arquivo não existe previamente com conteúdo
    try {
      const existing = await this.sandbox.readNote(cleanPath);
      if (existing.content.trim().length > 0) {
        return {
          tool: 'propose_create',
          isSuccess: false,
          error: `O arquivo "${cleanPath}" já existe no cofre e contém conteúdo. Para alterá-lo, utilize "propose_block_replace".`
        };
      }
      // Se o arquivo existe no disco mas está vazio (0 bytes), permite inicializar o conteúdo sem erro
    } catch {
      // Esperado: o arquivo não existe
    }

    // 2. Grava atomicamente a nova nota
    const writeResult = await this.sandbox.writeAtomic(cleanPath, content);

    // 3. Atualiza o índice do grafo imediatamente
    this.graph.addNote(writeResult.relativePath, writeResult.content);

    return {
      tool: 'propose_create',
      isSuccess: true,
      data: {
        path: writeResult.relativePath,
        contentHash: writeResult.contentHash,
        sizeBytes: writeResult.sizeBytes,
        message: `Nota "${writeResult.relativePath}" criada atomicamente com sucesso e indexada no grafo.`
      }
    };
  }
}
