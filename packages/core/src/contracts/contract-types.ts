// packages/core/src/contracts/contract-types.ts

import type { AIFRuleModality, CanonicalNoteType } from '../epistemic-types.js';

/**
 * Os 12 arquétipos canônicos de notas que possuem templates e contratos dedicados.
 */
export type CanonicalNoteArchetype = Exclude<CanonicalNoteType, 'generic'>;

/**
 * Classificação sintática determinística para os slots dos templates.
 */
export type SlotSyntaxKind =
  | 'status_tag'
  | 'inline_text'
  | 'inline_wikilinks'
  | 'moc_presupposed_tree'
  | 'moc_wikilink_list'
  | 'moc_related_list'
  | 'callout_multiline_bullets'
  | 'markdown_bullets'
  | 'markdown_body'
  | 'markdown_table_and_body'
  | 'mermaid_graph_td'
  | 'reference_list';

/**
 * Regra e especificação formal de um único slot `<!-- SLOT:X -->` dentro de um template.
 */
export interface SlotRuleDescriptor {
  readonly slotId: string;
  readonly sectionTitle: string;
  readonly syntaxKind: SlotSyntaxKind;
  readonly required: boolean;
  readonly allowEmpty: boolean;
  readonly epistemicDirective: string;
  readonly formatPattern?: string;
}

/**
 * Contrato modular e autossuficiente de um dos 12 tipos canônicos de notas.
 */
export interface NoteSlotContract {
  readonly canonicalType: CanonicalNoteArchetype;
  readonly defaultPrefix: string;
  readonly defaultTemplateFile: string;
  readonly ruleModality: AIFRuleModality;
  readonly requiresZeroInDegree: boolean;
  readonly protocolReferenceNote: string;
  readonly globalProtocolSummary: string;
  readonly taxonomyRoutingMatrix?: string;
  readonly slots: ReadonlyArray<SlotRuleDescriptor>;
}

/**
 * Configuração por Perfil de cada um dos 12 tipos de nota (permite customizar prefixos,
 * arquivos de template e overrides de regras de slots sem alterar a engine).
 */
export interface NoteTypeConfig {
  readonly canonicalType: CanonicalNoteArchetype;
  readonly defaultPrefix: string;
  readonly acceptedPrefixes: ReadonlyArray<string>;
  readonly templateFile: string;
  readonly protocolReferenceNote: string;
  readonly slotRuleOverrides?: Readonly<Record<string, string>>;
}

/**
 * Catálogo completo de convenções de templates e prefixos para um Perfil de Cofre.
 */
export interface VaultConventionsConfig {
  readonly templatesDir: string;
  readonly noteTypes: Readonly<Record<CanonicalNoteArchetype, NoteTypeConfig>>;
}
