// packages/core/src/vault-fs.ts

import { resolve, relative, join, dirname, sep } from 'node:path';
import { readFile, writeFile, mkdir, rename, rm, readdir, stat } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { PathTraversalError, ProtectedPathError } from './errors.js';

export interface ReadResult {
  relativePath: string;
  absolutePath: string;
  content: string;
  contentHash: string;
  sizeBytes: number;
}

const PROTECTED_DIRS = ['.git', '.obsidian', '.jarvis', 'node_modules', '.jarvis-tmp'];

export class VaultFSSandbox {
  private vaultRoot: string;
  private tmpDir: string;

  constructor(vaultRootPath: string) {
    // Garante que o caminho raiz seja absoluto e normalizado
    this.vaultRoot = resolve(vaultRootPath);
    this.tmpDir = join(this.vaultRoot, '.jarvis-tmp');
  }

  /**
   * Valida e resolve um caminho relativo para o caminho absoluto seguro.
   */
  public resolveSafePath(relativePath: string): string {
    const absolutePath = resolve(this.vaultRoot, relativePath);

    // 1. Bloqueio de Path Traversal (O caminho final deve estar contido no vaultRoot)
    // Adicionamos o 'sep' (separador do SO) para evitar que 'vault-root-fake/' passe se a raiz for 'vault-root/'
    if (!absolutePath.startsWith(this.vaultRoot + sep) && absolutePath !== this.vaultRoot) {
      throw new PathTraversalError(`Tentativa de fuga do vault detectada: ${relativePath}`);
    }

    // 2. Bloqueio de Diretórios Protegidos
    const relPathFromRoot = relative(this.vaultRoot, absolutePath);
    const pathSegments = relPathFromRoot.split(sep);

    for (const segment of pathSegments) {
      if (PROTECTED_DIRS.includes(segment)) {
        throw new ProtectedPathError(`Acesso negado ao diretório protegido: ${segment}`);
      }
    }

    return absolutePath;
  }

  /**
   * Lista recursivamente todos os arquivos Markdown (.md) permitidos dentro do cofre.
   */
  public async listMarkdownFiles(dirRelPath: string = ''): Promise<string[]> {
    const currentAbsPath = this.resolveSafePath(dirRelPath);
    let results: string[] = [];
    
    try {
      const entries = await readdir(currentAbsPath, { withFileTypes: true });

      for (const entry of entries) {
        // Ignora pastas protegidas e arquivos ocultos
        if (PROTECTED_DIRS.includes(entry.name) || entry.name.startsWith('.')) continue;

        const entryRelPath = join(dirRelPath, entry.name);

        if (entry.isDirectory()) {
          const subResults = await this.listMarkdownFiles(entryRelPath);
          results = results.concat(subResults);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Normaliza as barras para o padrão universal (/) nas saídas relativas
          results.push(entryRelPath.split(sep).join('/'));
        }
      }
    } catch (error: any) {
      // Ignora se o diretório não existir, útil para o primeiro uso
      if (error.code !== 'ENOENT') throw error;
    }

    return results;
  }

  /**
   * Lê uma nota com validação e retorna conteúdo + hash SHA-256.
   */
  public async readNote(relativePath: string): Promise<ReadResult> {
    const absolutePath = this.resolveSafePath(relativePath);
    
    const buffer = await readFile(absolutePath);
    let content = buffer.toString('utf-8');

    // Normaliza quebras de linha para LF durante a leitura (caso venha sujo)
    content = content.replace(/\r\n/g, '\n');

    const hash = createHash('sha256').update(content).digest('hex');

    return {
      relativePath: relativePath.split(sep).join('/'),
      absolutePath,
      content,
      contentHash: hash,
      sizeBytes: Buffer.byteLength(content, 'utf8')
    };
  }

  /**
   * Escreve uma nota de forma atômica no disco.
   */
  public async writeAtomic(relativePath: string, rawContent: string): Promise<ReadResult> {
    const targetAbsolutePath = this.resolveSafePath(relativePath);
    
    // Normaliza quebras de linha para LF (\n)
    const content = rawContent.replace(/\r\n/g, '\n');
    const hash = createHash('sha256').update(content).digest('hex');
    
    // Assegura que o diretório tmp exista
    await mkdir(this.tmpDir, { recursive: true });
    
    // Arquivo temporário isolado
    const tempFileName = `${hash}-${randomBytes(4).toString('hex')}.tmp`;
    const tempFilePath = join(this.tmpDir, tempFileName);

    try {
      // 1. Grava no temp
      await writeFile(tempFilePath, content, 'utf-8');

      // 2. Garante que as pastas de destino existam
      const targetDir = dirname(targetAbsolutePath);
      await mkdir(targetDir, { recursive: true });

      // 3. Rename atômico para o destino final
      await rename(tempFilePath, targetAbsolutePath);

      return {
        relativePath: relativePath.split(sep).join('/'),
        absolutePath: targetAbsolutePath,
        content,
        contentHash: hash,
        sizeBytes: Buffer.byteLength(content, 'utf8')
      };
    } catch (error) {
      // Em caso de falha antes do rename, limpa o lixo
      await rm(tempFilePath, { force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Limpa resíduos da pasta .jarvis-tmp/ em caso de encerramento anormal anterior.
   */
  public async cleanTempDir(): Promise<void> {
    try {
      await rm(this.tmpDir, { recursive: true, force: true });
    } catch (error) {
      // Falhas aqui não são críticas
    }
  }
}