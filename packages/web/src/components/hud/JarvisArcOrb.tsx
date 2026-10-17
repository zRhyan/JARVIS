// packages/web/src/components/hud/JarvisArcOrb.tsx

import React from 'react';

export type ArcOrbState = 'idle' | 'speaking' | 'thinking' | 'intro';

interface JarvisArcOrbProps {
  state?: ArcOrbState;
  size?: number; // diâmetro em pixels
  className?: string;
}

export const JarvisArcOrb: React.FC<JarvisArcOrbProps> = ({
  state = 'idle',
  size = 280,
  className = ''
}) => {
  const isCompact = size <= 64;
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking' || state === 'intro';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow externo */}
      <div
        className={`absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl transition-all duration-700 pointer-events-none ${
          isSpeaking ? 'scale-125 bg-cyan-400/20' : isThinking ? 'scale-110 bg-amber-400/15' : 'scale-100'
        }`}
      />

      <svg
        viewBox="0 0 500 500"
        className={`w-full h-full transition-transform duration-500 ${
          isSpeaking ? 'animate-hud-glow' : ''
        }`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="arcGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#0891b2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cyanArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="amberArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Fundo do núcleo */}
        <circle cx="250" cy="250" r="220" fill="url(#arcGlow)" />

        {/* 1. Anel Externo mais lento */}
        <g
          className={`origin-center ${
            isThinking ? 'animate-hud-spin-fast' : 'animate-hud-spin'
          }`}
        >
          <circle
            cx="250"
            cy="250"
            r="210"
            fill="none"
            stroke="#0891b2"
            strokeWidth={isCompact ? 3 : 2}
            strokeDasharray="6 14"
            opacity="0.4"
          />
          <circle
            cx="250"
            cy="250"
            r="190"
            fill="none"
            stroke="url(#cyanArc)"
            strokeWidth={isCompact ? 4 : 3}
            strokeDasharray="50 30 90 20"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>

        {/* 2. Anel Intermediário em Contra-Rotação */}
        <g
          className={`origin-center ${
            isThinking ? 'animate-hud-spin-fast' : 'animate-hud-spin-reverse'
          }`}
        >
          <circle
            cx="250"
            cy="250"
            r="155"
            fill="none"
            stroke="#38bdf8"
            strokeWidth={isCompact ? 4 : 3}
            strokeDasharray="18 18"
            opacity="0.6"
          />
          <circle
            cx="250"
            cy="250"
            r="135"
            fill="none"
            stroke="#06b6d4"
            strokeWidth={isCompact ? 5 : 4}
            strokeDasharray="80 40 40 40"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        {/* 3. Anel Interno de Ticks Angulares */}
        {!isCompact && (
          <g className="origin-center animate-hud-spin">
            <circle
              cx="250"
              cy="250"
              r="105"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="2"
              strokeDasharray="4 8"
              opacity="0.5"
            />
          </g>
        )}

        {/* 4. Triângulo Invertido Central (Arc Core) */}
        <polygon
          points="250,165 325,295 175,295"
          fill="none"
          stroke={isThinking ? 'url(#amberArc)' : 'url(#cyanArc)'}
          strokeWidth={isCompact ? 8 : 6}
          strokeLinejoin="round"
          opacity="0.9"
          className="transition-colors duration-500"
        />

        {/* 5. Núcleo Sônico Central com Barras Pulsantes (quando falando/introdução) */}
        {isSpeaking && !isCompact ? (
          <g className="origin-center">
            {/* Equalizador de frequências sonoras estilizado no centro */}
            {[-36, -24, -12, 0, 12, 24, 36].map((offset, idx) => {
              const baseHeight = idx === 3 ? 38 : Math.abs(idx - 3) === 1 ? 28 : 16;
              const animDuration = 0.5 + (idx % 3) * 0.2;
              return (
                <rect
                  key={offset}
                  x={247 + offset}
                  y={250 - baseHeight / 2}
                  width="4"
                  height={baseHeight}
                  rx="2"
                  fill="#22d3ee"
                  style={{
                    transformOrigin: `${249 + offset}px 250px`,
                    animation: `sound-bar-pulse ${animDuration}s ease-in-out infinite alternate`
                  }}
                />
              );
            })}
          </g>
        ) : (
          /* Ponto luminoso central estático/pulsante */
          <>
            <circle
              cx="250"
              cy="250"
              r={isCompact ? 18 : 22}
              fill={isThinking ? '#f59e0b' : '#06b6d4'}
              className="animate-pulse"
              opacity="0.9"
            />
            <circle cx="250" cy="250" r={isCompact ? 8 : 10} fill="#ffffff" />
          </>
        )}

        {/* Marcadores HUD direcionais */}
        {!isCompact && (
          <>
            <line x1="250" y1="20" x2="250" y2="45" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <line x1="250" y1="455" x2="250" y2="480" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <line x1="20" y1="250" x2="45" y2="250" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <line x1="455" y1="250" x2="480" y2="250" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          </>
        )}
      </svg>
    </div>
  );
};
