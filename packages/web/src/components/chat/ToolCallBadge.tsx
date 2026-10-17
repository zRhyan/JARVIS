// packages/web/src/components/chat/ToolCallBadge.tsx

import React, { useState } from 'react';
import { 
  FolderTree, 
  FileText, 
  Search, 
  Network, 
  FileEdit, 
  FilePlus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { ActiveToolInfo } from '../../hooks/useChat';

interface ToolCallBadgeProps {
  toolInfo: ActiveToolInfo;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolInfo }) => {
  const [expanded, setExpanded] = useState(false);

  const getToolMeta = (tool: string) => {
    switch (tool) {
      case 'search_notes':
        return {
          label: 'Buscando Notas',
          icon: Search,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20'
        };
      case 'get_graph_neighborhood':
        return {
          label: 'Mapeando Grafo & Backlinks',
          icon: Network,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20'
        };
      case 'read_note':
        return {
          label: 'Lendo Nota',
          icon: FileText,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20'
        };
      case 'list_notes':
        return {
          label: 'Listando Cofre',
          icon: FolderTree,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20'
        };
      case 'propose_block_replace':
        return {
          label: 'Propondo Alteração (Diff)',
          icon: FileEdit,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20'
        };
      case 'propose_create':
        return {
          label: 'Propondo Criação de Nota',
          icon: FilePlus,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20'
        };
      default:
        return {
          label: tool,
          icon: Search,
          color: 'text-slate-400',
          bg: 'bg-slate-800 border-slate-700'
        };
    }
  };

  const meta = getToolMeta(toolInfo.tool);
  const Icon = meta.icon;

  const renderSummaryArg = () => {
    const a = toolInfo.args || {};
    if (toolInfo.tool === 'search_notes') return `query: "${a.query || ''}"`;
    if (toolInfo.tool === 'read_note' || toolInfo.tool === 'get_graph_neighborhood') {
      return a.path || a.relative_path || '';
    }
    if (toolInfo.tool === 'propose_block_replace' || toolInfo.tool === 'propose_create') {
      return a.path || a.relative_path || '';
    }
    return '';
  };

  const summary = renderSummaryArg();

  return (
    <div className="my-1.5 inline-block text-xs font-mono max-w-full">
      <div 
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${meta.bg}`}
      >
        <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
        
        <span className="font-semibold text-slate-200">
          {meta.label}
        </span>

        {summary && (
          <span className="text-[11px] text-slate-400 truncate max-w-[200px] md:max-w-xs font-sans">
            {summary}
          </span>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-1 ml-auto pl-2 shrink-0">
          {!toolInfo.isDone ? (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-sans">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>executando...</span>
            </span>
          ) : toolInfo.isSuccess !== false ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          ) : (
            <AlertCircle className="h-3 w-3 text-rose-400" />
          )}

          {expanded ? (
            <ChevronDown className="h-3 w-3 text-slate-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-slate-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-1 p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] space-y-1 animate-in fade-in duration-150">
          <div className="text-slate-500 font-semibold uppercase">Argumentos:</div>
          <pre className="text-slate-300 font-mono overflow-x-auto p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
            {JSON.stringify(toolInfo.args, null, 2)}
          </pre>
          {toolInfo.tool === 'propose_block_replace' && (
            <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 font-sans text-[11px] flex items-center gap-1.5">
              <span>💡 O card interativo de revisão do Diff com botões de <strong>Aprovar</strong> e <strong>Rejeitar</strong> encontra-se logo abaixo na mensagem.</span>
            </div>
          )}
          {toolInfo.error && (
            <div className="text-rose-400 pt-1">
              <strong>Erro:</strong> {toolInfo.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
