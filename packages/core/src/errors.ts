// packages/core/src/errors.ts


/**
 * Lançado quando uma tentativa de Path Traversal (ex: ../../) é detectada,
 * tentando escapar da raiz do cofre.
 */
export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathTraversalError';
  }
}

/**
 * Lançado quando há uma tentativa de acesso a um diretório estritamente proibido
 * pelas regras canônicas do sistema (.git, .obsidian, etc).
 */
export class ProtectedPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtectedPathError';
  }
}