// packages/web/src/components/proposal/ProposalActions.tsx

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Check, 
  X 
} from 'lucide-react';
import type { Proposal, ProposalStatus } from '../../types/api';

interface ProposalActionsProps {
  proposal: Proposal;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string) => Promise<any>;
  compact?: boolean;
}

export const ProposalActions: React.FC<ProposalActionsProps> = ({
  proposal,
  onApprove,
  onReject,
  compact = false
}) => {
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const status: ProposalStatus = proposal.status;

  const handleApprove = async () => {
    setLoadingAction('approve');
    setActionError(null);
    try {
      await onApprove(proposal.id);
    } catch (err: any) {
      setActionError(err.message || 'Falha ao aprovar proposta.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    setActionError(null);
    try {
      await onReject(proposal.id);
    } catch (err: any) {
      setActionError(err.message || 'Falha ao rejeitar proposta.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (status === 'APPLIED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>Gravado atomicamente no cofre Obsidian</span>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-medium">
        <XCircle className="h-4 w-4 shrink-0 text-slate-500" />
        <span>Alteração rejeitada</span>
      </div>
    );
  }

  if (status === 'STALE') {
    return (
      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Nota Obsoleta (Conflito STALE)</span>
        </div>
        <p className="text-[11px] text-amber-300/80 leading-normal pl-6">
          O arquivo foi alterado no Obsidian antes do clique de aprovação. O JARVIS bloqueou a escrita para prevenir corrupção concorrente.
        </p>
      </div>
    );
  }

  // Estado PENDING
  return (
    <div className="space-y-2">
      {actionError && (
        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className={`flex items-center gap-2 ${compact ? 'justify-end' : 'justify-between'}`}>
        <button
          onClick={handleReject}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800/60 transition-all disabled:opacity-40"
        >
          {loadingAction === 'reject' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          <span>Rejeitar</span>
        </button>

        <button
          onClick={handleApprove}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40"
        >
          {loadingAction === 'approve' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          <span>Aprovar & Aplicar</span>
        </button>
      </div>
    </div>
  );
};
