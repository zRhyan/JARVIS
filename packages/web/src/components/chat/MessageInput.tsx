// packages/web/src/components/chat/MessageInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, CornerDownLeft } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  onAbortStream: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onAbortStream,
  disabled = false,
  placeholder = 'Pergunte sobre seu cofre Obsidian ou peça para sintetizar/editar notas...'
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize do textarea conforme digitação
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isStreaming || disabled) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none">
      <form onSubmit={handleSubmit} className="relative">
        <div className="jarvis-panel rounded-2xl border border-slate-700/80 p-2 shadow-2xl focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Configure o token de acesso para conversar...' : placeholder}
            className="w-full bg-transparent px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none max-h-44 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-800/60 text-[11px] text-slate-500">
            <span className="hidden sm:flex items-center gap-1 font-mono text-[10px]">
              <CornerDownLeft className="h-3 w-3 text-cyan-400" />
              <span>Enter para enviar • Shift+Enter para quebra</span>
            </span>

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
