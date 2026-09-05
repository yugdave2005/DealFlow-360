import React from 'react';

export default function BillingBreakdown({ oneTimeSubtotal = 0, recurringSubtotal = 0 }) {
  return (
    <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200/80 space-y-1.5 text-xs">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        Hybrid Billing Structure
      </span>

      <div className="flex justify-between items-center text-slate-700">
        <span className="text-[11px]">One-Time Commercial:</span>
        <span className="font-bold text-slate-900">
          ₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>

      <div className="flex justify-between items-center text-purple-800">
        <span className="text-[11px] font-medium">Recurring Subscriptions:</span>
        <span className="font-extrabold text-purple-900">
          ₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          <span className="text-[10px] font-normal text-purple-600"> /mo</span>
        </span>
      </div>
    </div>
  );
}
