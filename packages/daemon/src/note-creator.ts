// packages/daemon/src/note-creator.ts

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type OpenAI from 'openai';
import {
  ALL_CANONICAL_NOTE_ARCHETYPES,
  buildSingleNoteContractPrompt,
  DEFAULT_VAULT_CONVENTIONS,
  expandTemplateMacros,
  extractCanonicalWikilink,
  extractTemplateSlots,
  fillTemplateSlots,
  getSlotContract,
  getTemplateRelativePath,
  queryEpistemicNetwork,
  resolveNoteTypeConfig,
  sanitizeSlotPayload,
  type CanonicalNoteArchetype,
  type NoteSlotContract,
  type VaultConventionsConfig
} from '@jarvis/core';
import { syncVaultEpistemicEngine, type VaultContext } from './vault-context.js';
import type { ToolCallbacks } from './agent-loop.js';
import type { ToolExecutor } from './tool-executor.js';

export interface ParsedCreateCommand {
  isCreateCommand: boolean;
  isValid: boolean;
  errorMessage?: string;
  rawNoteTitle: string;
  rawType: string;
  archetype?: CanonicalNoteArchetype;
  domainFields: string[];
  folder?: string;
  instructions?: string;
}

export interface CompileNoteFromTemplateInput {
  ctx: VaultContext;
  archetype: CanonicalNoteArchetype;
  rawNoteTitle: string;
  domainFields?: string[];
  folder?: string;
  rawSlots: Record<string, unknown>;
  conventions?: VaultConventionsConfig;
  now?: Date;
}

export interface CompiledNoteResult {
  relativePath: string;
  canonicalTitle: string;
  cleanConceptName: string;
  archetype: CanonicalNoteArchetype;
  templatePathUsed: string;
  sanitizedSlots: Record<string, string>;
  finalContent: string;
  contentHash: string;
  sizeBytes: number;
}

/**
 * Mapa de qual slot recebe automaticamente o nome limpo do conceito em cada arquétipo,
 * caso a LLM não o tenha preenchido explicitamente.
 */
const PRIMARY_NAME_SLOT_BY_ARCHETYPE: Readonly<Record<CanonicalNoteArchetype, string>> = {
  definition: 'CONCEITO_NOME',
  axiom: 'AXIOMA_NOME',
  theorem: 'TEOREMA_NOME',
  conjecture: 'CONJECTURA_NOME',
  observation: 'OBS_NOME',
  law: 'LEI_NOME',
  hypothesis: 'HIPOTESE_NOME',
  thesis: 'TESE_NOME',
  objection: 'OBJECAO_NOME',
  quaestio: 'QUEST_NOME',
  practical: 'PRAC_NOME',
  field: 'FIELD_NOME'
};

/**
 * Resolve uma string de tipo (ex: "definition", "Def", "Def -", "theorem", "Prac", "Prat")
 * para um dos 12 arquétipos canônicos.
 */
