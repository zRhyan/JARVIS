// packages/web/src/components/proposal/ProposalCard.tsx

import React, { useState } from 'react';
import { 
  FileEdit, 
  Maximize2 
} from 'lucide-react';
import type { Proposal } from '../../types/api';
import { DiffViewer } from './DiffViewer';
import { ProposalActions } from './ProposalActions';
import { DiffModal } from './DiffModal';

interface ProposalCardProps {
  proposal: Proposal;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string) => Promise<any>;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onApprove,
  onReject
}) => {
  const [modalOpen, setModalOpen] = useState(false);

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
    <>
      <div className="w-full max-w-2xl my-3 jarvis-panel rounded-2xl border border-slate-700/80 p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileEdit className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                  {proposal.notePath}
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                Proposta de edição com Search & Replace
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            title="Expandir visualização completa do diff"
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-mono">Expandir</span>
          </button>
        </div>

        {/* Pré-visualização do Diff (8 primeiras linhas) */}
        <div className="py-0.5">
          <DiffViewer unifiedDiff={proposal.unifiedDiff} maxLines={8} />
        </div>

        {/* Ações de Aprovação / Rejeição */}
        <div className="pt-1 border-t border-slate-800/60">
          <ProposalActions
            proposal={proposal}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      </div>

      {/* Modal Expandido */}
      <DiffModal
        proposal={proposal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
};
