import React from 'react';

export const ResultSkeleton: React.FC = () => {
  return (
    <div
      className="bg-[#111714] border border-[#24332B] rounded-md p-6 space-y-5 animate-pulse font-mono"
      data-testid="result-skeleton"
      aria-busy="true"
      aria-label="Analyzing text for sarcasm..."
    >
      {/* Terminal progress header */}
      <div className="flex items-center justify-between border-b border-[#24332B] pb-3 text-xs">
        <div className="flex items-center gap-2 text-[#39FF88]">
          <span className="w-2 h-2 rounded-full bg-[#39FF88] animate-ping" />
          <span className="font-bold">&gt; analyzing_statement...</span>
        </div>
        <span className="text-[#526057]">IN_PROGRESS</span>
      </div>

      {/* Terminal processing logs */}
      <div className="space-y-1.5 text-xs text-[#87948C] bg-[#0B0F0D] p-3 rounded border border-[#24332B]">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF88]">[1/2]</span>
          <span>tokenizing linguistic markers &amp; semantic payload...</span>
        </div>
        <div className="flex items-center gap-2 text-[#526057]">
          <span className="text-[#39FF88]">[2/2]</span>
          <span>evaluating pragmatic incongruity via policy engine...</span>
        </div>
      </div>

      {/* Confidence skeleton bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#526057]">
          <div className="h-3.5 w-24 bg-[#151C18] rounded-xs" />
          <div className="h-3.5 w-8 bg-[#151C18] rounded-xs" />
        </div>
        <div className="h-2 w-full bg-[#151C18] rounded-xs overflow-hidden border border-[#24332B]" />
      </div>

      {/* Report body skeleton */}
      <div className="p-4 rounded border border-[#24332B] bg-[#151C18] space-y-2">
        <div className="h-3.5 w-28 bg-[#24332B] rounded-xs" />
        <div className="h-4 w-5/6 bg-[#24332B]/60 rounded-xs" />
        <div className="h-4 w-2/3 bg-[#24332B]/40 rounded-xs" />
      </div>

      {/* Bottom metadata skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-[#24332B]">
        <div className="h-3 w-40 bg-[#151C18] rounded-xs" />
        <div className="h-7 w-24 bg-[#151C18] rounded-xs border border-[#24332B]" />
      </div>
    </div>
  );
};

