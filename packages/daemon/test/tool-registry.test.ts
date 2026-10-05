// packages/daemon/test/tool-registry.test.ts

import { describe, it, expect } from 'vitest';
import { jarvisTools } from '../src/tool-registry.js';

describe('Tool Registry Specifications (Marco 2)', () => {
  it('Deve exportar exatamente as 6 ferramentas canônicas', () => {
    expect(jarvisTools).toHaveLength(6);
    const names = jarvisTools.map(t => t.function.name);

    expect(names).toContain('list_notes');
    expect(names).toContain('read_note');
    expect(names).toContain('get_graph_neighborhood');
    expect(names).toContain('search_notes');
    expect(names).toContain('propose_block_replace');
    expect(names).toContain('propose_create');
  });

  it('Todas as ferramentas devem possuir schema de parâmetros válido', () => {
    for (const tool of jarvisTools) {
      expect(tool.type).toBe('function');
      expect(tool.function.name).toBeDefined();
      expect(tool.function.description).toBeDefined();
      expect(tool.function.parameters).toBeDefined();
      expect(tool.function.parameters?.type).toBe('object');
      expect(tool.function.parameters?.properties).toBeDefined();
    }
  });

  it('propose_block_replace deve requerer path, search_block e replace_block', () => {
    const tool = jarvisTools.find(t => t.function.name === 'propose_block_replace')!;
    const required = (tool.function.parameters as any).required;

    expect(required).toContain('path');
    expect(required).toContain('search_block');
    expect(required).toContain('replace_block');
  });
});
