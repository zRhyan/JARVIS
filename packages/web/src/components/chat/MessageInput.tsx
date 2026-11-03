// packages/web/src/components/chat/MessageInput.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Square, CornerDownLeft, Terminal } from 'lucide-react';
import {
  filterSlashCommands,
  buildSlashCreateCommandSnippet,
  type CanonicalNoteArchetype,
  type VaultConventionsConfig
} from '../../types/api';
import { SlashCommandPopover } from './SlashCommandPopover';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  onAbortStream: () => void;
  disabled?: boolean;
  placeholder?: string;
  conventions?: VaultConventionsConfig | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onAbortStream,
  disabled = false,
  placeholder = 'Pergunte sobre seu cofre Obsidian, digite / para criar uma nota canônica (/create) ou peça edições...',
  conventions
}) => {
  const [text, setText] = useState('');
  const [slashDismissed, setSlashDismissed] = useState(false);
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Verifica se o texto atual deve abrir o popover de slash commands:
  // Abre quando começa com "/" e ainda não foi preenchido com "note:"
  const shouldShowSlashMenu = useMemo(() => {
    if (disabled || isStreaming || slashDismissed) return false;
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) return false;
    if (/\bnote\s*:/i.test(trimmed)) return false;
    return true;
  }, [text, disabled, isStreaming, slashDismissed]);

  const slashOptions = useMemo(() => {
    if (!shouldShowSlashMenu) return [];
    return filterSlashCommands(text, conventions);
  }, [shouldShowSlashMenu, text, conventions]);

  // Reseta o índice selecionado quando a lista filtrada mudar
  useEffect(() => {
    setSelectedSlashIdx(0);
  }, [slashOptions.length, text]);

  // Auto-resize do textarea conforme digitação
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const handleSelectSlashArchetype = (archetype: CanonicalNoteArchetype) => {
    const { commandText, cursorOffset } = buildSlashCreateCommandSnippet(archetype);
    setText(commandText);
    setSlashDismissed(true);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(cursorOffset, cursorOffset);
      }
    });
  };

  const handleTriggerSlashButton = () => {
    if (disabled || isStreaming) return;
    setSlashDismissed(false);
    if (!text.trim().startsWith('/')) {
      setText('/');
    }
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isStreaming || disabled) return;
    onSendMessage(text.trim());
    setText('');
    setSlashDismissed(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (shouldShowSlashMenu && slashOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIdx((prev) => (prev + 1) % slashOptions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIdx((prev) => (prev - 1 + slashOptions.length) % slashOptions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const chosen = slashOptions[selectedSlashIdx] || slashOptions[0];
        if (chosen) {
          handleSelectSlashArchetype(chosen.archetype);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashDismissed(true);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none">
      <form onSubmit={handleSubmit} className="relative">
        {shouldShowSlashMenu && slashOptions.length > 0 && (
          <SlashCommandPopover
            options={slashOptions}
            selectedIndex={selectedSlashIdx}
            onSelectOption={handleSelectSlashArchetype}
            onHoverIndex={setSelectedSlashIdx}
            onClose={() => setSlashDismissed(true)}
          />
        )}

        <div className="jarvis-panel rounded-2xl border border-slate-700/80 p-2 shadow-2xl focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSlashDismissed(false);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Configure o token de acesso para conversar...' : placeholder}
            className="w-full bg-transparent px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none max-h-44 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-800/60 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerSlashButton}
                disabled={disabled || isStreaming}
                title="Abrir menu de criação determinística (/create) para os 12 tipos canônicos"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-[10px] font-mono text-cyan-300 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Terminal className="h-2.5 w-2.5 text-cyan-400" />
                <span>/create</span>
              </button>

              <span className="hidden sm:flex items-center gap-1 font-mono text-[10px]">
                <CornerDownLeft className="h-3 w-3 text-cyan-400" />
                <span>Enter para enviar • Digite / para templates canônicos</span>
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onAbortStream}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 shadow-md transition-all animate-pulse"
                >
                  <Square className="h-3 w-3 fill-rose-300" />
                  <span>Interromper</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!text.trim() || disabled}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 shadow-md shadow-cyan-950/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <Send className="h-3 w-3" />
                  <span>Enviar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
