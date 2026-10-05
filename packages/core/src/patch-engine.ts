import { createPatch } from 'diff';

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

export interface PatchResult {
  isSuccess: boolean;
  patchedContent?: string; // O novo texto Markdown completo
  unifiedDiff?: string;    // O texto visual estilo Git (linhas vermelhas/verdes)
  errorMessage?: string;
}

/**
 * Aplica um patch num texto usando a estratégia SEARCH/REPLACE tolerante a espaços.
 * Lança PatchNotFoundError ou PatchAmbiguousError caso ocorra erro.
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

/**
 * Gera o diff unificado entre dois textos no formato padrão Git.
 */
export function generateUnifiedDiff(
  fileName: string,
  originalContent: string,
  patchedContent: string
): string {
  return createPatch(fileName, originalContent, patchedContent, 'original', 'proposta');
}

/**
 * Motor de Patch conforme a especificação do Marco 1.
 */
export class PatchEngine {
  /**
   * Aplica um bloco SEARCH/REPLACE mitigando falhas de indentação do LLM
   * e retorna o PatchResult estruturado com o diff unificado.
   */
  public applySearchAndReplace(
    originalContent: string,
    searchBlock: string,
    replaceBlock: string,
    fileName: string = 'nota.md'
  ): PatchResult {
    try {
      const patchedContent = applyPatch(originalContent, searchBlock, replaceBlock);
      const unifiedDiff = generateUnifiedDiff(fileName, originalContent, patchedContent);

      return {
        isSuccess: true,
        patchedContent,
        unifiedDiff
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        errorMessage: error.message || 'Erro desconhecido ao aplicar patch.'
      };
    }
  }
}