export function resolveArchetypeInput(
  rawType: string,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): CanonicalNoteArchetype | undefined {
  if (!rawType) return undefined;
  const trimmed = rawType.trim();
  const lower = trimmed.toLowerCase().replace(/[\s\-:]+$/g, '');

  // 1. Match direto nos 12 nomes de arquétipo
  for (const arch of ALL_CANONICAL_NOTE_ARCHETYPES) {
    if (lower === arch) return arch;
  }

  // 2. Match via resolveNoteTypeConfig (com ou sem " - ")
  const fromConfig =
    resolveNoteTypeConfig(trimmed, conventions) ??
    resolveNoteTypeConfig(`${trimmed} - `, conventions);
  if (fromConfig) {
    return fromConfig.canonicalType;
  }

  // 3. Sinônimos em PT/EN comuns
  const aliasMap: Record<string, CanonicalNoteArchetype> = {
    def: 'definition',
    definicao: 'definition',
    definição: 'definition',
    axiom: 'axiom',
    axioma: 'axiom',
    postulado: 'axiom',
    theo: 'theorem',
    teorema: 'theorem',
    proposicao: 'theorem',
    proposição: 'theorem',
    lema: 'theorem',
    corolario: 'theorem',
    corolário: 'theorem',
    conj: 'conjecture',
    conjectura: 'conjecture',
    obs: 'observation',
    observacao: 'observation',
    observação: 'observation',
    evidencia: 'observation',
    evidência: 'observation',
    law: 'law',
    lei: 'law',
    hyp: 'hypothesis',
    hipotese: 'hypothesis',
    hipótese: 'hypothesis',
    tese: 'thesis',
    doutrina: 'thesis',
    obj: 'objection',
    objecao: 'objection',
    objeção: 'objection',
    quest: 'quaestio',
    questao: 'quaestio',
    questão: 'quaestio',
    quaestio: 'quaestio',
    prac: 'practical',
    prat: 'practical',
    pratico: 'practical',
    prático: 'practical',
    procedimento: 'practical',
    field: 'field',
    campo: 'field',
    area: 'field',
    área: 'field'
  };

  return aliasMap[lower];
}

/**
 * Faz o parse determinístico de um comando `/create` digitado no chat.
 * Exemplo suportado:
 * `/create note: "Grafo Conexo" type: "definition" field: "[[Field - Teoria dos Grafos]]" instructions: "Focar em caminhos"`
 */
export function parseCreateCommand(
  rawMessage: string,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): ParsedCreateCommand | null {
  if (!rawMessage || typeof rawMessage !== 'string') return null;
  const trimmed = rawMessage.trim();
  if (!/^\/create(?:\s+|$)/i.test(trimmed)) {
    return null;
  }

  const body = trimmed.replace(/^\/create\s*/i, '').trim();
  if (!body) {
    return {
      isCreateCommand: true,
      isValid: false,
      errorMessage:
        'Uso do comando `/create`: `/create note: "<Nome da Nota>" type: "<Tipo (ex: definition, theorem, axiom, prac...)>" field: "[[Field - Nome do Campo]]"`',
      rawNoteTitle: '',
      rawType: '',
      domainFields: []
    };
  }

  // Extrai pares key: "value" ou key: 'value' ou key: value até a próxima chave conhecida
  const keyRegex = /\b(note|title|nome|type|tipo|field|fields|domain|campo|folder|dir|pasta|instructions|context|prompt)\s*:\s*/gi;
  const matches: Array<{ key: string; start: number; valueStart: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = keyRegex.exec(body)) !== null) {
    matches.push({
      key: (m[1] ?? '').toLowerCase(),
      start: m.index,
      valueStart: keyRegex.lastIndex
    });
  }

  const extracted: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!;
    const nextStart = i + 1 < matches.length ? matches[i + 1]!.start : body.length;
    let rawVal = body.slice(current.valueStart, nextStart).trim();

    // Remove aspas envolventes ("..." ou '...')
    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'"))
    ) {
      rawVal = rawVal.slice(1, -1).trim();
    }
    extracted[current.key] = rawVal;
  }

  const rawNoteTitle = (extracted.note ?? extracted.title ?? extracted.nome ?? '').trim();
  const rawType = (extracted.type ?? extracted.tipo ?? '').trim();
  const rawField = (
    extracted.field ??
    extracted.fields ??
    extracted.domain ??
    extracted.campo ??
    ''
  ).trim();
  const folder = (extracted.folder ?? extracted.dir ?? extracted.pasta ?? '').trim() || undefined;
  const instructions =
    (extracted.instructions ?? extracted.context ?? extracted.prompt ?? '').trim() || undefined;

  // Se o título da nota já começar com um prefixo conhecido e type tiver sido omitido, infere o tipo pelo prefixo
  let archetype = resolveArchetypeInput(rawType, conventions);
  if (!archetype && rawNoteTitle) {
    const inferredCfg = resolveNoteTypeConfig(rawNoteTitle, conventions);
    if (inferredCfg) {
      archetype = inferredCfg.canonicalType;
    }
  }

  const domainFields: string[] = [];
  if (rawField) {
    const wikiMatches = rawField.match(/\[\[.*?\]\]/g);
    if (wikiMatches && wikiMatches.length > 0) {
      for (const wm of wikiMatches) {
        const clean = extractCanonicalWikilink(wm);
        if (clean) domainFields.push(clean);
      }
    } else {
      for (const part of rawField.split(',')) {
        const clean = extractCanonicalWikilink(part);
        if (clean) domainFields.push(clean);
      }
    }
  }

  if (!rawNoteTitle) {
    return {
      isCreateCommand: true,
      isValid: false,
      errorMessage:
        'Parâmetro obrigatório `note:` ausente no comando `/create`. Exemplo: `/create note: "Grafo Conexo" type: "definition" field: "[[Field - Teoria dos Grafos]]"`.',
      rawNoteTitle: '',
      rawType,
      archetype,
      domainFields,
      folder,
      instructions
    };
  }

  if (!archetype) {
    return {
      isCreateCommand: true,
      isValid: false,
      errorMessage: `Tipo de nota inválido ou ausente (\`type: "${rawType}"\`). Tipos suportados: ${ALL_CANONICAL_NOTE_ARCHETYPES.join(', ')}.`,
      rawNoteTitle,
      rawType,
      domainFields,
      folder,
      instructions
    };
  }

  return {
    isCreateCommand: true,
    isValid: true,
    rawNoteTitle,
    rawType: rawType || archetype,
    archetype,
    domainFields,
    folder,
    instructions
  };
}

