import React, { useEffect } from 'react';
import type { HistoryEntry } from '../api/types';
import { VerdictBadge } from './VerdictBadge';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  entries,
  onSelect,
  onClear,
}) => {
  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-[#0B0F0D] border-l border-[#24332B] h-full flex flex-col shadow-2xl z-10 animate-slide-in font-mono">
        {/* Header */}
        <div className="p-4 border-b border-[#24332B] flex items-center justify-between bg-[#111714]">
          <div className="flex items-center gap-2">
            <span className="text-[#39FF88] font-bold">&gt;</span>
            <h2 id="history-drawer-title" className="text-xs font-bold tracking-wider text-[#E6F0EA] uppercase">
              SESSION_HISTORY ({entries.length}/10)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-[#E05252] hover:text-[#ff7b7b] font-mono px-2 py-0.5 rounded border border-[#E05252]/30 hover:bg-[#E05252]/10 transition-colors cursor-pointer"
                aria-label="Clear all analysis history"
              >
                [ CLEAR ]
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#87948C] hover:text-[#E6F0EA] hover:bg-[#151C18] transition-colors cursor-pointer text-xs"
              aria-label="Close history drawer"
            >
              [✕]
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {entries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#526057]">
              <div className="text-2xl mb-2">&gt;_</div>
              <p className="text-xs font-bold text-[#87948C]">NO_SAVED_SESSIONS</p>
              <p className="text-[11px] text-[#526057] mt-1">
                Recent analyses will be logged here automatically.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onSelect(entry);
                  onClose();
                }}
                className="p-3.5 rounded border border-[#24332B] bg-[#111714] hover:border-[#39FF88] cursor-pointer transition-colors group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(entry);
                    onClose();
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <VerdictBadge
                    isSarcastic={entry.result.is_sarcastic}
                    label={entry.result.label}
                    size="sm"
                  />
                  <span className="text-[10px] text-[#526057]">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#E6F0EA] font-sans font-medium line-clamp-2 group-hover:text-[#39FF88] transition-colors">
                  &ldquo;{entry.text}&rdquo;
                </p>
                {entry.context && (
                  <p className="text-[11px] text-[#87948C] font-sans line-clamp-1 mt-1 italic">
                    ctx: {entry.context}
                  </p>
                )}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#87948C] pt-2 border-t border-[#24332B]">
                  <span>CONFIDENCE: {Math.round(entry.result.confidence > 1 ? entry.result.confidence : entry.result.confidence * 100)}%</span>
                  <span className="text-[#39FF88] font-bold group-hover:translate-x-0.5 transition-transform">
                    LOAD &gt;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

