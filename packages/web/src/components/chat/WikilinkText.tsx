// packages/web/src/components/chat/WikilinkText.tsx

import React from 'react';
import { Link2 } from 'lucide-react';

interface WikilinkTextProps {
  content: string;
}

export const WikilinkText: React.FC<WikilinkTextProps> = ({ content }) => {
  // Regex para capturar [[NomeDaNota]] ou [[NomeDaNota|Alias]]
  const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  if (!wikilinkRegex.test(content)) {
    return <>{content}</>;
  }

  wikilinkRegex.lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const [fullMatch, noteName, alias] = match;
    const startIndex = match.index;

    // Adiciona o texto antes do link
    if (startIndex > lastIndex) {
      elements.push(content.substring(lastIndex, startIndex));
    }

    const displayText = alias ? alias.trim() : noteName.trim();
    const targetNote = noteName.trim();

    // Renderiza o wikilink estilizado
    elements.push(
      <span
        key={`wiki-${startIndex}`}
        title={`Nota Obsidian: ${targetNote}.md`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-mono text-[11px] hover:bg-cyan-900/60 hover:border-cyan-500 transition-all select-all cursor-pointer"
      >
        <Link2 className="h-2.5 w-2.5 text-cyan-400 shrink-0" />
        <span className="font-semibold">{displayText}</span>
      </span>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex));
  }

  return <>{elements}</>;
};
