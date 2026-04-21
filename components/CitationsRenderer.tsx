import React from 'react';
import { ExternalLink } from 'lucide-react';

interface CitationsRendererProps {
  content: string;
  onCitationClick: (target: { type: string, value: string | number }) => void;
}

export const CitationsRenderer: React.FC<CitationsRendererProps> = ({ content, onCitationClick }) => {
  // Broad regex to find (Type Value)
  // Types: Page, Slide, Sheet, Section
  const citationRegex = /\((Page|Slide|Sheet|Section)\s+["']?([^"']+)["']?\)/gi;

  const parts = content.split(citationRegex);
  
  if (parts.length === 1) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Reconstruction logic
  const renderedContent: React.ReactNode[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    // Every 3 parts form a match: [text, type, value]
    if (i % 3 === 1) {
      const type = parts[i];
      const rawValue = parts[i + 1];
      const value = isNaN(Number(rawValue)) ? rawValue : Number(rawValue);
      
      renderedContent.push(
        <button
          key={`cite-${i}`}
          onClick={() => onCitationClick({ type: type.toLowerCase(), value })}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-black rounded-md transition-all border border-primary/20 hover:scale-105 active:scale-95"
        >
          <ExternalLink size={10} />
          {type.toUpperCase()} {value}
        </button>
      );
      i++; // Skip the value part as we've processed it
    } else {
      renderedContent.push(<span key={`text-${i}`}>{parts[i]}</span>);
    }
  }

  return <div className="whitespace-pre-wrap">{renderedContent}</div>;
};
