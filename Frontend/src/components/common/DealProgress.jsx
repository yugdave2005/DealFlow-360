import React from 'react';
import { Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const STAGES = [
  { id: 'QUOTATION', label: 'Quotation', statusMatches: ['DRAFT', 'SENT'] },
  { id: 'APPROVAL', label: 'Approval', statusMatches: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RETURNED'] },
  { id: 'NEGOTIATION', label: 'Negotiation', statusMatches: ['NEGOTIATION', 'UNDER_NEGOTIATION'] },
  { id: 'CONFIRMED', label: 'Confirmed', statusMatches: ['CONFIRMED'] },
  { id: 'FULFILLMENT', label: 'Fulfillment', statusMatches: ['FULFILLMENT', 'SHIPPED', 'DELIVERED'] },
  { id: 'BILLING', label: 'Billing', statusMatches: ['COMPLETED', 'INVOICED', 'PAID'] }
];

export default function DealProgress({ currentStatus = 'DRAFT', className = '' }) {
  const norm = currentStatus.toUpperCase();

  // Determine active index
  let activeIndex = 0;
  if (norm === 'SENT') activeIndex = 0;
  else if (norm === 'PENDING_APPROVAL' || norm === 'APPROVED' || norm === 'REJECTED' || norm === 'RETURNED') activeIndex = 1;
  else if (norm === 'NEGOTIATION' || norm === 'UNDER_NEGOTIATION') activeIndex = 2;
  else if (norm === 'CONFIRMED') activeIndex = 3;
  else if (norm === 'FULFILLMENT' || norm === 'SHIPPED') activeIndex = 4;
  else if (norm === 'COMPLETED' || norm === 'PAID' || norm === 'INVOICED') activeIndex = 5;

  return (
    <div className={`w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deal Progress Lifecycle</h3>
        <span className="text-xs font-semibold text-slate-700">
          Stage {activeIndex + 1} of {STAGES.length}: <span className="text-indigo-600">{STAGES[activeIndex].label}</span>
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div 
              key={stage.id}
              className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                isCurrent 
                  ? 'bg-indigo-50/80 border-indigo-600 shadow-xs text-indigo-950 ring-1 ring-indigo-600/20' 
                  : isCompleted 
                  ? 'bg-slate-50 border-slate-200 text-slate-800' 
                  : 'bg-white border-slate-200/60 text-slate-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                isCurrent 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : isCompleted 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-semibold truncate w-full ${isCurrent ? 'text-indigo-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
