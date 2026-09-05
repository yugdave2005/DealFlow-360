import React from 'react';

/**
 * DealFlow 360 — Premium Warm SaaS Logo
 * Bolder, enlarged, with rich warm coral/copper emblem and crisp typography.
 */
export default function DealFlowLogo({ 
  variant = 'light', // 'dark' | 'light'
  size = 'md',       // 'sm' | 'md' | 'lg'
  iconOnly = false,
  className = ''
}) {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg p-1.5',
    md: 'w-10 h-10 rounded-xl p-2',
    lg: 'w-12 h-12 rounded-xl p-2.5',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subTextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-[12px]',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Emblem */}
      <div className={`${iconSizes[size]} shrink-0 bg-[#B85D19] shadow-xs flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
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
          <circle cx="12" cy="12" r="2.5" fill="#FAF8F5" />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className={`font-bold tracking-tight flex items-center ${textSizes[size]} ${isDark ? 'text-white' : 'text-[#1E1B18]'}`}>
            <span>DealFlow</span>
            <span className={`ml-1 font-extrabold ${isDark ? 'text-[#E8DFD8]' : 'text-[#B85D19]'}`}>360</span>
          </div>
          <span className={`font-semibold uppercase tracking-[0.1em] ${subTextSizes[size]} ${isDark ? 'text-white/60' : 'text-[#78716C]'}`}>
            Revenue Lifecycle
          </span>
        </div>
      )}
    </div>
  );
}
