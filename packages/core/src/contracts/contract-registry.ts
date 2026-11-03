// packages/core/src/contracts/contract-registry.ts

import { AXIOM_SLOT_CONTRACT } from './axiom-contract.js';
import { CONJECTURE_SLOT_CONTRACT } from './conjecture-contract.js';
import type {
  CanonicalNoteArchetype,
  NoteSlotContract,
  SlotRuleDescriptor,
  VaultConventionsConfig
} from './contract-types.js';
import { DEFINITION_SLOT_CONTRACT } from './definition-contract.js';
import { FIELD_SLOT_CONTRACT } from './field-contract.js';
import { HYPOTHESIS_SLOT_CONTRACT } from './hypothesis-contract.js';
import { LAW_SLOT_CONTRACT } from './law-contract.js';
import { OBJECTION_SLOT_CONTRACT } from './objection-contract.js';
import { OBSERVATION_SLOT_CONTRACT } from './observation-contract.js';
import { PRACTICAL_SLOT_CONTRACT } from './practical-contract.js';
import { QUAESTIO_SLOT_CONTRACT } from './quaestio-contract.js';
import { THEOREM_SLOT_CONTRACT } from './theorem-contract.js';
import { THESIS_SLOT_CONTRACT } from './thesis-contract.js';
import { DEFAULT_VAULT_CONVENTIONS } from './vault-conventions.js';

/**
 * Catálogo indexado dos 12 contratos modulares de slots.
 */
const SLOT_CONTRACTS_BY_ARCHETYPE: Readonly<Record<CanonicalNoteArchetype, NoteSlotContract>> = {
  definition: DEFINITION_SLOT_CONTRACT,
  axiom: AXIOM_SLOT_CONTRACT,
  theorem: THEOREM_SLOT_CONTRACT,
  conjecture: CONJECTURE_SLOT_CONTRACT,
  observation: OBSERVATION_SLOT_CONTRACT,
  law: LAW_SLOT_CONTRACT,
  hypothesis: HYPOTHESIS_SLOT_CONTRACT,
  thesis: THESIS_SLOT_CONTRACT,
  objection: OBJECTION_SLOT_CONTRACT,
  quaestio: QUAESTIO_SLOT_CONTRACT,
  practical: PRACTICAL_SLOT_CONTRACT,
  field: FIELD_SLOT_CONTRACT
};

/**
 * Retorna o contrato formal de slots para o arquétipo solicitado,
 * aplicando eventuais overrides de prefixo, template e diretrizes configurados no Perfil.
 */
export function getSlotContract(
  archetype: CanonicalNoteArchetype,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): NoteSlotContract {
  const baseContract = SLOT_CONTRACTS_BY_ARCHETYPE[archetype];
  const profileTypeConfig = conventions.noteTypes[archetype];

  if (!profileTypeConfig) {
    return baseContract;
  }

  const overrides = profileTypeConfig.slotRuleOverrides;
  let effectiveSlots: ReadonlyArray<SlotRuleDescriptor> = baseContract.slots;

  if (overrides && Object.keys(overrides).length > 0) {
    effectiveSlots = baseContract.slots.map(slot => {
      const customDirective = overrides[slot.slotId];
      if (customDirective !== undefined && customDirective.trim() !== '') {
        return {
          ...slot,
          epistemicDirective: customDirective.trim()
        };
      }
      return slot;
    });
  }

  return {
    ...baseContract,
    defaultPrefix: profileTypeConfig.defaultPrefix,
    defaultTemplateFile: profileTypeConfig.templateFile,
    protocolReferenceNote: profileTypeConfig.protocolReferenceNote,
    slots: effectiveSlots
  };
}

/**
 * Constrói o prompt cirúrgico de contrato de slots para **um único** tipo canônico de nota.
 * Garante economia máxima de tokens ao carregar apenas as regras do arquétipo alvo
 * e filtrar apenas os slots presentes no template físico ativo (se informado).
 */
export function buildSingleNoteContractPrompt(
  archetype: CanonicalNoteArchetype,
  activeTemplateSlots?: ReadonlyArray<string>,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): string {
  const contract = getSlotContract(archetype, conventions);

  const activeSet =
    activeTemplateSlots && activeTemplateSlots.length > 0
      ? new Set(activeTemplateSlots.map(s => s.trim().toUpperCase()))
      : null;

  const filteredSlots = activeSet
    ? contract.slots.filter(s => activeSet.has(s.slotId.toUpperCase()))
    : contract.slots;

  const lines: string[] = [
    `<slot_contract archetype="${contract.canonicalType}" prefix="${contract.defaultPrefix}" template="${contract.defaultTemplateFile}" protocol="[[${contract.protocolReferenceNote}]]" modality="${contract.ruleModality}">`,
    contract.globalProtocolSummary
  ];

  if (contract.taxonomyRoutingMatrix) {
    lines.push('', contract.taxonomyRoutingMatrix);
  }

  lines.push('', 'ESPECIFICAÇÃO ESTRITA DE SLOTS (Retorne APENAS um objeto JSON { "SLOT_ID": "conteúdo" }):');

  for (const slot of filteredSlots) {
    const reqTag = slot.required ? 'OBRIGATÓRIO' : 'OPCIONAL';
    const patternSuffix = slot.formatPattern
      ? ` | Padrão: ${JSON.stringify(slot.formatPattern)}`
      : '';
    lines.push(
      `- [${slot.slotId}] (${reqTag} | Seção: "${slot.sectionTitle}" | Sintaxe: ${slot.syntaxKind}): ${slot.epistemicDirective}${patternSuffix}`
    );
  }

  lines.push('</slot_contract>');
  return lines.join('\n');
}
