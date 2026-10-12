// packages/web/src/components/proposal/DiffViewer.tsx

import React from 'react';

interface DiffViewerProps {
  unifiedDiff: string;
  maxLines?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ unifiedDiff, maxLines }) => {
  if (!unifiedDiff || !unifiedDiff.trim()) {
    return (
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 font-mono">
        (Nenhum diff textual gerado)
      </div>
    );
  }

  const allLines = unifiedDiff.split('\n');
  const isTruncated = maxLines !== undefined && allLines.length > maxLines;
  const linesToRender = isTruncated ? allLines.slice(0, maxLines) : allLines;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 text-xs font-mono shadow-inner select-text">
      <div className="overflow-x-auto divide-y divide-slate-900/60 leading-relaxed">
        {linesToRender.map((line, idx) => {
          if (line.startsWith('@@')) {
            // Cabeçalho de hunk
            return (
              <div
                key={idx}
                className="px-3 py-1 bg-cyan-950/30 text-cyan-400 font-semibold text-[11px] border-y border-cyan-900/40 select-none flex items-center gap-2"
              >
                <span className="text-slate-600">@@</span>
                <span>{line.replace(/^@@\s*/, '').replace(/\s*@@$/, '')}</span>
              </div>
            );
          }

          if (line.startsWith('+')) {
            // Linha adicionada
            return (
              <div
                key={idx}
                className="px-3 py-0.5 bg-emerald-950/35 text-emerald-300 border-l-2 border-emerald-500/80 flex items-start gap-2 hover:bg-emerald-950/50 transition-colors"
              >
                <span className="text-emerald-500 font-bold select-none shrink-0 w-3">+</span>
                <span className="whitespace-pre-wrap break-all">{line.slice(1)}</span>
              </div>
            );
          }

          if (line.startsWith('-')) {
            // Linha removida
            return (
              <div
                key={idx}
                className="px-3 py-0.5 bg-rose-950/35 text-rose-300 border-l-2 border-rose-500/80 flex items-start gap-2 hover:bg-rose-950/50 transition-colors"
              >
                <span className="text-rose-500 font-bold select-none shrink-0 w-3">-</span>
                <span className="whitespace-pre-wrap break-all">{line.slice(1)}</span>
              </div>
            );
          }

          // Linhas de contexto ou metadados
          return (
            <div
              key={idx}
              className="px-3 py-0.5 text-slate-400 border-l-2 border-transparent flex items-start gap-2 hover:bg-slate-900/40 transition-colors"
            >
              <span className="text-slate-600 select-none shrink-0 w-3"> </span>
              <span className="whitespace-pre-wrap break-all">{line.startsWith(' ') ? line.slice(1) : line}</span>
            </div>
          );
        })}
      </div>

      {isTruncated && (
        <div className="px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Exibindo primeiras {maxLines} de {allLines.length} linhas</span>
          <span className="text-cyan-400">Expanda para visualização completa</span>
        </div>
      )}
    </div>
  );
};
