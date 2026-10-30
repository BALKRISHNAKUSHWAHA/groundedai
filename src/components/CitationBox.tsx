import React, { useState } from 'react';
import { Copy, Check, Quote, BookMarked } from 'lucide-react';
import { formatCitation, SourceCitationMeta } from '../utils/citation';

interface CitationBoxProps {
  source: SourceCitationMeta;
}

export const CitationBox: React.FC<CitationBoxProps> = ({ source }) => {
  const [style, setStyle] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);

  const formatted = formatCitation(source, style);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
          <BookMarked className="w-3.5 h-3.5" />
          <span>Citation Generator</span>
        </div>

        {/* Style selector */}
        <div className="flex space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
          {(['apa', 'mla', 'chicago', 'bibtex'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-2 py-1 rounded font-mono uppercase font-semibold transition ${
                style === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group bg-slate-900/90 border border-slate-800/80 rounded-lg p-3 font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
        {formatted}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center space-x-1 text-[10px]"
          title="Copy to clipboard"
          aria-label="Copy citation"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
