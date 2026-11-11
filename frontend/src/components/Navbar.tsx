import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  historyCount?: number;
  onOpenHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount = 0,
  onOpenHistory,
}) => {
  const location = useLocation();
  const isWorkspace = location.pathname === '/app';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F0D]/95 backdrop-blur-xs border-b border-[#24332B] h-12 flex items-center">
      <div className="container-app w-full flex items-center justify-between">
        {/* Brand with terminal dot */}
        <Link
          to="/"
          className="flex items-center gap-2 group font-mono text-sm tracking-wider text-[#E6F0EA] hover:text-[#39FF88] transition-colors"
          aria-label="Sarcasm Detector Home"
        >
          <span className="w-2 h-2 rounded-full bg-[#39FF88] group-hover:scale-125 transition-transform" aria-hidden="true" />
          <span className="font-bold">SARCASM_DETECTOR</span>
          <span className="hidden sm:inline text-[11px] text-[#526057]">// v1.0</span>
        </Link>

        {/* Status, Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs">
          {/* System Online Status */}
          <div className="flex items-center gap-1.5 text-[#87948C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF88] animate-pulse" aria-hidden="true" />
            <span className="text-[#39FF88] font-bold text-[11px] tracking-wider">ONLINE</span>
          </div>

          <div className="h-3.5 w-px bg-[#24332B] hidden sm:block" />

          {/* Nav links */}
          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            <Link
              to="/app"
              className={`px-2.5 py-1 rounded transition-colors text-xs font-mono ${
                isWorkspace || location.pathname === '/'
                  ? 'text-[#39FF88] bg-[#151C18] border border-[#24332B]'
                  : 'text-[#87948C] hover:text-[#E6F0EA]'
              }`}
            >
              WORKSPACE
            </Link>
          </nav>

          {/* History Button (if provided) */}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-2.5 py-1 rounded border border-[#24332B] bg-[#151C18] hover:border-[#39FF88] hover:text-[#39FF88] text-[#87948C] transition-colors font-mono text-xs flex items-center gap-1.5 cursor-pointer"
              aria-label={`Open history drawer, ${historyCount} items saved`}
              title="View analysis history"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>HISTORY</span>
              {historyCount > 0 && (
                <span className="text-[#39FF88] font-bold">
                  [{historyCount}]
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

