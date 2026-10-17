// packages/daemon/src/vault-context.ts

import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { VaultFSSandbox, GraphIndex } from '@jarvis/core';

import type { VaultWatcherService } from './vault-watcher.js';

export interface VaultContext {
  vaultPath: string;
  sandbox: VaultFSSandbox;
  graph: GraphIndex;
  vaultConventions?: string;
  watcher?: VaultWatcherService;
}

/**
 * Cria notas essenciais de demonstração caso o diretório do cofre esteja vazio ou recém-criado.
 */
function seedDefaultVault(vaultPath: string): void {
  const vaultMdPath = join(vaultPath, 'VAULT.md');
  const areasDir = join(vaultPath, 'areas');
  const conceitosDir = join(vaultPath, 'conceitos');

  mkdirSync(areasDir, { recursive: true });
  mkdirSync(conceitosDir, { recursive: true });

  const vaultMdContent = `# Diretrizes e Governança do Cofre (JARVIS)

## 1. Ontologia de Conhecimento da Equipe
- **Notas de Área**: Devem conter a tag \`#area\` e o bloco canônico:
  - \`**Broader Fields**:\` (Áreas pai)
  - \`**Coordinate Fields**:\` (Áreas irmãs no mesmo nível)
  - \`**Narrower Fields**:\` (Subáreas filhas)
  - \`**Core Object**:\` e \`**Machinery**:\` (Entidades e ferramentas)

- **Notas de Conceito**: Devem conter a tag \`#conceito\` e a cadeia de derivação:
  - \`**Domain Fields**:\` (Área de domínio)
  - \`**Presupposed Concept**:\` (Pré-requisitos teóricos necessários)
  - \`**Coordinate Concepts**:\` (Conceitos adjacentes)
  - \`**Derived Concepts**:\` (Aplicações ou desdobramentos)

## 2. Padrões de Wikilinks
- Utilize sempre a sintaxe \`[[Nome da Nota]]\` ou \`[[Nome da Nota|Alias]]\`.
- Sempre consulte \`get_graph_neighborhood\` para explorar conceitos pressupostos antes de responder sobre tópicos complexos.
`.trim();

  const fisicaContent = `## Map of Content / Tags: #area #fisica

- Field Taxonomy:
	- **Broader Fields**: [[Ciência da Natureza]], [[Matemática Aplicada]]
	- **Coordinate Fields**: [[Química]]
	- **Narrower Fields**: [[Mecânica Clássica]], [[Termodinâmica]]

- Related
	- **Core Object**: [[Matéria]]
	- **Machinery**:
`.trim();

  const mecanicaContent = `## Map of Content / Tags: #conceito

- **Domain Fields**: [[fisica]]

- Concept Taxonomy:
	- **Presupposed Concept**: [[Matemática Aplicada]]
	- **Coordinate Concepts**: [[Termodinâmica]]
	- **Derived Concepts**: [[forca]]
`.trim();

  const forcaContent = `## Map of Content / Tags: #conceito

- **Domain Fields**: [[Mecânica Clássica]]

- Concept Taxonomy:
	- **Presupposed Concept**: [[Massa|Massa Inercial]], [[Aceleração]]
	- **Coordinate Concepts**: [[Impulso]]
	- **Derived Concepts**: [[Trabalho]], [[Energia Cinética]]
`.trim();

  if (!existsSync(vaultMdPath)) writeFileSync(vaultMdPath, vaultMdContent, 'utf-8');
  if (!existsSync(join(areasDir, 'fisica.md'))) writeFileSync(join(areasDir, 'fisica.md'), fisicaContent, 'utf-8');
  if (!existsSync(join(conceitosDir, 'mecanica.md'))) writeFileSync(join(conceitosDir, 'mecanica.md'), mecanicaContent, 'utf-8');
  if (!existsSync(join(conceitosDir, 'forca.md'))) writeFileSync(join(conceitosDir, 'forca.md'), forcaContent, 'utf-8');
}

/**
 * Inicializa a sandbox do sistema de arquivos e o grafo em memória a partir do caminho configurado.
 */
export async function initVaultContext(customVaultPath?: string): Promise<VaultContext> {
  const envVaultPath = process.env.VAULT_PATH;
  const rawPath = customVaultPath || envVaultPath || resolve(process.cwd(), 'default-vault');
  const vaultPath = resolve(rawPath);

  if (!existsSync(vaultPath)) {
    mkdirSync(vaultPath, { recursive: true });
    seedDefaultVault(vaultPath);
  } else {
    // Se o diretório existe mas está completamente vazio, cria a estrutura base de demonstração
    try {
      const entries = readdirSync(vaultPath).filter(e => !e.startsWith('.'));
      if (entries.length === 0) {
        seedDefaultVault(vaultPath);
      }
    } catch {}
  }

  const sandbox = new VaultFSSandbox(vaultPath);
  const graph = new GraphIndex();
  await graph.buildIndex(sandbox);

  let vaultConventions: string | undefined;
  try {
    const vaultMd = await sandbox.readNote('VAULT.md');
    vaultConventions = vaultMd.content;
  } catch {
    // VAULT.md é opcional se não estiver no cofre
  }

  return {
    vaultPath,
    sandbox,
    graph,
    vaultConventions
  };
}
