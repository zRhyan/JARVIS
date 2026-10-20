import { describe, it, expect } from 'vitest';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

describe('@jarvis/web smoke test', () => {
  it('deve carregar o ambiente de testes do pacote web com sucesso', () => {
    expect(true).toBe(true);
  });

  it('deve carregar módulos de renderização matemática (LaTeX/KaTeX)', () => {
    expect(remarkMath).toBeDefined();
    expect(rehypeKatex).toBeDefined();
  });
});
