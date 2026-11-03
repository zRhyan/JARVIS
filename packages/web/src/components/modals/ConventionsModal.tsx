// packages/web/src/components/modals/ConventionsModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  FolderOpen,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  CANONICAL_ARCHETYPE_CATALOG,
  type CanonicalNoteArchetype,
  type Profile,
  type ProfileConventionsResponse,
  type PartialVaultConventionsConfig,
  type VaultConventionsConfig,
  type NoteSlotContract
} from '../../types/api';
import { apiClient } from '../../services/api-client';

interface ConventionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: Profile | null;
  onConventionsUpdated: () => Promise<void> | void;
}

export const ConventionsModal: React.FC<ConventionsModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onConventionsUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedArchetype, setSelectedArchetype] = useState<CanonicalNoteArchetype>('definition');
  const [showGlobalRules, setShowGlobalRules] = useState(false);

  // Estado carregado do backend
  const [contracts, setContracts] = useState<Record<CanonicalNoteArchetype, NoteSlotContract> | null>(null);

  // Estado editável local (baseado em resolvedConventions + overrides)
  const [templatesDir, setTemplatesDir] = useState('7 - Templates');
  const [noteTypesState, setNoteTypesState] = useState<VaultConventionsConfig['noteTypes'] | null>(null);

  useEffect(() => {
    if (!isOpen || !activeProfile) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const res: ProfileConventionsResponse = await apiClient.getProfileConventions(activeProfile.id);
        if (cancelled) return;
        setContracts(res.contracts);
        setTemplatesDir(res.resolvedConventions.templatesDir);
        setNoteTypesState(JSON.parse(JSON.stringify(res.resolvedConventions.noteTypes)));
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Falha ao carregar convenções e contratos do perfil.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeProfile?.id]);

  if (!isOpen) return null;

  const currentContract = contracts?.[selectedArchetype] ?? null;
  const currentTypeCfg = noteTypesState?.[selectedArchetype] ?? null;

  const handlePrefixChange = (val: string) => {
    if (!noteTypesState) return;
    setSuccessMsg(null);
    setNoteTypesState({
      ...noteTypesState,
      [selectedArchetype]: {
        ...noteTypesState[selectedArchetype],
        prefix: val
      }
    });
  };

  const handleTemplateFileChange = (val: string) => {
    if (!noteTypesState) return;
    setSuccessMsg(null);
    setNoteTypesState({
      ...noteTypesState,
      [selectedArchetype]: {
        ...noteTypesState[selectedArchetype],
        templateFile: val
      }
    });
  };

  const handleSlotRuleChange = (slotName: string, newInstruction: string, defaultInstruction: string) => {
    if (!noteTypesState) return;
    setSuccessMsg(null);
    const prevOverrides = { ...(noteTypesState[selectedArchetype].slotRuleOverrides || {}) };
    if (newInstruction.trim() === '' || newInstruction.trim() === defaultInstruction.trim()) {
      delete prevOverrides[slotName];
    } else {
      prevOverrides[slotName] = newInstruction;
    }

    setNoteTypesState({
      ...noteTypesState,
      [selectedArchetype]: {
        ...noteTypesState[selectedArchetype],
        slotRuleOverrides: Object.keys(prevOverrides).length > 0 ? prevOverrides : undefined
      }
    });
  };

  const handleResetSlotRule = (slotName: string) => {
    if (!noteTypesState) return;
    setSuccessMsg(null);
    const prevOverrides = { ...(noteTypesState[selectedArchetype].slotRuleOverrides || {}) };
    delete prevOverrides[slotName];
    setNoteTypesState({
      ...noteTypesState,
      [selectedArchetype]: {
        ...noteTypesState[selectedArchetype],
        slotRuleOverrides: Object.keys(prevOverrides).length > 0 ? prevOverrides : undefined
      }
    });
  };

  const handleResetCurrentArchetype = () => {
    if (!noteTypesState || !currentContract) return;
    setSuccessMsg(null);
    setNoteTypesState({
      ...noteTypesState,
      [selectedArchetype]: {
        ...noteTypesState[selectedArchetype],
        prefix: currentContract.defaultPrefix,
        templateFile: currentContract.defaultTemplateFile,
        slotRuleOverrides: undefined
      }
    });
  };

  const handleRestoreAllFactoryDefaults = async () => {
    if (!activeProfile) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.updateProfileConventions(activeProfile.id, null);
      setContracts(res.contracts);
      setTemplatesDir(res.resolvedConventions.templatesDir);
      setNoteTypesState(JSON.parse(JSON.stringify(res.resolvedConventions.noteTypes)));
      setSuccessMsg('Padrões de fábrica restaurados com sucesso para todos os 12 tipos.');
      await onConventionsUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao restaurar padrões de fábrica.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!activeProfile || !noteTypesState || !contracts) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const overridesPayload: PartialVaultConventionsConfig = {
        templatesDir: templatesDir.trim() || '7 - Templates',
        noteTypes: {}
      };

      for (const item of CANONICAL_ARCHETYPE_CATALOG) {
        const arch = item.archetype;
        const cfg = noteTypesState[arch];
        const contract = contracts[arch];
        if (!cfg || !contract) continue;

        const hasCustomPrefix = cfg.prefix !== contract.defaultPrefix;
        const hasCustomTemplate = cfg.templateFile !== contract.defaultTemplateFile;
        const hasSlotOverrides =
          cfg.slotRuleOverrides && Object.keys(cfg.slotRuleOverrides).length > 0;

        if (hasCustomPrefix || hasCustomTemplate || hasSlotOverrides) {
          overridesPayload.noteTypes![arch] = {
            prefix: cfg.prefix,
            templateFile: cfg.templateFile,
            slotRuleOverrides: hasSlotOverrides ? cfg.slotRuleOverrides : undefined
          };
        }
      }

      const res = await apiClient.updateProfileConventions(activeProfile.id, overridesPayload);
      setContracts(res.contracts);
      setTemplatesDir(res.resolvedConventions.templatesDir);
      setNoteTypesState(JSON.parse(JSON.stringify(res.resolvedConventions.noteTypes)));
      setSuccessMsg('Convenções e contratos do perfil salvos com sucesso.');
      await onConventionsUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar convenções.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[88vh] jarvis-panel rounded-2xl border border-slate-700/70 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sliders className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-semibold text-slate-100">
                  Convenções do Cofre & Contratos de Slots (12 Arquétipos)
                </h2>
                {activeProfile && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/70 text-[10px] font-mono text-emerald-300">
                    Perfil: {activeProfile.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Personalize a pasta de templates, os prefixos de arquivo e as instruções formais de cada slot (&lt;!-- SLOT:X --&gt;) por perfil.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de Alertas */}
        {(error || successMsg) && (
          <div className="px-5 pt-3 shrink-0">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Corpo Principal em 2 Colunas */}
        {isLoading || !noteTypesState || !contracts ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mb-2" />
            <p className="text-xs text-slate-400">Carregando contratos modulares e convenções do perfil...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Coluna Esquerda: Pasta de Templates + Lista dos 12 Tipos Canônicos */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/50 flex flex-col min-h-0 shrink-0">
              {/* Pasta de Templates */}
              <div className="p-3.5 border-b border-slate-800/80 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                    Pasta de Templates no Cofre:
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Relativo à raiz</span>
                </label>
                <input
                  type="text"
                  value={templatesDir}
                  onChange={(e) => {
                    setTemplatesDir(e.target.value);
                    setSuccessMsg(null);
                  }}
                  placeholder="7 - Templates"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-500 text-xs font-mono text-cyan-200 outline-none"
                />
              </div>

              {/* Lista dos 12 Arquétipos */}
              <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 flex items-center justify-between">
                <span>12 Arquétipos Canônicos</span>
                <span className="font-mono text-slate-500">Prefixo Ativo</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {CANONICAL_ARCHETYPE_CATALOG.map((item) => {
                  const arch = item.archetype;
                  const cfg = noteTypesState[arch];
                  const contract = contracts[arch];
                  const isSelected = selectedArchetype === arch;

                  const overrideCount = Object.keys(cfg?.slotRuleOverrides || {}).length;
                  const isPrefixModified = cfg && contract && cfg.prefix !== contract.defaultPrefix;
                  const isTemplateModified = cfg && contract && cfg.templateFile !== contract.defaultTemplateFile;
                  const isCustomized = overrideCount > 0 || isPrefixModified || isTemplateModified;

                  return (
                    <button
                      key={arch}
                      type="button"
                      onClick={() => setSelectedArchetype(arch)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-800/95 border-cyan-500/60 text-slate-100 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                          : 'border-transparent text-slate-300 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <span>{item.labelPt}</span>
                          {isCustomized && (
                            <span
                              title="Possui customizações neste perfil"
                              className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                            />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {cfg?.templateFile || item.templateFile}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border shrink-0 ${item.badgeColor}`}>
                        {cfg?.prefix || item.prefix}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita: Editor do Arquétipo Selecionado e seus Slots */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 md:p-5 space-y-5">
              {currentContract && currentTypeCfg && (
                <>
                  {/* Cabeçalho do Arquétipo */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-bold text-slate-100">
                            {currentContract.displayNamePt}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono text-cyan-300">
                            type: &quot;{currentContract.archetype}&quot;
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300">
                            Modalidade: {currentContract.modality}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {currentContract.epistemicSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetCurrentArchetype}
                        className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        title="Restaurar prefixo, template e slots deste tipo para o padrão de fábrica"
                      >
                        <RotateCcw className="h-3 w-3 text-amber-400" />
                        <span>Resetar {currentContract.archetype}</span>
                      </button>
                    </div>

                    {/* Campos de Prefixo e Arquivo de Template */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                          <span>Prefixo do Nome da Nota:</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Padrão: &quot;{currentContract.defaultPrefix}&quot;
                          </span>
                        </label>
                        <input
                          type="text"
                          value={currentTypeCfg.prefix}
                          onChange={(e) => handlePrefixChange(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-xs font-mono text-cyan-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <FileCode2 className="h-3 w-3 text-emerald-400" />
                            Arquivo Físico em {templatesDir}/:
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Padrão: {currentContract.defaultTemplateFile}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={currentTypeCfg.templateFile}
                          onChange={(e) => handleTemplateFileChange(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-xs font-mono text-emerald-300 outline-none"
                        />
                      </div>
                    </div>

                    {/* Diretrizes Epistêmicas Globais (Colapsável) */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setShowGlobalRules((prev) => !prev)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                      >
                        {showGlobalRules ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                        <span>
                          Diretrizes Epistêmicas Globais do Contrato ({currentContract.globalWritingRules.length} regras)
                        </span>
                      </button>

                      {showGlobalRules && (
                        <ul className="mt-2 space-y-1.5 pl-4 text-[11px] text-slate-300 list-disc bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                          {currentContract.globalWritingRules.map((rule, rIdx) => (
                            <li key={rIdx} className="leading-relaxed">
                              {rule}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Lista de Slots do Contrato */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span>
                          Slots do Template ({currentContract.slots.length} marcadores &lt;!-- SLOT:X --&gt;)
                        </span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Edite abaixo para sobrescrever a regra de qualquer slot neste perfil
                      </span>
                    </div>

                    {currentContract.slots.map((slot) => {
                      const customValue = currentTypeCfg.slotRuleOverrides?.[slot.slotName];
                      const isOverridden = customValue !== undefined;
                      const effectiveValue = isOverridden ? customValue : slot.instructions;

                      return (
                        <div
                          key={slot.slotName}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                            isOverridden
                              ? 'bg-amber-950/15 border-amber-500/40'
                              : 'bg-slate-900/50 border-slate-800/80'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono font-semibold text-cyan-300">
                                &lt;!-- SLOT:{slot.slotName} --&gt;
                              </code>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  slot.required
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {slot.required ? 'Obrigatório' : 'Opcional'}
                              </span>
                              {slot.isTaxonomyMocSlot && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                                  Map of Content
                                </span>
                              )}
                              {isOverridden && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                                  Override Ativo
                                </span>
                              )}
                            </div>

                            {isOverridden && (
                              <button
                                type="button"
                                onClick={() => handleResetSlotRule(slot.slotName)}
                                className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-mono cursor-pointer"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Restaurar instrução original</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 font-medium">{slot.description}</p>

                          <textarea
                            rows={3}
                            value={effectiveValue}
                            onChange={(e) =>
                              handleSlotRuleChange(slot.slotName, e.target.value, slot.instructions)
                            }
                            className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-cyan-500 text-xs text-slate-200 font-mono leading-relaxed outline-none resize-y"
                          />

                          {slot.formatHint && (
                            <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/70">
                              <span className="text-slate-500">Formato esperado: </span>
                              {slot.formatHint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Rodapé de Ações */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRestoreAllFactoryDefaults}
            disabled={isSaving || isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 text-xs text-slate-300 hover:text-rose-200 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Padrões de Fábrica (Todos os 12 Tipos)</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Convenções do Perfil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
