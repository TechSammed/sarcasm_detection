import React from 'react';

interface ConfidenceBarProps {
  confidence: number; // 0.0 to 1.0 or 0 to 100
  label?: string;
  className?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  label = 'CONFIDENCE',
  className = '',
}) => {
  // Normalize to 0 - 100
  const percent = Math.min(100, Math.max(0, Math.round(confidence > 1 ? confidence : confidence * 100)));

  // Color selection based on confidence level
  const getColor = (val: number) => {
    if (val >= 75) return 'bg-[#39FF88]';
    if (val >= 50) return 'bg-[#8BE9A8]';
    return 'bg-[#D9A441]';
  };

  return (
    <div className={`w-full font-mono ${className}`}>
      <div className="flex justify-between items-center text-xs tracking-wider text-[#87948C] mb-2">
        <span className="font-semibold uppercase">{label}</span>
        <span className="font-bold text-[#E6F0EA]" data-testid="confidence-value">
          {percent}%
        </span>
      </div>
      <div
        className="w-full h-2 bg-[#151C18] rounded-xs overflow-hidden border border-[#24332B]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percent}%`}
      >
        <div
          className={`h-full rounded-xs transition-all duration-500 ease-out ${getColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

