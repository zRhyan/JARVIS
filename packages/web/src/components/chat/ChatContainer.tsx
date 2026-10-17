// packages/web/src/components/chat/ChatContainer.tsx

import React, { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { 
  Sparkles, 
  ArrowDown, 
  Search, 
  Network, 
  FileEdit,
  FolderGit2
} from 'lucide-react';
import type { Message, Proposal, Profile } from '../../types/api';
import type { ActiveToolInfo } from '../../hooks/useChat';

interface ChatContainerProps {
  messages: Message[];
  proposals: Proposal[];
  activeTools: ActiveToolInfo[];
  isStreaming: boolean;
  isLoadingSession?: boolean;
  onSendMessage: (message: string) => void;
  onAbortStream: () => void;
  activeProfile: Profile | null;
  hasToken: boolean;
  onOpenAuthTokenModal: () => void;
  // Slots para a Fase 4.5
  renderProposalCard?: (proposal: Proposal) => React.ReactNode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  proposals,
  activeTools,
  isStreaming,
  isLoadingSession = false,
  onSendMessage,
  onAbortStream,
  activeProfile,
  hasToken,
  onOpenAuthTokenModal,
  renderProposalCard
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollActive = useRef(true);

  // Auto-scroll durante o streaming
  useEffect(() => {
    if (isAutoScrollActive.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, activeTools, proposals]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollActive.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      isAutoScrollActive.current = true;
      setShowScrollBottom(false);
    }
  };

  const starterPrompts = [
    {
      title: 'Explorar topologia do cofre',
      desc: 'Quais notas e áreas principais temos indexadas?',
      icon: Search
    },
    {
      title: 'Mapear conexões e backlinks',
      desc: 'Mapeie o grafo de relacionamentos dos conceitos centrais.',
      icon: Network
    },
    {
      title: 'Revisar convenções de VAULT.md',
      desc: 'Quais regras taxonômicas e tags estão ativas no cofre?',
      icon: FolderGit2
    },
    {
      title: 'Propor síntese incremental',
      desc: 'Proponha uma atualização estruturada para uma nota existente.',
      icon: FileEdit
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 relative">
      {/* Feed com Rolagem */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 md:px-6 py-4 space-y-4"
      >
        {isLoadingSession && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-3"></div>
            <p className="text-xs text-slate-400 font-medium">Carregando conversa...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-xl shadow-cyan-950/50 mb-4">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-cyan-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-200 via-slate-100 to-emerald-200 bg-clip-text text-transparent">
              JARVIS Obsidian AI
            </h2>

            {activeProfile && (
              <div className="mt-1 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>Cofre: {activeProfile.name}</span>
                <span className="text-slate-600">({activeProfile.vaultPath})</span>
              </div>
            )}

            <p className="text-xs text-slate-400 max-w-md mt-2 mb-8 leading-relaxed">
              Agente local autônomo conectado à sua base de conhecimento. Faça perguntas, explore wikilinks e aprove edições atômicas no disco.
            </p>

            {/* Prompt Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
              {starterPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(p.desc)}
                    disabled={!hasToken}
                    className="p-3 rounded-2xl jarvis-glass-card hover:border-cyan-500/50 text-left transition-all hover:scale-[1.01] group border border-slate-800 disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-200 transition-colors">
                        {p.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {!hasToken && (
              <div className="mt-6 p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                <span>Insira o token de autorização do daemon para começar:</span>
                <button
                  onClick={onOpenAuthTokenModal}
                  className="font-semibold underline hover:text-rose-200 ml-1"
                >
                  Configurar Token
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {(() => {
              const filteredArr = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .filter(
                  (m, _, arr) =>
                    m.role === 'user' ||
                    (m.content && m.content.trim().length > 0) ||
                    (m === arr[arr.length - 1] && (isStreaming || activeTools.length > 0))
                );

              const visibleMessageIds = new Set(filteredArr.map((m) => m.id));
              const lastVisibleAssistant = [...filteredArr].reverse().find((m) => m.role === 'assistant');

              // Mapeia propostas para a mensagem visível correta
              const proposalTargetMap = new Map<string, Proposal[]>();
              const renderedProposalIds = new Set<string>();

              proposals.forEach((p) => {
                let targetId: string | undefined;

                // 1. Caso direto: messageId corresponde a uma mensagem visível
                if (p.messageId && visibleMessageIds.has(p.messageId)) {
                  targetId = p.messageId;
                } 
                // 2. Caso legado ou intermediário: messageId aponta para tool call ou mensagem sem texto
                else if (p.messageId) {
                  const rawIndex = messages.findIndex((m) => m.id === p.messageId);
                  if (rawIndex !== -1) {
                    // Busca a mensagem de assistente visível seguinte na mesma rodada
                    const nextVisible = messages
                      .slice(rawIndex + 1)
                      .find((m) => m.role === 'assistant' && visibleMessageIds.has(m.id));
                    if (nextVisible) {
                      targetId = nextVisible.id;
                    }
                  }
                }

                // 3. Fallback: vincula à última mensagem visível do assistente
                if (!targetId && lastVisibleAssistant) {
                  targetId = lastVisibleAssistant.id;
                }

                if (targetId) {
                  const currentList = proposalTargetMap.get(targetId) || [];
                  currentList.push(p);
                  proposalTargetMap.set(targetId, currentList);
                  renderedProposalIds.add(p.id);
                }
              });

              // Propostas que não puderam ser vinculadas a nenhuma mensagem específica
              const unrenderedProposals = proposals.filter((p) => !renderedProposalIds.has(p.id));

              return (
                <>
                  {filteredArr.map((msg, index) => {
                    const isLast = index === filteredArr.length - 1;
                    const matchingProposals = proposalTargetMap.get(msg.id) || [];

                    return (
                      <div key={msg.id || index}>
                        <MessageBubble
                          message={msg}
                          isStreaming={isStreaming && isLast && msg.role === 'assistant'}
                          activeTools={isLast && msg.role === 'assistant' ? activeTools : []}
                        />

                        {/* Renderização de propostas associadas à mensagem */}
                        {renderProposalCard && msg.role === 'assistant' && matchingProposals.length > 0 && (
                          <div className="ml-12 md:ml-14 my-2 space-y-3">
                            {matchingProposals.map((proposal) => renderProposalCard(proposal))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Fallback de Segurança: Garante que NENHUMA proposta da sessão fique invisível */}
                  {renderProposalCard && unrenderedProposals.length > 0 && (
                    <div className="ml-12 md:ml-14 my-4 p-3 rounded-2xl jarvis-panel border border-cyan-800/60 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                        <FileEdit className="h-4 w-4" />
                        <span>Propostas Pendentes de Revisão:</span>
                      </div>
                      {unrenderedProposals.map((proposal) => renderProposalCard(proposal))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Botão Flutuante de Rolar para o Fim */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 rounded-full jarvis-panel border border-slate-700 text-cyan-400 hover:text-cyan-300 shadow-xl transition-all animate-bounce"
          title="Rolar até o final"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Barra de Entrada de Mensagem */}
      <MessageInput
        onSendMessage={onSendMessage}
        isStreaming={isStreaming}
        onAbortStream={onAbortStream}
        disabled={!hasToken}
      />
    </div>
  );
};
