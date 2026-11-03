// packages/web/src/components/chat/SlashCommandPopover.tsx

import React, { useEffect, useRef } from 'react';
import { Terminal, CornerDownLeft, Sparkles } from 'lucide-react';
import type { SlashCommandOption, CanonicalNoteArchetype } from '../../types/api';

interface SlashCommandPopoverProps {
  options: SlashCommandOption[];
  selectedIndex: number;
  onSelectOption: (archetype: CanonicalNoteArchetype) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
}

export const SlashCommandPopover: React.FC<SlashCommandPopoverProps> = ({
  options,
  selectedIndex,
  onSelectOption,
  onHoverIndex,
  onClose
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const activeItem = listRef.current.querySelector(`[data-slash-index="${selectedIndex}"]`) as HTMLElement | null;
    if (activeItem && typeof activeItem.scrollIntoView === 'function') {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (options.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2.5 jarvis-panel rounded-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.18)] overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Cabeçalho do Popover */}
      <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>Criação Determinística Single-Roundtrip (/create)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/70 text-[10px] font-mono text-cyan-300">
            {options.length} {options.length === 1 ? 'arquétipo' : 'arquétipos'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span>↑↓ navegar</span>
          <span className="flex items-center gap-1 text-cyan-300">
            <CornerDownLeft className="h-2.5 w-2.5" />
            Enter/Tab inserir
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-slate-200 transition-colors"
          >
            Esc fechar
          </button>
        </div>
      </div>

      {/* Lista dos 12 Tipos Canônicos */}
      <div ref={listRef} className="max-h-64 overflow-y-auto p-1.5 space-y-1 bg-slate-950/75">
        {options.map((opt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={opt.id}
              type="button"
              data-slash-index={idx}
              onMouseEnter={() => onHoverIndex(idx)}
              onClick={() => onSelectOption(opt.archetype)}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer border ${
                isSelected
                  ? 'bg-slate-800/95 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                  : 'border-transparent hover:bg-slate-900/70'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${opt.badgeColor}`}>
                    {opt.prefix}
                  </span>
                  <span className="text-xs font-semibold text-slate-100">
                    {opt.labelPt}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ({opt.archetype})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {opt.shortDescription}
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0 text-right">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                  {opt.modalityLabel}
                </span>
                <span className="text-[9px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                  {opt.templateFile}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