/**
 * Resolve o título canônico (com prefixo sem duplicação), o nome limpo do conceito
 * e o caminho relativo de destino no cofre.
 */
export function resolveTargetNotePathAndTitle(
  vaultPath: string,
  archetype: CanonicalNoteArchetype,
  rawNoteTitle: string,
  explicitFolder?: string,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): {
  relativePath: string;
  canonicalTitle: string;
  cleanConceptName: string;
} {
  const typeCfg = conventions.noteTypes[archetype];
  const defaultPrefix = typeCfg.defaultPrefix;

  // Verifica se o usuário já passou uma subpasta em rawNoteTitle (ex: "6 - Main Notes/Def - X.md")
  let folderFromTitle: string | undefined;
  let baseTitle = extractCanonicalWikilink(rawNoteTitle).replace(/\.md$/i, '').trim();

  if (baseTitle.includes('/')) {
    const segments = baseTitle.split('/');
    baseTitle = (segments.pop() ?? '').trim();
    folderFromTitle = segments.join('/').trim();
  }

  // Remove qualquer prefixo já existente no título para extrair o nome limpo do conceito
  let cleanConceptName = baseTitle;
  for (const accepted of typeCfg.acceptedPrefixes) {
    const trimmedPrefix = accepted.trim();
    if (baseTitle.toLowerCase().startsWith(trimmedPrefix.toLowerCase())) {
      cleanConceptName = baseTitle.slice(trimmedPrefix.length).trim();
      break;
    }
  }

  const canonicalTitle = `${defaultPrefix}${cleanConceptName}`;

  // Determina a pasta destino
  let targetFolder = explicitFolder?.trim() || folderFromTitle;
  if (!targetFolder) {
    if (archetype === 'field' && existsSync(join(vaultPath, '1 - Fields'))) {
      targetFolder = '1 - Fields';
    } else if (archetype !== 'field' && existsSync(join(vaultPath, '6 - Main Notes'))) {
      targetFolder = '6 - Main Notes';
    }
  }

  const relativePath = targetFolder
    ? `${targetFolder.replace(/\/+$/, '')}/${canonicalTitle}.md`
    : `${canonicalTitle}.md`;

  return {
    relativePath,
    canonicalTitle,
    cleanConceptName
  };
}

