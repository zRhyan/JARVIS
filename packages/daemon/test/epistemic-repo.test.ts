// packages/daemon/test/epistemic-repo.test.ts

import { describe, it, expect } from 'vitest';
import {
  AIFNodePartition,
  compileVaultToEpistemicEngine,
  EpistemicAIFEngine
} from '@jarvis/core';
import { openDatabase } from '../src/db.js';
import { ProfileRepository } from '../src/profile-repo.js';
import { EpistemicRepository } from '../src/epistemic-repo.js';

describe('Sub-etapa 3.2: Persistência Relacional SQLite (WITHOUT ROWID & Isolamento por Perfil)', () => {
  it('persiste e reconstrói integralmente o grafo bipartido AIF preservando contadores O(1) e metadados', () => {
    const db = openDatabase(':memory:', true);
    const profileRepo = new ProfileRepository(db);
    const epistemicRepo = new EpistemicRepository(db);

    const profile = profileRepo.create({
      name: 'Cofre Principal',
      vaultPath: '/tmp/vault-1',
      model: 'openai/gpt-4o-mini'
    });

    const engine = compileVaultToEpistemicEngine([
      {
        relativePath: 'Def - Conjunto.md',
        content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Conjuntos]]
---
---
Coleção bem definida de objetos distintos.
`
      },
      {
        relativePath: 'Def - Vértice.md',
        content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Grafos]]
- **Presupposed Concept**: [[Def - Conjunto]]
---
---
Elemento fundamental de incidência.
`
      },
      {
        relativePath: 'Def - Grafo.md',
        content: `
## Map of Content / Tags:
- **Domain Fields**: [[Teoria dos Grafos]]
- **Presupposed Concept**: [[Def - Vértice]], [[Def - Aresta Fantasma]]
---
---
Par ordenado G = (V, E).
`
      }
    ]);

    epistemicRepo.saveEngineSnapshot(profile.id, engine);

    const loaded = epistemicRepo.loadEngineSnapshot(profile.id);

    expect(loaded.getNodeCount()).toBe(engine.getNodeCount());
    expect(loaded.getEdgeCount()).toBe(engine.getEdgeCount());

    const grafoLoaded = loaded.getNodeByUri(
      'jarvis://vault?Teoria dos Grafos?Def - Grafo'
    )!;
    expect(grafoLoaded).toBeDefined();
    expect(grafoLoaded.markdownExcerpt).toBe('Par ordenado G = (V, E).');
    expect(grafoLoaded.isPlaceholder).toBe(false);

    const ghostLoaded = loaded.getNodeByUri(
      'jarvis://vault?Teoria dos Grafos?Def - Aresta Fantasma'
    )!;
    expect(ghostLoaded).toBeDefined();
    expect(ghostLoaded.isPlaceholder).toBe(true);

    const conjuntoLoaded = loaded.getNodeByUri(
      'jarvis://vault?Teoria dos Conjuntos?Def - Conjunto'
    )!;
    expect(loaded.getNodeDegrees(conjuntoLoaded.internalId).interOutDeg).toBe(1);
  });

  it('isola estritamente os nós e arestas entre diferentes perfis (profile_id) no mesmo banco', () => {
    const db = openDatabase(':memory:', true);
    const profileRepo = new ProfileRepository(db);
    const epistemicRepo = new EpistemicRepository(db);

    const p1 = profileRepo.create({
      name: 'Perfil Matemática',
      vaultPath: '/tmp/v1',
      model: 'openai/gpt-4o-mini'
    });
    const p2 = profileRepo.create({
      name: 'Perfil Filosofia',
      vaultPath: '/tmp/v2',
      model: 'openai/gpt-4o-mini'
    });

    const e1 = new EpistemicAIFEngine();
    e1.addNode({
      rawUri: 'jarvis://vault?Lógica?Axiom - Identidade',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Axiom - Identidade.md',
      markdownExcerpt: 'A = A na matemática.'
    });

    const e2 = new EpistemicAIFEngine();
    e2.addNode({
      rawUri: 'jarvis://vault?Lógica?Axiom - Identidade',
      partition: AIFNodePartition.I_NODE,
      physicalFilePath: 'Axiom - Identidade.md',
      markdownExcerpt: 'O ser é o que é na metafísica.'
    });

    epistemicRepo.saveEngineSnapshot(p1.id, e1);
    epistemicRepo.saveEngineSnapshot(p2.id, e2);

    const loaded1 = epistemicRepo.loadEngineSnapshot(p1.id);
    const loaded2 = epistemicRepo.loadEngineSnapshot(p2.id);

    expect(
      loaded1.getNodeByUri('jarvis://vault?Lógica?Axiom - Identidade')?.markdownExcerpt
    ).toBe('A = A na matemática.');
    expect(
      loaded2.getNodeByUri('jarvis://vault?Lógica?Axiom - Identidade')?.markdownExcerpt
    ).toBe('O ser é o que é na metafísica.');
  });
});
