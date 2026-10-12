// packages/web/src/components/modals/AuthTokenModal.tsx

import React, { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { getAuthToken, setAuthToken } from '../../services/auth-storage';

interface AuthTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AuthTokenModal: React.FC<AuthTokenModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [tokenInput, setTokenInput] = useState<string>(() => getAuthToken());
  const [copiedHint, setCopiedHint] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Por favor, insira o token de autorização.');
      return;
    }
    setAuthToken(tokenInput.trim());
    setError(null);
    onSaved();
    onClose();
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText('~/.config/jarvis/auth.token');
    setCopiedHint(true);
    setTimeout(() => setCopiedHint(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md jarvis-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Segurança do Daemon Local</h2>
            <p className="text-xs text-slate-400">Autenticação Bearer (Loopback Guard)</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          O daemon JARVIS gera um token criptográfico único a cada inicialização para impedir que scripts de terceiros acessem seu cofre Obsidian.
        </p>

        <div className="p-3 mb-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Onde encontrar o token?</span>
            <button
              onClick={handleCopyPath}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px]"
            >
              <ExternalLink className="h-3 w-3" />
              {copiedHint ? 'Caminho copiado!' : 'Copiar caminho'}
            </button>
          </div>
          <p className="font-mono text-slate-400 text-[10px] break-all bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
            ~/.config/jarvis/auth.token <span className="text-slate-600">(ou %APPDATA%\jarvis\auth.token)</span>
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-cyan-400" />
              Token de Autorização:
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Cole os 64 caracteres hexadecimais..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 placeholder:text-slate-600 font-mono outline-none transition-all"
            />
            {error && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Salvar e Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
