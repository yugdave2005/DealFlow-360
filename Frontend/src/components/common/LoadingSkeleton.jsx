import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows, count, className = '' }) {
  const numRows = count || rows || 4;

  if (type === 'cards') {
    return (
      <div className={`p-6 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
        {Array.from({ length: numRows }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/70 rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse ${className}`}>
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div className="space-y-2 w-1/3">
          <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-3.5 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-32" />
      </div>

      {/* Content Skeleton Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        {Array.from({ length: numRows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-slate-50 last:border-0">
            <div className="h-4 bg-slate-200/70 rounded w-1/6" />
            <div className="h-4 bg-slate-200/60 rounded w-1/3" />
            <div className="h-4 bg-slate-200/50 rounded w-1/5" />
            <div className="h-4 bg-slate-200/60 rounded w-1/6" />
            <div className="h-4 bg-slate-200/70 rounded w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