/**
 * Carrega o template físico em `7 - Templates/<templateFile>` do cofre ou gera um
 * template de fallback contendo todos os marcadores `<!-- SLOT:X -->` do contrato
 * (para cofres temporários de teste onde os arquivos de `7 - Templates/` não existem).
 */
export async function loadOrBuildPhysicalTemplate(
  ctx: VaultContext,
  archetype: CanonicalNoteArchetype,
  conventions: VaultConventionsConfig = DEFAULT_VAULT_CONVENTIONS
): Promise<{ templateContent: string; templatePathUsed: string }> {
  const relTemplatePath = getTemplateRelativePath(archetype, conventions);

  try {
    const readRes = await ctx.sandbox.readNote(relTemplatePath);
    if (readRes.content.trim().length > 0) {
      return {
        templateContent: readRes.content,
        templatePathUsed: readRes.relativePath
      };
    }
  } catch {
    // Fallback abaixo caso o template físico não exista neste cofre específico
  }

  const contract = getSlotContract(archetype, conventions);
  const fallbackContent = buildFallbackTemplateFromContract(contract);
  return {
    templateContent: fallbackContent,
    templatePathUsed: `${relTemplatePath} (fallback)`
  };
}

function buildFallbackTemplateFromContract(contract: NoteSlotContract): string {
  if (contract.canonicalType === 'field') {
    return [
      '{{date}} {{time}}',
      '',
      'Status: <!-- SLOT:STATUS -->',
      '',
      '---',
      '',
      '## Map of Content / Tags:',
      '',
      '- Field Taxonomy:',
      '\t- **Broader Fields**:',
      '<!-- SLOT:MOC_BROADER_FIELDS -->',
      '\t- **Coordinate Fields**:',
      '<!-- SLOT:MOC_COORDINATE_FIELDS -->',
      '\t- **Narrower Fields**:',
      '<!-- SLOT:MOC_NARROWER_FIELDS -->',
      '',
      '- Related:',
      '\t- **Core Object**: <!-- SLOT:MOC_CORE_OBJECT -->',
      '\t- **Machinery**: <!-- SLOT:MOC_MACHINERY -->',
      '',
      '---',
      '---',
      '',
      ...contract.slots
        .filter(
          s =>
            ![
              'STATUS',
              'MOC_BROADER_FIELDS',
              'MOC_COORDINATE_FIELDS',
              'MOC_NARROWER_FIELDS',
              'MOC_CORE_OBJECT',
              'MOC_MACHINERY'
            ].includes(s.slotId)
        )
        .map(s =>
          s.syntaxKind === 'callout_multiline_bullets'
            ? `> <!-- SLOT:${s.slotId} -->`
            : s.syntaxKind === 'mermaid_graph_td'
              ? '```mermaid\n<!-- SLOT:TAXONOMIA_MERMAID -->\n```'
              : `<!-- SLOT:${s.slotId} -->`
        )
    ].join('\n');
  }

  const bodySlots = contract.slots.filter(
    s =>
      ![
        'STATUS',
        'MOC_DOMAIN_FIELDS',
        'MOC_PRESUPPOSED',
        'MOC_COORDINATE',
        'MOC_DERIVED',
        'MOC_RELATED'
      ].includes(s.slotId)
  );

  return [
    '#review #difficulty',
    '<!--SR:<% tp.date.now("YYYY-MM-DD", +3) %>,3,250-->',
    '{{date}} {{time}}',
    '',
    'Status: <!-- SLOT:STATUS -->',
    '',
    '---',
    '',
    '## Map of Content / Tags:',
    '',
    '- **Domain Fields**: <!-- SLOT:MOC_DOMAIN_FIELDS -->',
    '',
    '- Concept Taxonomy:',
    '\t- **Presupposed Concept**:',
    '<!-- SLOT:MOC_PRESUPPOSED -->',
    '\t- **Coordinate Concepts**:',
    '<!-- SLOT:MOC_COORDINATE -->',
    '\t- **Derived Concepts**:',
    '<!-- SLOT:MOC_DERIVED -->',
    '',
    '- **Related**:',
    '<!-- SLOT:MOC_RELATED -->',
    '',
    '---',
    '---',
    '',
    ...bodySlots.map(s =>
      s.syntaxKind === 'callout_multiline_bullets'
        ? `> <!-- SLOT:${s.slotId} -->`
        : s.syntaxKind === 'mermaid_graph_td'
          ? '```mermaid\n<!-- SLOT:TAXONOMIA_MERMAID -->\n```'
          : `<!-- SLOT:${s.slotId} -->`
    )
  ].join('\n');
}

