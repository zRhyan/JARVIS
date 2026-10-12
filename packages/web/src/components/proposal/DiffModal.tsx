// packages/web/src/components/proposal/DiffModal.tsx

import React from 'react';
import { 
  X, 
  FileEdit, 
  Hash, 
  Maximize2 
} from 'lucide-react';
import type { Proposal } from '../../types/api';
import { DiffViewer } from './DiffViewer';
import { ProposalActions } from './ProposalActions';

interface DiffModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string) => Promise<any>;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  if (!isOpen || !proposal) return null;

  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono text-[10px]">PENDING</span>;
      case 'APPLIED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-[10px]">APPLIED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px]">REJECTED</span>;
      case 'STALE':
        return <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 font-mono text-[10px]">STALE</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] jarvis-panel rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileEdit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-semibold text-slate-100 truncate font-mono">
                  {proposal.notePath}
                </h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3 text-slate-600" />
                  baseHash: {proposal.baseHash ? proposal.baseHash.slice(0, 12) + '…' : 'novo'}
                </span>
                <span>•</span>
                <span>ID: {proposal.id.slice(0, 8)}…</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corpo com Diff Completo */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Unified Patch Preview</span>
            </span>
          </div>

          <DiffViewer unifiedDiff={proposal.unifiedDiff} />
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {proposal.status === 'PENDING' && (
              <span>Revise com atenção antes de confirmar a alteração em disco.</span>
            )}
          </div>

          <ProposalActions
            proposal={proposal}
            onApprove={onApprove}
            onReject={onReject}
            compact
          />
        </div>
      </div>
    </div>
  );
};
