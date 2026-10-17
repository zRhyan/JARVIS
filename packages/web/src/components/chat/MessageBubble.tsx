// packages/web/src/components/chat/MessageBubble.tsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  Terminal
} from 'lucide-react';
import type { Message } from '../../types/api';
import { WikilinkText } from './WikilinkText';
import type { ActiveToolInfo } from '../../hooks/useChat';
import { ToolCallBadge } from './ToolCallBadge';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  activeTools?: ActiveToolInfo[];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  activeTools = []
}) => {
  const isUser = message.role === 'user';

  // Componente para blocos de código com botão de cópia
  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const hasMultipleLines = codeString.includes('\n');

    // Se o código for inline, ou não tiver linguagem definida e tiver apenas uma linha simples, renderiza como code inline sutil
    if (inline || (!match && !hasMultipleLines)) {
      // Se for uma referência a nota .md solta dentro de crases, estiliza com o visual Obsidian
      if (typeof children === 'string' && children.trim().endsWith('.md')) {
        return <WikilinkText content={children.trim()} />;
      }
      return (
        <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px]" {...props}>
          {children}
        </code>
      );
    }

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="my-2 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[10px]">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-cyan-400" />
            {match ? match[1] : 'snippet'}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-200">
          <code>{children}</code>
        </pre>
      </div>
    );
  };

  // Processa texto recursivamente para aplicar WikilinkText em strings filhas
  const renderWithWikilinks = (node: any): any => {
    if (typeof node === 'string') {
      return <WikilinkText content={node} />;
    }
    if (Array.isArray(node)) {
      return node.map((child, idx) => (
        <React.Fragment key={idx}>{renderWithWikilinks(child)}</React.Fragment>
      ));
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      if (element.props && element.props.children) {
        return React.cloneElement(element, {
          children: renderWithWikilinks(element.props.children)
        });
      }
    }
    return node;
  };

  const ParagraphRenderer = ({ children }: any) => {
    return <p className="mb-2 leading-relaxed">{renderWithWikilinks(children)}</p>;
  };

  const ListItemRenderer = ({ children }: any) => {
    return <li className="my-1 leading-relaxed text-slate-300">{renderWithWikilinks(children)}</li>;
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3 px-4">
        <div className="flex items-start gap-3 max-w-[85%] md:max-w-2xl flex-row-reverse">
          <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 shadow-sm">
            <User className="h-4 w-4" />
          </div>
          <div className="rounded-2xl px-4 py-3 bg-slate-800/80 border border-slate-700/60 text-slate-100 text-xs md:text-sm shadow-md whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistente JARVIS
  return (
    <div className="flex justify-start my-3 px-4">
      <div className="flex items-start gap-3 max-w-[95%] md:max-w-3xl">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-cyan-950/40">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Badges de ferramentas executadas */}
          {activeTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeTools.map((t) => (
                <ToolCallBadge key={t.id} toolInfo={t} />
              ))}
            </div>
          )}

          {/* Conteúdo da resposta */}
          <div className="rounded-2xl px-4 py-3 jarvis-glass-card border border-slate-800/80 text-slate-200 text-xs md:text-sm shadow-md">
            {message.content ? (
              <div className="prose prose-invert prose-xs max-w-none prose-headings:text-slate-100 prose-headings:font-semibold prose-a:text-cyan-400 prose-strong:text-slate-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock,
                    p: ParagraphRenderer,
                    li: ListItemRenderer
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono py-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Processando conhecimento do cofre...</span>
              </div>
            ) : null}

            {/* Cursor piscante durante streaming contínuo */}
            {isStreaming && message.content && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse-cyan align-middle rounded-sm"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
