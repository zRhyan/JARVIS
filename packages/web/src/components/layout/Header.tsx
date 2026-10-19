// packages/web/src/components/layout/Header.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderGit2, 
  Cpu, 
  Shield, 
  ChevronDown, 
  Plus, 
  Check, 
  Sparkles, 
  BookmarkCheck,
  KeyRound,
  Settings,
  Volume2,
  VolumeX,
  Play,
  Brain,
  Bot,
  Terminal
} from 'lucide-react';
import type { Profile } from '../../types/api';
import { 
  CURATED_MODELS, 
  type CuratedModel, 
  MODEL_SERVICES, 
  type ModelServiceId, 
  type ReasoningEffort, 
  getModelReasoningConfig 
} from '../../types/api';
import { JarvisArcOrb } from '../hud/JarvisArcOrb';
import { getIntroFrequency, setIntroFrequency, type IntroFrequency } from '../../services/intro-config';
import { soundFX } from '../../services/sound-effects';

interface HeaderProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  onActivateProfile: (id: string) => Promise<void>;
  onOpenNewProfileModal: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  selectedReasoningEffort: ReasoningEffort;
  onSelectReasoningEffort: (effort: ReasoningEffort) => void;
  onSetDefaultModel: (profileId: string, modelId: string) => Promise<void>;
  onOpenAuthTokenModal: () => void;
  hasToken: boolean;
  onReplayIntro?: () => void;
  isStreaming?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profiles,
  activeProfile,
  onActivateProfile,
  onOpenNewProfileModal,
  selectedModel,
  onSelectModel,
  selectedReasoningEffort,
  onSelectReasoningEffort,
  onSetDefaultModel,
  onOpenAuthTokenModal,
  hasToken,
  onReplayIntro,
  isStreaming = false
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [hudDropdownOpen, setHudDropdownOpen] = useState(false);
  const [savingDefaultModel, setSavingDefaultModel] = useState(false);
  const [introFrequency, setIntroFrequencyState] = useState<IntroFrequency>(() => getIntroFrequency());
  const [soundEnabled, setSoundEnabledState] = useState(() => soundFX.isSoundEnabled());

  const profileRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        setHudDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurated = CURATED_MODELS.find((m) => m.id === selectedModel);
  const reasoningConfig = getModelReasoningConfig(selectedModel);
  const isDifferentFromDefault = activeProfile && activeProfile.model !== selectedModel;

  // Aba ativa de serviço (inicializa com o serviço do modelo ativo)
  const [selectedServiceTab, setSelectedServiceTab] = useState<ModelServiceId>(
    () => currentCurated?.service || 'gemini'
  );

  useEffect(() => {
    if (currentCurated?.service) {
      setSelectedServiceTab(currentCurated.service);
    }
  }, [selectedModel]);

  const handleMakeDefault = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProfile) return;
    setSavingDefaultModel(true);
    try {
      await onSetDefaultModel(activeProfile.id, selectedModel);
    } finally {
      setSavingDefaultModel(false);
    }
  };

  const handleModelSelect = (m: CuratedModel) => {
    onSelectModel(m.id);
    if (m.reasoning && !m.reasoning.supportedEfforts.includes(selectedReasoningEffort)) {
      onSelectReasoningEffort(m.reasoning.defaultEffort);
    }
    setModelDropdownOpen(false);
  };

  const filteredModels = CURATED_MODELS.filter((m) => m.service === selectedServiceTab);

  return (
    <header className="h-14 jarvis-panel border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between gap-4 z-20">
      {/* Lado Esquerdo: Seletor de Perfil, Seletor de Modelo & Opções de Pensamento */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Dropdown de Perfis */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-left truncate max-w-[140px] md:max-w-[190px]">
              <span className="text-[10px] text-slate-400 leading-tight">Perfil Ativo</span>
              <span className="font-semibold text-slate-200 truncate leading-tight">
                {activeProfile ? activeProfile.name : 'Selecionar Perfil'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 jarvis-panel rounded-2xl border border-slate-700/80 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                Workspaces Cadastrados
              </div>
              <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onActivateProfile(p.id);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      p.isActive
                        ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{p.vaultPath}</div>
                    </div>
                    {p.isActive && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenNewProfileModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cadastrar Novo Perfil</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown de Modelo com Navegação por Serviços */}
        <div className="relative" ref={modelRef}>
          <button
            onClick={() => setModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Cpu className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col text-left truncate max-w-[130px] md:max-w-[180px]">
              <span className="text-[10px] text-slate-400 leading-tight">Modelo IA</span>
              <span className="font-mono text-emerald-300 truncate leading-tight font-medium">
                {currentCurated ? currentCurated.name : selectedModel.split('/')[1] || selectedModel}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-[360px] md:w-[420px] jarvis-panel rounded-2xl border border-slate-700/80 p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
              {/* Cabeçalho do Dropdown */}
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/70 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>Escolha o Serviço e Modelo</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 lowercase">openrouter.ai</span>
              </div>

              {/* Seletor dos Principais Serviços (Gemini, Claude, ChatGPT, DeepSeek) */}
              <div className="grid grid-cols-4 gap-1 p-1 my-1.5 bg-slate-950/70 rounded-xl border border-slate-800/60">
                {MODEL_SERVICES.map((srv) => {
                  const isTabActive = selectedServiceTab === srv.id;
                  const renderIcon = () => {
                    if (srv.id === 'gemini') return <Sparkles className={`h-3 w-3 ${srv.accentColor}`} />;
                    if (srv.id === 'claude') return <Cpu className={`h-3 w-3 ${srv.accentColor}`} />;
                    if (srv.id === 'chatgpt') return <Bot className={`h-3 w-3 ${srv.accentColor}`} />;
                    return <Terminal className={`h-3 w-3 ${srv.accentColor}`} />;
                  };

                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceTab(srv.id)}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all text-center ${
                        isTabActive
                          ? 'bg-slate-800/90 border border-slate-600/80 shadow-md text-slate-100 font-semibold scale-[1.02]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="mb-0.5">{renderIcon()}</div>
                      <span className="text-[11px] leading-tight truncate w-full">{srv.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lista Curada do Serviço Selecionado */}
              <div className="py-1 space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {filteredModels.map((m: CuratedModel) => {
                  const isSelected = m.id === selectedModel;
                  const isDefaultOfProfile = activeProfile && activeProfile.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModelSelect(m)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border group cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/95 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)] text-slate-100'
                          : 'border-slate-800/60 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-slate-100 text-[12px] group-hover:text-cyan-300 transition-colors">
                            {m.name}
                          </span>
                          {m.contextLength && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700/80 text-slate-400 font-mono">
                              {m.contextLength}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isDefaultOfProfile && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                              Padrão
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-300 border border-slate-800 font-mono">
                            {m.badge}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                        </div>
                      </div>

                      {/* Tag destacando suporte a pensamento, se disponível */}
                      {m.reasoning && (
                        <div className="mb-1 flex items-center gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono flex items-center gap-1">
                            <Brain className="h-2.5 w-2.5 text-purple-400" />
                            <span>Thinking: Low / Med / High</span>
                          </span>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 leading-normal">{m.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Inserção de Modelo Personalizado OpenRouter */}
              <div className="p-2 pt-2 mt-1 border-t border-slate-800/80 bg-slate-950/60 rounded-xl">
                <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Outro Modelo (ID OpenRouter):
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('customModel') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      onSelectModel(val);
                      setModelDropdownOpen(false);
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    name="customModel"
                    type="text"
                    defaultValue={!currentCurated ? selectedModel : ''}
                    placeholder="ex: google/gemini-3.8-flash ou openai/o3-mini"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-cyan-300 placeholder:text-slate-600 outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors shrink-0"
                  >
                    Usar
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Seletor Sutil de Intensidade de Pensamento (quando o modelo suportar raciocínio) */}
        {reasoningConfig && (
          <div
            className="flex items-center gap-1 bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/50 px-2.5 py-1.5 rounded-xl transition-all shadow-sm animate-in fade-in zoom-in-95 duration-200 shrink-0"
            title="Intensidade de raciocínio deliberativo do modelo"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-300 pr-1.5 border-r border-slate-800/80">
              <Brain className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="hidden md:inline">Pensamento</span>
            </div>
            <div className="flex items-center gap-1">
              {(['low', 'medium', 'high'] as const).map((effort) => {
                const isActive = selectedReasoningEffort === effort;
                const labels: Record<string, string> = { low: 'Low', medium: 'Med', high: 'High' };
                const tooltips: Record<string, string> = {
                  low: 'Baixo: resposta mais rápida com reflexão sucinta',
                  medium: 'Médio: equilíbrio ideal entre velocidade e raciocínio analítico',
                  high: 'Alto: reflexão minuciosa e deliberação lógica profunda'
                };
                return (
                  <button
                    key={effort}
                    type="button"
                    onClick={() => onSelectReasoningEffort(effort)}
                    title={tooltips[effort]}
                    className={`px-2 py-0.5 rounded-lg text-[10px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600/40 text-purple-200 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.3)] font-semibold scale-105'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 font-medium'
                    }`}
                  >
                    {labels[effort]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão de Tornar Padrão do Perfil (Decisão 4) */}
        {isDifferentFromDefault && (
          <button
            onClick={handleMakeDefault}
            disabled={savingDefaultModel}
            title="Salvar este modelo como o padrão permanente do perfil ativo"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/60 transition-all"
          >
            <BookmarkCheck className="h-3 w-3" />
            <span>{savingDefaultModel ? 'Salvando...' : 'Definir como padrão'}</span>
          </button>
        )}
      </div>

      {/* Lado Direito: Arc Reactor Compacto, Configurações HUD & Token */}
      <div className="flex items-center gap-2.5">
        {/* Arc Reactor Compacto Animado */}
        <div
          title={isStreaming ? 'JARVIS Processando...' : 'JARVIS Núcleo Ativo'}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/60 border border-cyan-500/20"
        >
          <JarvisArcOrb
            size={28}
            state={isStreaming ? 'thinking' : 'idle'}
          />
          <span className="text-[11px] font-mono text-cyan-300 font-medium hidden lg:inline">
            {isStreaming ? 'PROCESSANDO' : 'ONLINE'}
          </span>
        </div>

        {/* Dropdown de Configurações HUD */}
        <div className="relative" ref={hudRef}>
          <button
            onClick={() => setHudDropdownOpen((prev) => !prev)}
            className="p-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Configurações da Interface HUD / JARVIS"
          >
            <Settings className="h-4 w-4" />
          </button>

          {hudDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 jarvis-panel rounded-2xl border border-slate-700/80 p-3 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
                <span>Experiência Stark HUD</span>
                <Sparkles className="h-3 w-3" />
              </div>

              {/* Frequência da Introdução */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium block">
                  Abertura Holográfica:
                </label>
                <select
                  value={introFrequency}
                  onChange={(e) => {
                    const val = e.target.value as IntroFrequency;
                    setIntroFrequencyState(val);
                    setIntroFrequency(val);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="once_per_day">1 vez ao dia (Padrão)</option>
                  <option value="always">Sempre ao carregar</option>
                  <option value="never">Desativada (Direto no chat)</option>
                </select>
              </div>

              {/* Alternar Som */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-300">Efeitos Sonoros HUD</span>
                <button
                  type="button"
                  onClick={() => {
                    const newState = !soundEnabled;
                    setSoundEnabledState(newState);
                    soundFX.setSoundEnabled(newState);
                  }}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    soundEnabled
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Botão de Repetir Introdução */}
              {onReplayIntro && (
                <button
                  type="button"
                  onClick={() => {
                    setHudDropdownOpen(false);
                    onReplayIntro();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-300 text-xs font-medium transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Ver Abertura do JARVIS</span>
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onOpenAuthTokenModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
            hasToken
              ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600 text-slate-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
          }`}
          title="Configuração de Token de Segurança (Bearer)"
        >
          {hasToken ? (
            <>
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] hidden md:inline">Token Ativo</span>
            </>
          ) : (
            <>
              <KeyRound className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span className="text-[11px]">Inserir Token</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
