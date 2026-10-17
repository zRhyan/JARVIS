// packages/web/src/components/hud/JarvisIntroScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import { JarvisArcOrb } from './JarvisArcOrb';
import { soundFX } from '../../services/sound-effects';
import { Volume2, VolumeX, CornerDownLeft, Sparkles, Database, ShieldCheck } from 'lucide-react';
import type { Profile, VaultStats } from '../../types/api';

interface JarvisIntroScreenProps {
  activeProfile: Profile | null;
  vaultStats: VaultStats | null;
  selectedModel: string;
  onComplete: () => void;
}

export const JarvisIntroScreen: React.FC<JarvisIntroScreenProps> = ({
  activeProfile,
  vaultStats,
  selectedModel,
  onComplete
}) => {
  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [isMuted, setIsMuted] = useState(() => !soundFX.isSoundEnabled());
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calcula o turno do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const noteCount = vaultStats?.indexedNotes ?? 0;
  const vaultName = activeProfile?.name || 'Cofre Obsidian';

  // Monta a locução textual estilo JARVIS
  const fullMessage = `${getGreeting()}. Todos os sistemas online. O cofre "${vaultName}" está sincronizado com ${noteCount} ${
    noteCount === 1 ? 'nota pronta' : 'notas prontas'
  } para consulta. O que deseja explorar agora?`;

  const handleFinish = () => {
    if (isExiting) return;
    setIsExiting(true);
    soundFX.playTransitionWhoosh();
    setTimeout(() => {
      onComplete();
    }, 450); // Duração da transição fade-out
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSoundState = isMuted;
    setIsMuted(!newSoundState);
    soundFX.setSoundEnabled(newSoundState);
  };

  // Efeito de teletipo e sons
  useEffect(() => {
    // Som inicial de ativação do reator
    soundFX.playReactorHum();

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullMessage.length) {
        setTypedText(fullMessage.slice(0, currentIndex + 1));
        if (currentIndex % 3 === 0) {
          soundFX.playTeletypeClick();
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTypingDone(true);
        soundFX.playDiagnosticChirp();

        // Encerramento automático 2.5s após terminar de digitar
        timerRef.current = setTimeout(() => {
          handleFinish();
        }, 2500);
      }
    }, 28); // Velocidade agradável e rápida do teletipo

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fullMessage]);

  // Listener da tecla Enter ou Espaço para pular imediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-[#060911]/95 backdrop-blur-2xl cursor-pointer transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, rgba(9, 13, 22, 0.95) 75%),
          linear-gradient(to right, rgba(14, 116, 144, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(14, 116, 144, 0.04) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }}
    >
      {/* Topo do HUD: Identificação e Mute */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs tracking-widest text-cyan-500/70 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-cyan-300">JARVIS PROTOCOL // V2.0</span>
        </div>

        <button
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/40 text-cyan-300 transition-colors"
          title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5 text-slate-500" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
          <span className="text-[10px] hidden sm:inline">{isMuted ? 'MUDO' : 'ÁUDIO HUD'}</span>
        </button>
      </div>

      {/* Centro: Arc Reactor Orb e Telemetria Holográfica */}
      <div className="flex flex-col items-center justify-center max-w-2xl text-center space-y-8 my-auto">
        <JarvisArcOrb state="speaking" size={260} />

        <div className="space-y-4">
          <div className="min-h-[72px] sm:min-h-[64px] flex items-center justify-center">
            <p className="text-base sm:text-lg font-light text-slate-100 font-sans tracking-wide leading-relaxed">
              {typedText}
              {!isTypingDone && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 align-middle animate-pulse" />
              )}
            </p>
          </div>

          {/* Badges de Telemetria Sci-Fi */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 font-mono">
              <Database className="h-3 w-3 text-cyan-400" />
              <span>{noteCount} Notas Indexadas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Daemon Loopback</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="truncate max-w-[140px]">{selectedModel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé: Dica de Navegação / Skip */}
      <div className="w-full max-w-4xl flex items-center justify-center pb-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors">
          <span>Pressione</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-cyan-300 font-mono flex items-center gap-1">
            <span>Enter</span>
            <CornerDownLeft className="h-2.5 w-2.5" />
          </kbd>
          <span>ou clique para entrar no workspace</span>
        </div>
      </div>
    </div>
  );
};
