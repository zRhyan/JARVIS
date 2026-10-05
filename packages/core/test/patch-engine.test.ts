// packages/core/test/patch-engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  applyPatch,
  generateUnifiedDiff,
  PatchEngine,
  PatchAmbiguousError,
  PatchNotFoundError
} from '../src/patch-engine.js';

describe('Patch Engine', () => {
  it('Deve aplicar patch tolerando diferenças bobas de espaçamento do LLM', () => {
    const original = `
      function soma(a, b) {
        return a + b;
      }
    `;

    // A IA errou a indentação e formatou como uma linha só
    const searchBlock = `function soma(a, b) { return a + b; }`;
    const replaceBlock = `function soma(a, b) { return a + b + 1; }`;

    const result = applyPatch(original, searchBlock, replaceBlock);
    
    expect(result).toContain('return a + b + 1;');
  });

  it('Deve lançar erro se o search block for ambíguo (múltiplas ocorrências)', () => {
    const original = `
      - Item 1
      - Item A
      - Item 1
    `;

    const searchBlock = `- Item 1`;
    const replaceBlock = `- Item Modificado`;

    expect(() => applyPatch(original, searchBlock, replaceBlock)).toThrowError(PatchAmbiguousError);
  });

  it('Deve lançar erro se o search block não for encontrado', () => {
    const original = `O rato roeu a roupa do rei.`;
    const searchBlock = `O gato roeu a roupa`;
    const replaceBlock = `...`;

    expect(() => applyPatch(original, searchBlock, replaceBlock)).toThrowError(PatchNotFoundError);
  });

  it('Deve gerar Unified Diff legível no padrão Git', () => {
    const original = 'Linha 1\nLinha 2\nLinha 3\n';
    const modified = 'Linha 1\nLinha 2 Modificada\nLinha 3\n';

    const diff = generateUnifiedDiff('exemplo.md', original, modified);

    expect(diff).toContain('--- exemplo.md');
    expect(diff).toContain('+++ exemplo.md');
    expect(diff).toContain('-Linha 2');
    expect(diff).toContain('+Linha 2 Modificada');
  });

  it('PatchEngine deve retornar PatchResult com sucesso e diff unificado estruturado', () => {
    const engine = new PatchEngine();
    const original = '# Título\n\nTexto original aqui.\n';
    const search = 'Texto original aqui.';
    const replace = 'Texto atualizado com sucesso.';

    const result = engine.applySearchAndReplace(original, search, replace, 'nota.md');

    expect(result.isSuccess).toBe(true);
    expect(result.patchedContent).toContain('Texto atualizado com sucesso.');
    expect(result.unifiedDiff).toContain('-Texto original aqui.');
    expect(result.unifiedDiff).toContain('+Texto atualizado com sucesso.');
    expect(result.errorMessage).toBeUndefined();
  });

  it('PatchEngine deve retornar PatchResult com erro estruturado em caso de falha de busca', () => {
    const engine = new PatchEngine();
    const original = 'Conteúdo base';
    const search = 'Trecho inexistente que a IA alucinou';
    const replace = 'Novo trecho';

    const result = engine.applySearchAndReplace(original, search, replace);

    expect(result.isSuccess).toBe(false);
    expect(result.patchedContent).toBeUndefined();
    expect(result.unifiedDiff).toBeUndefined();
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('SEARCH block não encontrado');
  });

  it('Deve anexar texto ao final do arquivo quando searchBlock for $END', () => {

    const original = '# Título\nConteúdo existente.';
    const result = applyPatch(original, '$END', '## Nova Seção');

    expect(result).toBe('# Título\nConteúdo existente.\n## Nova Seção');
  });

  it('Deve prefixar texto no início do arquivo quando searchBlock for $START', () => {
    const original = '# Título';
    const result = applyPatch(original, '$START', '<!-- banner -->');

    expect(result).toBe('<!-- banner -->\n# Título');
  });
});