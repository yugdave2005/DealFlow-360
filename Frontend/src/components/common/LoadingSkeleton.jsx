import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows, count, className = '' }) {
  const numRows = count || rows || 4;

  if (type === 'cards') {
    return (
      <div className={`p-6 sm:p-8 lg:p-10 max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
        {Array.from({ length: numRows }).map((_, i) => (
          <div key={i} className="h-32 bg-[#EEEAE4] rounded-xl border border-[#E6E1D9]" />
        ))}
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 lg:p-10 max-w-[1400px] mx-auto w-full space-y-6 animate-pulse ${className}`}>
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-xl border border-[#E6E1D9] shadow-df flex justify-between items-center">
        <div className="space-y-2 w-1/3">
          <div className="h-6 bg-[#EEEAE4] rounded-lg w-3/4" />
          <div className="h-3.5 bg-[#F5F2ED] rounded w-1/2" />
        </div>
        <div className="h-10 bg-[#EEEAE4] rounded-[9px] w-32" />
      </div>

      {/* Content Skeleton Card */}
      <div className="bg-white rounded-xl border border-[#E6E1D9] p-6 space-y-4 shadow-df">
        <div className="h-4 bg-[#EEEAE4] rounded w-1/4 mb-4" />
        {Array.from({ length: numRows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-[#EEEAE4] last:border-0">
            <div className="h-4 bg-[#EEEAE4] rounded w-1/6" />
            <div className="h-4 bg-[#F5F2ED] rounded w-1/3" />
            <div className="h-4 bg-[#EEEAE4] rounded w-1/5" />
            <div className="h-4 bg-[#F5F2ED] rounded w-1/6" />
            <div className="h-4 bg-[#EEEAE4] rounded w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
