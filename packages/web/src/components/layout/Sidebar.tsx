// packages/web/src/components/layout/Sidebar.tsx

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  MessageSquare, 
  Search, 
  Trash2, 
  Clock, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Session } from '../../types/api';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => Promise<void>;
  isDaemonOnline: boolean;
  daemonUptime: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isDaemonOnline,
  daemonUptime,
  isCollapsed,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir esta conversa?')) {
      setDeletingId(id);
      try {
        await onDeleteSession(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m ${sec % 60}s`;
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 jarvis-panel border-r border-slate-800/80 flex flex-col justify-between items-center py-4 z-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <button
            onClick={onNewSession}
            title="Nova Conversa"
            className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          title="Expandir barra lateral"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 md:w-80 jarvis-panel border-r border-slate-800/80 flex flex-col justify-between p-4 z-20 select-none">
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-wide bg-gradient-to-r from-cyan-200 via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                JARVIS
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">Obsidian Copilot</p>
            </div>
          </div>

          <button
            onClick={onToggleCollapse}
            title="Recolher barra lateral"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Botão Nova Conversa */}
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 hover:from-cyan-900/80 hover:to-emerald-900/80 text-cyan-200 border border-cyan-800/60 shadow-lg shadow-cyan-950/30 transition-all group"
        >
          <Plus className="h-4 w-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
          <span>Nova Conversa</span>
        </button>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950/60 border border-slate-800 focus:border-cyan-500/60 text-slate-200 placeholder:text-slate-600 outline-none transition-all"
          />
        </div>

        {/* Lista de Sessões Anteriores */}
        <div className="flex-1 min-h-0 flex flex-col pt-1">
          <div className="px-1 pb-2 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Conversas ({filteredSessions.length})</span>
            <Clock className="h-3 w-3" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 px-4">
                {searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa recente neste perfil.'}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isDeleting = session.id === deletingId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-slate-800/90 border-cyan-500/50 text-slate-100 shadow-sm'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-6">
                      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="truncate font-medium">{session.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={isDeleting}
                      title="Excluir conversa"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rodapé com Conectividade do Daemon */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isDaemonOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-slate-300 font-sans text-xs">Daemon Local</span>
            </span>
            <span className="text-slate-500">:4173</span>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
            <span>Uptime:</span>
            <span>{isDaemonOnline ? formatUptime(daemonUptime) : 'Offline'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
