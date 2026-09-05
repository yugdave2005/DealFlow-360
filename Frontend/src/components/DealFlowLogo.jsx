import React from 'react';

/**
 * DealFlow 360 — Premium Warm SaaS Logo
 * Coral/orange brand accent with clean typography.
 */
export default function DealFlowLogo({ 
  variant = 'light', // 'dark' (for dark surfaces) | 'light' (for light/warm surfaces)
  size = 'md',       // 'sm' | 'md' | 'lg'
  iconOnly = false,
  className = ''
}) {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const subTextSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Emblem — Coral */}
      <div className={`${iconSizes[size]} shrink-0 rounded-lg bg-[#D97757] p-1.5 flex items-center justify-center`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full text-white"
        >
          <path 
            d="M4 12a8 8 0 0 1 13.657-5.657L20 4v6h-6l2.343-2.343A6 6 0 1 0 18 12h2a8 8 0 0 1-16 0z" 
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="2.5" fill="#F8E9E3" />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className={`font-semibold tracking-tight flex items-center ${textSizes[size]} ${isDark ? 'text-white' : 'text-[#171717]'}`}>
            <span>DealFlow</span>
            <span className={`ml-1 font-bold ${isDark ? 'text-[#E9B8A7]' : 'text-[#D97757]'}`}>360</span>
          </div>
          <span className={`font-medium uppercase tracking-[0.08em] ${subTextSizes[size]} ${isDark ? 'text-white/50' : 'text-[#96918A]'}`}>
            Revenue Lifecycle
          </span>
        </div>
      )}
    </div>
  );
}
