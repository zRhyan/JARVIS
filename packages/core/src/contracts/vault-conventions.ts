// packages/core/src/contracts/vault-conventions.ts

import { extractCanonicalWikilink } from '../epistemic-header-parser.js';
import type {
  CanonicalNoteArchetype,
  NoteTypeConfig,
  VaultConventionsConfig
} from './contract-types.js';

/**
 * Lista ordenada de todos os 12 arquétipos canônicos de notas.
 */
export const ALL_CANONICAL_NOTE_ARCHETYPES: ReadonlyArray<CanonicalNoteArchetype> = [
  'definition',
  'axiom',
  'theorem',
  'conjecture',
  'observation',
  'law',
  'hypothesis',
  'thesis',
  'objection',
  'quaestio',
  'practical',
  'field'
] as const;

/**
 * Convenções default do cofre, mapeadas 1:1 com os arquivos físicos em `7 - Templates/`
 * e as notas de protocolo em `6 - Main Notes/Prac - * Note.md`.
 */
export const DEFAULT_VAULT_CONVENTIONS: VaultConventionsConfig = {
  templatesDir: '7 - Templates',
  noteTypes: {
    definition: {
      canonicalType: 'definition',
      defaultPrefix: 'Def - ',
      acceptedPrefixes: ['Def - ', 'Definição - ', 'Definicao - '],
      templateFile: 'Def -.md',
      protocolReferenceNote: 'Prac - Def Note'
    },
    axiom: {
      canonicalType: 'axiom',
      defaultPrefix: 'Axiom - ',
      acceptedPrefixes: ['Axiom - ', 'Axioma - '],
      templateFile: 'Axiom -.md',
      protocolReferenceNote: 'Prac - Axiom Note'
    },
    theorem: {
      canonicalType: 'theorem',
      defaultPrefix: 'Theo - ',
      acceptedPrefixes: ['Theo - ', 'Teorema - ', 'Prop - '],
      templateFile: 'Theo -.md',
      protocolReferenceNote: 'Prac - Theo Note'
    },
    conjecture: {
      canonicalType: 'conjecture',
      defaultPrefix: 'Conj - ',
      acceptedPrefixes: ['Conj - ', 'Conjectura - '],
      templateFile: 'Conj -.md',
      protocolReferenceNote: 'Prac - Conj Note'
    },
    observation: {
      canonicalType: 'observation',
      defaultPrefix: 'Obs - ',
      acceptedPrefixes: ['Obs - ', 'Observação - ', 'Observacao - '],
      templateFile: 'Obs -.md',
      protocolReferenceNote: 'Prac - Obs Note'
    },
    law: {
      canonicalType: 'law',
      defaultPrefix: 'Law - ',
      acceptedPrefixes: ['Law - ', 'Lei - '],
      templateFile: 'Law -.md',
      protocolReferenceNote: 'Prac - Law Note'
    },
    hypothesis: {
      canonicalType: 'hypothesis',
      defaultPrefix: 'Hyp - ',
      acceptedPrefixes: ['Hyp - ', 'Hipótese - ', 'Hipotese - '],
      templateFile: 'Hyp -.md',
      protocolReferenceNote: 'Prac - Hyp Note'
    },
    thesis: {
      canonicalType: 'thesis',
      defaultPrefix: 'Tese - ',
      acceptedPrefixes: ['Tese - ', 'Thesis - '],
      templateFile: 'Tese -.md',
      protocolReferenceNote: 'Prac - Tese Note'
    },
    objection: {
      canonicalType: 'objection',
      defaultPrefix: 'Obj - ',
      acceptedPrefixes: ['Obj - ', 'Objeção - ', 'Objecao - '],
      templateFile: 'Obj -.md',
      protocolReferenceNote: 'Prac - Obj Note'
    },
    quaestio: {
      canonicalType: 'quaestio',
      defaultPrefix: 'Quest - ',
      acceptedPrefixes: ['Quest - ', 'Questão - ', 'Quaestio - '],
      templateFile: 'Quest -.md',
      protocolReferenceNote: 'Prac - Quest Note'
    },
    practical: {
      canonicalType: 'practical',
      defaultPrefix: 'Prac - ',
      acceptedPrefixes: ['Prac - ', 'Prat - ', 'Prático - ', 'Pratico - '],
      templateFile: 'Prac -.md',
      protocolReferenceNote: 'Prac - Prac Note'
    },
    field: {
      canonicalType: 'field',
      defaultPrefix: 'Field - ',
      acceptedPrefixes: ['Field - ', 'Campo - '],
      templateFile: 'Field -.md',
      protocolReferenceNote: 'Prac - Field Note'
    }
  }
};

