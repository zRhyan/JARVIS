// packages/core/src/patch-engine.ts

export class PatchAmbiguousError extends Error {
  constructor() {
    super('SEARCH block corresponde a múltiplos locais no arquivo. O LLM precisa ser mais específico.');
    this.name = 'PatchAmbiguousError';
  }
}

export class PatchNotFoundError extends Error {
  constructor() {
    super('SEARCH block não encontrado no arquivo. O LLM pode ter alucinado o conteúdo ou há erro de indentação severo.');
    this.name = 'PatchNotFoundError';
  }
}

/**
 * Aplica um patch num texto usando a estratégia SEARCH/REPLACE tolerante a espaços.
 */
export function applyPatch(originalContent: string, searchBlock: string, replaceBlock: string): string {
  if (searchBlock.trim() === '') {
    throw new PatchNotFoundError();
  }

  // Escapa caracteres especiais do regex
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Quebra a busca por tokens de espaço/quebra de linha
  const searchTokens = searchBlock.trim().split(/\s+/);
  
  // Reconstrói a busca como Regex onde QUALQUER quantidade de espaço ou quebra de linha é aceita (\s+)
  const regexStr = searchTokens.map(escapeRegExp).join('\\s+');
  const regex = new RegExp(regexStr, 'g');

  const matches = [...originalContent.matchAll(regex)];

  if (matches.length === 0) {
    throw new PatchNotFoundError();
  }

  if (matches.length > 1) {
    throw new PatchAmbiguousError();
  }

  // Faz a substituição garantindo preservar o resto do texto
  return originalContent.replace(matches[0][0], replaceBlock);
}