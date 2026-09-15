export default function PageSuspenseFallback() {
  return (
    <div className="w-full min-h-[400px] flex flex-col p-6 sm:p-8 space-y-6 animate-pulse">
      {/* Top shimmer progress line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B85D19] to-transparent animate-pulse z-50" />

      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8DFD8]/60 pb-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#EBE8E2] rounded-lg" />
          <div className="h-4 w-72 bg-[#EBE8E2]/60 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-[#EBE8E2] rounded-xl" />
          <div className="h-10 w-32 bg-[#EBE8E2] rounded-xl" />
        </div>
      </div>

      {/* KPI Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E8DFD8] rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="h-3 w-24 bg-[#EBE8E2] rounded" />
            <div className="h-6 w-32 bg-[#EBE8E2] rounded-lg" />
            <div className="h-3 w-20 bg-[#EBE8E2]/60 rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content Skeleton */}
      <div className="bg-white border border-[#E8DFD8] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-9 w-64 bg-[#EBE8E2] rounded-xl" />
          <div className="h-9 w-24 bg-[#EBE8E2] rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-[#FAF8F5] rounded-xl border border-[#EBE8E2]/50 flex items-center px-4 justify-between">
              <div className="h-4 w-36 bg-[#EBE8E2] rounded" />
              <div className="h-4 w-24 bg-[#EBE8E2] rounded" />
              <div className="h-4 w-20 bg-[#EBE8E2] rounded" />
              <div className="h-6 w-16 bg-[#EBE8E2] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
