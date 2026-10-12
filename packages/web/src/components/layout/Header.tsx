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
  KeyRound
} from 'lucide-react';
import type { Profile } from '../../types/api';
import { CURATED_MODELS, type CuratedModel } from '../../types/api';

interface HeaderProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  onActivateProfile: (id: string) => Promise<void>;
  onOpenNewProfileModal: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onSetDefaultModel: (profileId: string, modelId: string) => Promise<void>;
  onOpenAuthTokenModal: () => void;
  hasToken: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profiles,
  activeProfile,
  onActivateProfile,
  onOpenNewProfileModal,
  selectedModel,
  onSelectModel,
  onSetDefaultModel,
  onOpenAuthTokenModal,
  hasToken
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [savingDefaultModel, setSavingDefaultModel] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurated = CURATED_MODELS.find((m) => m.id === selectedModel);
  const isDifferentFromDefault = activeProfile && activeProfile.model !== selectedModel;

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

  return (
    <header className="h-14 jarvis-panel border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between gap-4 z-20">
      {/* Lado Esquerdo: Seletor de Perfil & Seletor de Modelo */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Dropdown de Perfis */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-left truncate max-w-[150px] md:max-w-[200px]">
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

        {/* Dropdown de Modelo Curado */}
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
            <div className="absolute top-full left-0 mt-1.5 w-80 jarvis-panel rounded-2xl border border-slate-700/80 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 flex items-center justify-between">
                <span>Modelos Curados Homologados</span>
                <Sparkles className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="py-1 space-y-1">
                {CURATED_MODELS.map((m: CuratedModel) => {
                  const isSelected = m.id === selectedModel;
                  const isDefaultOfProfile = activeProfile && activeProfile.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-colors border ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500/40 text-slate-100'
                          : 'border-transparent text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-200">{m.name}</span>
                        <div className="flex items-center gap-1.5">
                          {isDefaultOfProfile && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                              Padrão
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-300 border border-slate-800 font-mono">
                            {m.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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

      {/* Lado Direito: Guard de Token & Status */}
      <div className="flex items-center gap-3">
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
