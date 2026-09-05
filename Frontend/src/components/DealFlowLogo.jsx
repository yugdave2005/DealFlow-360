import React from 'react';

/**
 * DealFlow 360 - Professional Matte Corporate Logo
 * Represents 360° deal velocity, pipeline agility, and revenue orchestration.
 */
export default function DealFlowLogo({ 
  variant = 'dark', // 'dark' (for dark sidebars/headers) | 'light' (for white pages)
  size = 'md',      // 'sm' | 'md' | 'lg'
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
      {/* Matte Geometric Deal-Loop Emblem */}
      <div className={`${iconSizes[size]} shrink-0 rounded-lg bg-[#3730A3] p-1.5 flex items-center justify-center shadow-xs border border-[#4338CA]/40`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full text-white"
        >
          {/* Continuous 360 Deal Flow Geometric Arrows & Node */}
          <path 
            d="M4 12a8 8 0 0 1 13.657-5.657L20 4v6h-6l2.343-2.343A6 6 0 1 0 18 12h2a8 8 0 0 1-16 0z" 
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="2.5" fill="#A5B4FC" />
        </svg>
      </div>

      {/* Brand Typography (Matte, no neon gradients) */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className={`font-extrabold tracking-tight flex items-center ${textSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span>DealFlow</span>
            <span className={`ml-1 font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>360</span>
          </div>
          <span className={`font-semibold uppercase tracking-widest ${subTextSizes[size]} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Revenue Lifecycle
          </span>
        </div>
      )}
    </div>
  );
}
