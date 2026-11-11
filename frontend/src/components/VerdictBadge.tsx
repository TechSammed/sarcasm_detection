import React from 'react';

interface VerdictBadgeProps {
  isSarcastic?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  isSarcastic,
  label,
  size = 'md',
  className = '',
}) => {
  // Determine verdict category
  const isSarc = label ? label.toLowerCase() === 'sarcastic' : Boolean(isSarcastic);
  const isUncertain = label ? label.toLowerCase() === 'uncertain' : false;

  let config = {
    className: 'verdict-sarcastic',
    text: 'Sarcastic',
    dotColor: 'bg-[#E05252]',
    borderColor: 'border-[#E05252]/40',
    bgColor: 'bg-[#E05252]/10',
    textColor: 'text-[#FF7B7B]',
    ariaLabel: 'Verdict: Sarcastic',
  };

  if (isUncertain) {
    config = {
      className: 'verdict-uncertain',
      text: 'Uncertain',
      dotColor: 'bg-[#D9A441]',
      borderColor: 'border-[#D9A441]/40',
      bgColor: 'bg-[#D9A441]/10',
      textColor: 'text-[#F3C769]',
      ariaLabel: 'Verdict: Uncertain',
    };
  } else if (!isSarc) {
    config = {
      className: 'verdict-not_sarcastic',
      text: 'Sincere / Not Sarcastic',
      dotColor: 'bg-[#39FF88]',
      borderColor: 'border-[#39FF88]/40',
      bgColor: 'bg-[#39FF88]/10',
      textColor: 'text-[#39FF88]',
      ariaLabel: 'Verdict: Sincere (Not Sarcastic)',
    };
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-sm gap-2',
    lg: 'px-4 py-2 text-base md:text-lg gap-2.5 font-bold',
  }[size];

  return (
    <div
      role="status"
      aria-label={config.ariaLabel}
      data-testid="verdict-badge"
      className={`inline-flex items-center font-mono tracking-wider rounded border transition-all ${config.className} ${config.bgColor} ${config.borderColor} ${config.textColor} ${sizeClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} aria-hidden="true" />
      <span>{config.text}</span>
    </div>
  );
};