/**
 * Compila, sanitiza e grava atomicamente uma nova nota a partir de um payload JSON de slots,
 * atualizando imediatamente o `GraphIndex` e o `EpistemicAIFEngine`.
 */
export async function compileNoteFromSlotPayload(
  input: CompileNoteFromTemplateInput
): Promise<CompiledNoteResult> {
  const conventions = input.conventions ?? input.ctx.conventionsConfig ?? DEFAULT_VAULT_CONVENTIONS;
  const { relativePath, canonicalTitle, cleanConceptName } = resolveTargetNotePathAndTitle(
    input.ctx.vaultPath,
    input.archetype,
    input.rawNoteTitle,
    input.folder,
    conventions
  );

  // Verifica se o arquivo já existe com conteúdo não-vazio
  try {
    const existing = await input.ctx.sandbox.readNote(relativePath);
    if (existing.content.trim().length > 0) {
      throw new Error(
        `A nota "${relativePath}" já existe no cofre e contém conteúdo. Utilize "propose_block_replace" para editá-la.`
      );
    }
  } catch (err: any) {
    if (err.message && err.message.includes('já existe no cofre')) {
      throw err;
    }
  }

  const { templateContent, templatePathUsed } = await loadOrBuildPhysicalTemplate(
    input.ctx,
    input.archetype,
    conventions
  );

  // Preenche defaults automáticos para o nome limpo do conceito e Domain Fields caso omitidos no JSON
  const enrichedRawSlots: Record<string, unknown> = { ...(input.rawSlots || {}) };
  const primaryNameSlot = PRIMARY_NAME_SLOT_BY_ARCHETYPE[input.archetype];
  if (
    primaryNameSlot &&
    (enrichedRawSlots[primaryNameSlot] === undefined ||
      String(enrichedRawSlots[primaryNameSlot]).trim() === '')
  ) {
    enrichedRawSlots[primaryNameSlot] = cleanConceptName;
  }

  if (
    input.archetype !== 'field' &&
    input.domainFields &&
    input.domainFields.length > 0 &&
    (enrichedRawSlots.MOC_DOMAIN_FIELDS === undefined ||
      String(enrichedRawSlots.MOC_DOMAIN_FIELDS).trim() === '')
  ) {
    enrichedRawSlots.MOC_DOMAIN_FIELDS = input.domainFields;
  }

  // Sanitiza todos os slots segundo o contrato formal do arquétipo
  const sanitizedSlots = sanitizeSlotPayload(input.archetype, enrichedRawSlots, conventions);

  // Expande macros de data/hora/SR e injeta os slots sanitizados
  const macroExpanded = expandTemplateMacros(templateContent, {
    title: canonicalTitle,
    domainFields: input.domainFields,
    now: input.now
  });
  const finalContent = fillTemplateSlots(macroExpanded, sanitizedSlots, {
    cleanUnfilledSlots: true
  });

  // Grava atomicamente no cofre e sincroniza os índices em memória
  const writeRes = await input.ctx.sandbox.writeAtomic(relativePath, finalContent);
  input.ctx.graph.addNote(writeRes.relativePath, writeRes.content);
  input.ctx.epistemicEngine = await syncVaultEpistemicEngine(input.ctx.sandbox);

  return {
    relativePath: writeRes.relativePath,
    canonicalTitle,
    cleanConceptName,
    archetype: input.archetype,
    templatePathUsed,
    sanitizedSlots,
    finalContent: writeRes.content,
    contentHash: writeRes.contentHash,
    sizeBytes: writeRes.sizeBytes
  };
}

