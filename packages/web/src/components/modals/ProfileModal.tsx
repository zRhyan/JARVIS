// packages/web/src/components/modals/ProfileModal.tsx

import React, { useState } from 'react';
import { FolderGit2, X, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { CURATED_MODELS } from '../../types/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; vaultPath: string; model: string; apiKey?: string }) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [vaultPath, setVaultPath] = useState('');
  const [model, setModel] = useState(CURATED_MODELS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe um nome para o perfil.');
      return;
    }
    if (!vaultPath.trim()) {
      setError('Por favor, informe o caminho absoluto do cofre Obsidian.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        vaultPath: vaultPath.trim(),
        model: model.trim(),
        apiKey: apiKey.trim() || undefined
      });
      setName('');
      setVaultPath('');
      setApiKey('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao criar perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg jarvis-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Novo Perfil de Cofre</h2>
            <p className="text-xs text-slate-400">Configure um novo workspace e base de conhecimento</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Perfil:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aviônica KM, Notas Pessoais, Mestrado..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Caminho Absoluto do Cofre (Obsidian Vault):
            </label>
            <input
              type="text"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              placeholder="Ex: /home/usuario/Obsidian/MeuCofre ou C:\Users\..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 placeholder:text-slate-600 font-mono outline-none transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Deve ser um diretório existente no disco contendo suas notas Markdown.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Modelo Padrão Inicial:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ID OpenRouter</span>
            </label>
            <div className="space-y-1.5">
              <select
                value={CURATED_MODELS.some(m => m.id === model) ? model : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setModel(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 font-mono outline-none transition-all cursor-pointer"
              >
                {CURATED_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) — {m.badge}
                  </option>
                ))}
                <option value="custom">Outro Modelo (Personalizado)...</option>
              </select>

              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: google/gemini-2.5-flash"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Chave de API OpenRouter (Opcional):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-... (deixe em branco para usar OPENROUTER_API_KEY global)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 placeholder:text-slate-600 font-mono outline-none transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              A chave fica gravada no SQLite com permissão 0600 e nunca é exposta em logs.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Criando...' : 'Criar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
