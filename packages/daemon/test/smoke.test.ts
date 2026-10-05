// packages/daemon/test/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { jarvisTools } from '../src/tool-registry.js';
import { JarvisAgent } from '../src/agent-loop.js';

describe('@jarvis/daemon Smoke Test', () => {
  it('Deve carregar o catálogo preliminar de ferramentas', () => {
    expect(jarvisTools).toBeDefined();
    expect(jarvisTools.length).toBeGreaterThan(0);
  });

  it('Deve instanciar a classe JarvisAgent sem erros', () => {
    const agent = new JarvisAgent('fake-key', 'https://openrouter.ai/api/v1', 'fake-model');
    expect(agent).toBeDefined();
    expect(typeof agent.execute).toBe('function');
  });
});
