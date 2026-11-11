import React, { useState } from 'react';
import type { PredictResponse } from '../api/types';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { HighlightedText } from './HighlightedText';

interface ResultCardProps {
  originalText: string;
  result: PredictResponse;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  originalText,
  result,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Extract verdict and explanation/reason safely
  const isSarcastic = result.is_sarcastic ?? (result.label ? result.label.toLowerCase() === 'sarcastic' : false);
  const explanationText = result.explanation || result.reason || '';
  const isBertFallback = result.provider === 'local/bert_fallback';

  const handleCopy = async () => {
    const textToCopy = `[SARCASM_DETECTOR ANALYSIS REPORT]
VERDICT: ${isSarcastic ? 'SARCASTIC' : 'NOT SARCASTIC'}
CONFIDENCE: ${Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100)}%
STATEMENT: "${originalText}"
EXPLANATION: ${explanationText}
PROVIDER: ${result.provider}
LATENCY: ${result.latency_ms?.toFixed(0) ?? 0}ms
SOURCE: ${result.source}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`bg-[#111714] border border-[#24332B] rounded-md p-5 md:p-7 space-y-6 animate-fade-in ${className}`}
      data-testid="result-card"
      aria-live="polite"
    >
      {/* Top Header: Section Label + Classification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#24332B]">
        <div className="space-y-1">
          <div className="text-[11px] font-mono tracking-widest text-[#87948C] uppercase flex items-center gap-2">
            <span className="text-[#39FF88]">//</span>
            <span>ANALYSIS REPORT</span>
          </div>
          <div className="flex items-center gap-3">
            <VerdictBadge isSarcastic={isSarcastic} label={result.label} size="lg" />
            {result.sarcasm_type && (
              <span
                data-testid="sarcasm-type-chip"
                className="font-mono text-xs px-2.5 py-1 rounded border border-[#24332B] bg-[#151C18] text-[#87948C]"
              >
                TYPE: {result.sarcasm_type}
              </span>
            )}
          </div>
        </div>

        {/* Status indicator on right */}
        <div className="text-right">
          <div className="font-mono text-xs text-[#87948C]">STATUS</div>
          <div className="font-mono text-xs font-bold text-[#39FF88] flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF88]" />
            COMPLETE
          </div>
        </div>
      </div>

      {/* Offline Fallback Warning (BERT) */}
      {isBertFallback && (
        <div
          role="alert"
          className="p-3.5 rounded border border-[#D9A441]/40 bg-[#D9A441]/10 text-[#F3C769] text-xs font-mono flex items-start gap-2.5"
        >
          <span className="text-[#D9A441] font-bold mt-0.5">[!]</span>
          <div className="space-y-0.5">
            <span className="font-bold">Offline Fallback active</span>
            <p className="text-[#D9A441]/90">
              Primary model unavailable. Local BERT sequence classification model deployed.
            </p>
          </div>
        </div>
      )}

      {/* Confidence Bar */}
      <div>
        <ConfidenceBar confidence={result.confidence} />
      </div>

      {/* Statement Preview with Signal Marker Highlighting */}
      <div className="p-4 rounded border border-[#24332B] bg-[#0B0F0D]">
        <div className="text-[11px] font-mono tracking-wider text-[#87948C] uppercase mb-1.5 flex items-center justify-between">
          <span>&gt; EVALUATED STATEMENT</span>
          <span className="text-[10px] text-[#526057]">{originalText.length} chars</span>
        </div>
        <p className="text-sm md:text-base text-[#E6F0EA] font-medium leading-relaxed font-sans">
          {result.markers && result.markers.length > 0 ? (
            <HighlightedText text={originalText} markers={result.markers} />
          ) : (
            `"${originalText}"`
          )}
        </p>
      </div>

      {/* Explanation Report */}
      <div className="p-4 rounded border border-[#24332B] bg-[#151C18] space-y-1.5">
        <div className="text-[11px] font-mono tracking-wider text-[#39FF88] uppercase font-bold flex items-center gap-1.5">
          <span>&gt;</span>
          <span>EXPLANATION</span>
        </div>
        <p
          className="text-sm md:text-base text-[#E6F0EA] leading-relaxed font-sans"
          data-testid="result-reason"
        >
          {explanationText}
        </p>
      </div>

      {/* Side-by-Side: Literal vs Intended (if available) */}
      {(result.literal_meaning || result.intended_meaning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {result.literal_meaning && (
            <div className="p-3.5 rounded border border-[#24332B] bg-[#0B0F0D] space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#87948C]">
                LITERAL MEANING
              </span>
              <p
                data-testid="literal-meaning"
                className="text-xs md:text-sm text-[#E6F0EA] leading-relaxed font-sans"
              >
                {result.literal_meaning}
              </p>
            </div>
          )}
          {result.intended_meaning && (
            <div className="p-3.5 rounded border border-[#39FF88]/30 bg-[#39FF88]/5 space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#39FF88]">
                INTENDED MEANING
              </span>
              <p
                data-testid="intended-meaning"
                className="text-xs md:text-sm text-[#E6F0EA] leading-relaxed font-sans"
              >
                {result.intended_meaning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Technical Metadata & Copy Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#24332B] text-xs font-mono text-[#87948C]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="text-[#526057]">PROVIDER:</span>{' '}
            <span className="text-[#E6F0EA]">{result.provider}</span>
          </div>
          <div>
            <span className="text-[#526057]">SOURCE:</span>{' '}
            <span className="text-[#E6F0EA] uppercase">{result.source}</span>
          </div>
          <div>
            <span className="text-[#526057]">LATENCY:</span>{' '}
            <span className="text-[#39FF88]">{result.latency_ms?.toFixed(0) ?? 0}ms</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-[#24332B] bg-[#151C18] hover:border-[#39FF88] hover:text-[#39FF88] text-[#E6F0EA] transition-colors text-xs font-mono cursor-pointer self-start sm:self-auto"
          aria-label="Copy result to clipboard"
          data-testid="copy-result-btn"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-[#39FF88]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[#39FF88] font-bold">COPIED</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <span>[ COPY REPORT ]</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

