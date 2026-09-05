import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows = 5, className = '' }) {
  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/70 rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 animate-pulse ${className}`}>
      <div className="h-5 bg-slate-200/80 rounded w-1/4 mb-6" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 bg-slate-200/70 rounded w-1/6" />
          <div className="h-4 bg-slate-200/60 rounded w-1/4" />
          <div className="h-4 bg-slate-200/50 rounded w-1/5" />
          <div className="h-4 bg-slate-200/60 rounded w-1/6" />
          <div className="h-4 bg-slate-200/70 rounded w-1/8 ml-auto" />
        </div>
      ))}
    </div>
  );
}
