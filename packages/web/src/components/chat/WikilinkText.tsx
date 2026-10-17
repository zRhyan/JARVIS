import React from 'react';
import { FileText, Link2 } from 'lucide-react';

interface WikilinkTextProps {
  content: string;
}

export const WikilinkText: React.FC<WikilinkTextProps> = ({ content }) => {
  // Regex unificada para capturar [[NomeDaNota]]/[[Nome|Alias]] OU caminhos que terminam com .md (ex: 1 - Fields/Nota.md)
  const combinedRegex = /(\[\[([^\]|]+)(?:\|([^\]]+))?\]\])|((?:[A-Za-z0-9_ -]+\/)*[A-Za-z0-9_ -]+\.md)/g;

  if (!combinedRegex.test(content)) {
    return <>{content}</>;
  }

  combinedRegex.lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(content)) !== null) {
    const startIndex = match.index;
    const fullMatch = match[0];

    // Adiciona o texto antes do link
    if (startIndex > lastIndex) {
      elements.push(content.substring(lastIndex, startIndex));
    }

    if (match[1]) {
      // É um [[wikilink]]
      const noteName = match[2];
      const alias = match[3];
      const displayText = alias ? alias.trim() : noteName.trim();
      const targetNote = noteName.trim();

      elements.push(
        <span
          key={`wiki-${startIndex}`}
          title={`Nota Obsidian: ${targetNote}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-[#7c3aed]/15 border border-[#8b5cf6]/40 text-[#c4b5fd] font-mono text-[11px] hover:bg-[#7c3aed]/25 hover:border-[#a78bfa] hover:text-[#ede9fe] transition-all select-all cursor-pointer font-medium shadow-sm"
        >
          <Link2 className="h-2.5 w-2.5 text-[#a78bfa] shrink-0" />
          <span>{displayText}</span>
        </span>
      );
    } else if (match[4]) {
      // É um caminho explícito de arquivo .md (ex: "1 - Fields/Nota.md")
      const filePath = match[4].trim();
      const fileName = filePath.split('/').pop() || filePath;

      elements.push(
        <span
          key={`filepath-${startIndex}`}
          title={`Caminho no cofre: ${filePath}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-[#7c3aed]/15 border border-[#8b5cf6]/40 text-[#c4b5fd] font-mono text-[11px] hover:bg-[#7c3aed]/25 hover:border-[#a78bfa] hover:text-[#ede9fe] transition-all select-all cursor-pointer font-medium shadow-sm"
        >
          <FileText className="h-2.5 w-2.5 text-[#a78bfa] shrink-0" />
          <span>{fileName}</span>
        </span>
      );
    }

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex));
  }

  return <>{elements}</>;
};
