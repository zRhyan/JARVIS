// packages/web/src/App.tsx

import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ChatContainer } from './components/chat/ChatContainer';
import { useDaemonHealth } from './hooks/useDaemonHealth';
import { useProfiles } from './hooks/useProfiles';
import { useSessions } from './hooks/useSessions';
import { useChat } from './hooks/useChat';
import { CURATED_MODELS, type ReasoningEffort, getModelReasoningConfig } from './types/api';
import { hasAuthToken } from './services/auth-storage';
import { ProposalCard } from './components/proposal/ProposalCard';
import { JarvisIntroScreen } from './components/hud/JarvisIntroScreen';
import { shouldShowIntro, markIntroShownToday } from './services/intro-config';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const { isOnline, uptimeSeconds, vaultStats, checkHealth } = useDaemonHealth();
  const { 
    profiles, 
    activeProfile, 
    activateProfile, 
    createProfile, 
    setDefaultModel, 
    refreshProfiles 
  } = useProfiles();
  
  const {
    sessions,
    activeSessionId,
    selectSession,
    deleteSession,
    refreshSessions
  } = useSessions(activeProfile?.id);

  const [hasTokenState, setHasTokenState] = useState(() => hasAuthToken());
  const [introActive, setIntroActive] = useState(() => shouldShowIntro());

  // Modelo selecionado na interface (padrão é o do perfil ativo ou o primeiro curado)
  const [selectedModel, setSelectedModel] = useState<string>(
    () => activeProfile?.model || CURATED_MODELS[0].id
  );

  // Intensidade de raciocínio / pensamento
  const [selectedReasoningEffort, setSelectedReasoningEffort] = useState<ReasoningEffort>(() => {
    const cfg = getModelReasoningConfig(activeProfile?.model || CURATED_MODELS[0].id);
    return cfg ? cfg.defaultEffort : 'medium';
  });

  const handleCompleteIntro = () => {
    markIntroShownToday();
    setIntroActive(false);
  };

  // Hook do Chat
  const chat = useChat({
    sessionId: activeSessionId,
    onSessionCreated: (newSessionId) => {
      selectSession(newSessionId);
      refreshSessions();
    },
    onSessionUpdated: () => {
      refreshSessions();
    }
  });

  // Atualiza o modelo selecionado quando o perfil ativo mudar
  useEffect(() => {
    if (activeProfile?.model) {
      setSelectedModel(activeProfile.model);
    }
  }, [activeProfile?.id, activeProfile?.model]);

  // Se o modelo mudar, sincroniza o reasoningEffort para um esforço suportado
  useEffect(() => {
    const cfg = getModelReasoningConfig(selectedModel);
    if (cfg && !cfg.supportedEfforts.includes(selectedReasoningEffort)) {
      setSelectedReasoningEffort(cfg.defaultEffort);
    }
  }, [selectedModel]);

  const handleTokenUpdated = () => {
    setHasTokenState(hasAuthToken());
    checkHealth();
    refreshProfiles();
    refreshSessions();
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    if (activeSessionId === id) {
      chat.reloadSession(id);
    }
  };

  const handleNewSession = () => {
    selectSession(null);
  };

  const handleSendMessage = (messageText: string) => {
    const cfg = getModelReasoningConfig(selectedModel);
    const effort = cfg ? selectedReasoningEffort : undefined;
    chat.sendMessage(messageText, selectedModel, effort);
  };

  return (
    <>
      {introActive && (
        <JarvisIntroScreen
          activeProfile={activeProfile}
          vaultStats={vaultStats}
          selectedModel={selectedModel}
          onComplete={handleCompleteIntro}
        />
      )}

      <MainLayout
        profiles={profiles}
        activeProfile={activeProfile}
        onActivateProfile={activateProfile}
        onCreateProfile={createProfile}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedReasoningEffort={selectedReasoningEffort}
        onSelectReasoningEffort={setSelectedReasoningEffort}
        onSetDefaultModel={setDefaultModel}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={deleteSession}
        isDaemonOnline={isOnline}
        daemonUptime={uptimeSeconds}
        vaultStats={vaultStats}
        onTokenUpdated={handleTokenUpdated}
        onReplayIntro={() => setIntroActive(true)}
        isStreaming={chat.isStreaming}
      >
        {!isOnline ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md jarvis-glass-card p-8 rounded-2xl border border-rose-900/40 text-center space-y-3 shadow-2xl">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Daemon Desconectado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O daemon Fastify não está respondendo em <code className="text-cyan-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">http://127.0.0.1:4173</code>.
                Execute <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">npm run dev:daemon</code> no terminal para iniciar o serviço.
              </p>
            </div>
          </div>
        ) : (
          <ChatContainer
            messages={chat.messages}
            proposals={chat.proposals}
            activeTools={chat.activeTools}
            isStreaming={chat.isStreaming}
            isLoadingSession={chat.isLoadingSession}
            onSendMessage={handleSendMessage}
            onAbortStream={chat.abortStream}
            activeProfile={activeProfile}
            hasToken={hasTokenState}
            onOpenAuthTokenModal={() => {
              const btn = document.querySelector('button[title*="Token"]') as HTMLButtonElement | null;
              btn?.click();
            }}
            renderProposalCard={(p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onApprove={chat.approveProposal}
                onReject={chat.rejectProposal}
              />
            )}
          />
        )}
      </MainLayout>
    </>
  );
}
