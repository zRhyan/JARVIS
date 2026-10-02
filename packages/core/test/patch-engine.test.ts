// packages/core/test/patch-engine.test.ts
import { describe, it, expect } from 'vitest';
import { applyPatch, PatchAmbiguousError, PatchNotFoundError } from '../src/patch-engine';

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
});