/**
 * Mescla overrides parciais de um Perfil de Cofre sobre `DEFAULT_VAULT_CONVENTIONS`.
 */
export function resolveVaultConventions(
  overrides?: {
    templatesDir?: string;
    noteTypes?: Partial<Record<CanonicalNoteArchetype, Partial<NoteTypeConfig>>>;
  }
): VaultConventionsConfig {
  if (!overrides) {
    return DEFAULT_VAULT_CONVENTIONS;
  }

  const mergedNoteTypes = { ...DEFAULT_VAULT_CONVENTIONS.noteTypes };

  if (overrides.noteTypes) {
    for (const archetype of ALL_CANONICAL_NOTE_ARCHETYPES) {
      const custom = overrides.noteTypes[archetype];
      if (custom) {
        const base = DEFAULT_VAULT_CONVENTIONS.noteTypes[archetype];
        mergedNoteTypes[archetype] = {
          canonicalType: archetype,
          defaultPrefix: custom.defaultPrefix ?? base.defaultPrefix,
          acceptedPrefixes: custom.acceptedPrefixes ?? base.acceptedPrefixes,
          templateFile: custom.templateFile ?? base.templateFile,
          protocolReferenceNote: custom.protocolReferenceNote ?? base.protocolReferenceNote,
          ...(custom.slotRuleOverrides
            ? { slotRuleOverrides: { ...base.slotRuleOverrides, ...custom.slotRuleOverrides } }
            : base.slotRuleOverrides
              ? { slotRuleOverrides: base.slotRuleOverrides }
              : {})
        };
      }
    }
  }

  return {
    templatesDir: overrides.templatesDir ?? DEFAULT_VAULT_CONVENTIONS.templatesDir,
    noteTypes: mergedNoteTypes
  };
}

/**
 * Resolve a configuração de um tipo de nota a partir do nome do arquétipo canônico
 * (ex: `'definition'`, `'practical'`) ou do título/prefixo de uma nota (ex: `'Prac - Def Note'`).
 */
export function resolveNoteTypeConfig(
  typeOrTitle: string,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): NoteTypeConfig | undefined {
  if (!typeOrTitle) return undefined;

  const clean = extractCanonicalWikilink(typeOrTitle).trim();
  const lower = clean.toLowerCase();

  // 1. Match direto pelo identificador do arquétipo canônico
  if (lower in conventions.noteTypes) {
    return conventions.noteTypes[lower as CanonicalNoteArchetype];
  }

  // 2. Match pelos prefixos aceitos no perfil
  for (const archetype of ALL_CANONICAL_NOTE_ARCHETYPES) {
    const cfg = conventions.noteTypes[archetype];
    for (const prefix of cfg.acceptedPrefixes) {
      if (lower.startsWith(prefix.trim().toLowerCase())) {
        return cfg;
      }
    }
  }

  return undefined;
}

/**
 * Retorna o caminho relativo completo para o arquivo físico de template de um tipo canônico.
 * Ex: `getTemplateRelativePath('definition')` -> `'7 - Templates/Def -.md'`
 */
export function getTemplateRelativePath(
  archetype: CanonicalNoteArchetype,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): string {
  const cfg = conventions.noteTypes[archetype];
  const dir = conventions.templatesDir.replace(/\/+$/, '');
  return `${dir}/${cfg.templateFile}`;
}
