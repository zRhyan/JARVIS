// packages/web/src/components/layout/MainLayout.tsx

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthTokenModal } from '../modals/AuthTokenModal';
import { ProfileModal } from '../modals/ProfileModal';
import type { Profile, Session, VaultStats } from '../../types/api';
import { hasAuthToken } from '../../services/auth-storage';

import type { ReasoningEffort } from '../../types/api';

interface MainLayoutProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  onActivateProfile: (id: string) => Promise<void>;
  onCreateProfile: (data: { name: string; vaultPath: string; model: string; apiKey?: string }) => Promise<any>;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  selectedReasoningEffort: ReasoningEffort;
  onSelectReasoningEffort: (effort: ReasoningEffort) => void;
  onSetDefaultModel: (profileId: string, modelId: string) => Promise<void>;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => Promise<void>;
  isDaemonOnline: boolean;
  daemonUptime: number;
  vaultStats?: VaultStats | null;
  onTokenUpdated: () => void;
  onReplayIntro?: () => void;
  isStreaming?: boolean;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  profiles,
  activeProfile,
  onActivateProfile,
  onCreateProfile,
  selectedModel,
  onSelectModel,
  selectedReasoningEffort,
  onSelectReasoningEffort,
  onSetDefaultModel,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isDaemonOnline,
  daemonUptime,
  vaultStats,
  onTokenUpdated,
  onReplayIntro,
  isStreaming = false,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authTokenModalOpen, setAuthTokenModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [hasTokenState, setHasTokenState] = useState(() => hasAuthToken());

  const handleTokenSaved = () => {
    setHasTokenState(hasAuthToken());
    onTokenUpdated();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Sidebar Lateral */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onNewSession={onNewSession}
        onDeleteSession={onDeleteSession}
        isDaemonOnline={isDaemonOnline}
        daemonUptime={daemonUptime}
        vaultStats={vaultStats}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#090d16]">
        <Header
          profiles={profiles}
          activeProfile={activeProfile}
          onActivateProfile={onActivateProfile}
          onOpenNewProfileModal={() => setProfileModalOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          selectedReasoningEffort={selectedReasoningEffort}
          onSelectReasoningEffort={onSelectReasoningEffort}
          onSetDefaultModel={onSetDefaultModel}
          onOpenAuthTokenModal={() => setAuthTokenModalOpen(true)}
          hasToken={hasTokenState}
          onReplayIntro={onReplayIntro}
          isStreaming={isStreaming}
        />

        <main className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
          {children}
        </main>
      </div>

      {/* Modais Globais */}
      <AuthTokenModal
        isOpen={authTokenModalOpen}
        onClose={() => setAuthTokenModalOpen(false)}
        onSaved={handleTokenSaved}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={onCreateProfile}
      />
    </div>
  );
};
