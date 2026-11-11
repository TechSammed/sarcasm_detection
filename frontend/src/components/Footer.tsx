import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#24332B] bg-[#0B0F0D] py-4 transition-colors mt-auto font-mono text-xs">
      <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-3 text-[#87948C]">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF88]">&gt;</span>
          <span>
            sarcasm_detector <span className="text-[#526057]">v1.0.0</span> &mdash; policy-guided linguistic engine
          </span>
        </div>

        <div className="flex items-center gap-5 text-[11px]">
          <span className="text-[#526057]">ENGINE: GROQ_API</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#87948C] hover:text-[#39FF88] transition-colors"
            aria-label="GitHub Repository"
          >
            [ REPO ]
          </a>
        </div>
      </div>
    </footer>
  );
};