/**
 * Extrai um objeto JSON de uma resposta da LLM (mesmo se vier envolto em bloco ```json ... ```).
 */
export function extractJsonObjectFromLLMResponse(rawText: string): Record<string, unknown> {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('A resposta do modelo veio vazia ao tentar extrair o JSON de slots.');
  }

  const trimmed = rawText.trim();

  // 1. Tenta parse direto
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {}

  // 2. Tenta extrair de bloco ```json ... ```
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenceMatch && fenceMatch[1]) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }

  // 3. Tenta localizar o primeiro '{' e o último '}'
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  throw new Error('Não foi possível extrair um objeto JSON válido da resposta da LLM.');
}

/**
 * Executa o Pipeline Single-Roundtrip para o comando `/create`:
 * 1. Resolve convenções do perfil + template físico + slots ativos;
 * 2. Consulta a Rede Epistêmica (`queryEpistemicNetwork`) do campo informado;
 * 3. Carrega cirurgicamente apenas o contrato de slots do arquétipo solicitado;
 * 4. Solicita à LLM o preenchimento dos slots em 1 único turno;
 * 5. Sanitiza com `sanitizeSlotPayload`, injeta no template e grava atomicamente.
 */
export async function executeSingleRoundtripCreate(params: {
  parsedCommand: ParsedCreateCommand;
  ctx: VaultContext;
  conventions: VaultConventionsConfig;
  agent: {
    execute(
      messages: OpenAI.Chat.ChatCompletionMessageParam[],
      toolExecutor: ToolExecutor,
      callbacks?: ToolCallbacks
    ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown>;
  };
  toolExecutor: ToolExecutor;
  callbacks?: ToolCallbacks;
  onToken?: (text: string) => void;
}): Promise<{
  compiledNote: CompiledNoteResult;
  assistantSummary: string;
}> {
  const { parsedCommand, ctx, conventions, agent, toolExecutor, callbacks, onToken } = params;
  const archetype = parsedCommand.archetype!;

  const { canonicalTitle, cleanConceptName } = resolveTargetNotePathAndTitle(
    ctx.vaultPath,
    archetype,
    parsedCommand.rawNoteTitle,
    parsedCommand.folder,
    conventions
  );

  // 1. Lê o template físico e identifica seus slots
  const { templateContent } = await loadOrBuildPhysicalTemplate(ctx, archetype, conventions);
  const activeSlots = extractTemplateSlots(templateContent);

  // 2. Consulta a Rede Epistêmica do Campo (e/ou da nota se já existir como placeholder)
  if (!ctx.epistemicEngine) {
    ctx.epistemicEngine = await syncVaultEpistemicEngine(ctx.sandbox);
  }
  const primaryField = parsedCommand.domainFields[0];
  const epistemicResult = queryEpistemicNetwork(ctx.epistemicEngine, {
    targetNote: canonicalTitle,
    domainField: primaryField,
    includeBoundaryAnchors: true
  });

  // 3. Carrega EXCLUSIVAMENTE o contrato do arquétipo alvo (Economia Máxima de Tokens)
  const singleContractPrompt = buildSingleNoteContractPrompt(archetype, activeSlots, conventions);

  // 4. Monta o prompt Single-Roundtrip instruindo a LLM a retornar o JSON de slots
  const singleTurnMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: [
        'Você está operando no Modo Single-Roundtrip de Criação Canônica de Notas (/create) do JARVIS.',
        'Sua tarefa é preencher com rigor formal absoluto todos os slots do contrato abaixo para a nova nota solicitada.',
        'REGRAS MANDATÓRIAS:',
        '1. NÃO invoque nenhuma ferramenta (a Rede Epistêmica e o Contrato de Slots já estão injetados abaixo).',
        '2. NÃO escreva o esqueleto Markdown da nota; retorne EXCLUSIVAMENTE um objeto JSON válido onde cada chave é o identificador exato do slot (ex: "STATUS", "MOC_PRESUPPOSED", "DEFINICAO_ENUNCIADO", etc.) e o valor é o conteúdo correspondente.',
        '3. Consuma os conceitos existentes na Rede Epistêmica abaixo como blocos consolidados via wikilinks [[Nome da Nota]], respeitando a Composicionalidade Estrita.'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        `COMANDO DE CRIAÇÃO:`,
        `- Título Canônico da Nota: "${canonicalTitle}" (Nome limpo: "${cleanConceptName}")`,
        `- Arquétipo Canônico: "${archetype}"`,
        `- Domain Field(s): ${parsedCommand.domainFields.length > 0 ? parsedCommand.domainFields.map(f => `[[${f}]]`).join(', ') : '(Inferir do contexto)'}`,
        parsedCommand.instructions ? `- Instruções Específicas do Usuário: ${parsedCommand.instructions}` : '',
        '',
        'CONTEXTO DA REDE EPISTÊMICA DO CAMPO:',
        epistemicResult.llmContextXml,
        '',
        'CONTRATO FORMAL DE SLOTS DO ARQUÉTIPO:',
        singleContractPrompt,
        '',
        'Retorne agora APENAS o objeto JSON com os slots preenchidos:'
      ]
        .filter(Boolean)
        .join('\n')
    }
  ];

  // Coleta a saída do turno único da LLM
  let rawModelOutput = '';
  for await (const chunk of agent.execute(singleTurnMessages, toolExecutor)) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) {
      rawModelOutput += delta;
    }
  }

  const rawSlots = extractJsonObjectFromLLMResponse(rawModelOutput);

  // Notifica início e fim da gravação estruturada para a UI via callbacks SSE
  const toolArgsPreview = {
    noteTitle: canonicalTitle,
    noteType: archetype,
    domainFields: parsedCommand.domainFields
  };
  callbacks?.onToolStart?.('create_note_from_template', toolArgsPreview);

  const compiledNote = await compileNoteFromSlotPayload({
    ctx,
    archetype,
    rawNoteTitle: parsedCommand.rawNoteTitle,
    domainFields: parsedCommand.domainFields,
    folder: parsedCommand.folder,
    rawSlots,
    conventions
  });

  callbacks?.onToolEnd?.('create_note_from_template', {
    tool: 'create_note_from_template',
    isSuccess: true,
    data: {
      path: compiledNote.relativePath,
      canonicalTitle: compiledNote.canonicalTitle,
      archetype: compiledNote.archetype,
      contentHash: compiledNote.contentHash
    }
  });

  const assistantSummary = [
    `✅ **Nota canônica criada com sucesso em Single-Roundtrip:** [[${compiledNote.canonicalTitle}]]`,
    `- **Caminho no Cofre:** \`${compiledNote.relativePath}\``,
    `- **Arquétipo / Template:** \`${compiledNote.archetype}\` (\`${compiledNote.templatePathUsed}\`)`,
    `- **Slots Preenchidos & Sanitizados:** \`${Object.keys(compiledNote.sanitizedSlots).length}\` slots`,
    `- **Hash SHA-256:** \`${compiledNote.contentHash.slice(0, 12)}…\``
  ].join('\n');

  if (onToken) {
    onToken(assistantSummary);
  }

  return {
    compiledNote,
    assistantSummary
  };
}
