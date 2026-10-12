import { describe, it, expect } from 'vitest';

describe('Diff parsing logic', () => {
  it('deve identificar corretamente hunks, adições e remoções de um unified diff', () => {
    const unifiedDiff = [
      '@@ -10,4 +10,5 @@',
      ' Linha de contexto 1',
      '-Linha antiga removida',
      '+Linha nova adicionada 1',
      '+Linha nova adicionada 2',
      ' Linha de contexto 2'
    ].join('\n');

    const lines = unifiedDiff.split('\n');
    const hunks = lines.filter((l) => l.startsWith('@@'));
    const additions = lines.filter((l) => l.startsWith('+'));
    const removals = lines.filter((l) => l.startsWith('-'));
    const context = lines.filter((l) => l.startsWith(' '));

    expect(hunks.length).toBe(1);
    expect(additions.length).toBe(2);
    expect(removals.length).toBe(1);
    expect(context.length).toBe(2);
  });
});
