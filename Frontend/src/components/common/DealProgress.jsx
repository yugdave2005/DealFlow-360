import React from 'react';
import { Check } from 'lucide-react';

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
    <div className={`w-full bg-white rounded-xl p-4 sm:p-5 border border-[#E6E1D9] shadow-df ${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[11px] font-medium text-[#96918A] uppercase tracking-[0.06em]">Deal Progress Lifecycle</h3>
        <span className="text-xs font-medium text-[#6F6B66]">
          Stage {activeIndex + 1} of {STAGES.length}: <span className="text-[#D97757] font-semibold">{STAGES[activeIndex].label}</span>
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div 
              key={stage.id}
              className={`flex flex-col items-center p-2.5 rounded-[10px] border text-center transition-all ${
                isCurrent 
                  ? 'bg-[#F8E9E3] border-[#D97757] text-[#171717]' 
                  : isCompleted 
                  ? 'bg-[#F5F2ED] border-[#E6E1D9] text-[#171717]' 
                  : 'bg-white border-[#EEEAE4] text-[#B4AEA6]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 ${
                isCurrent 
                  ? 'bg-[#D97757] text-white' 
                  : isCompleted 
                  ? 'bg-[#3F8F63] text-white' 
                  : 'bg-[#EEEAE4] text-[#96918A]'
              }`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-medium truncate w-full ${isCurrent ? 'text-[#171717]' : isCompleted ? 'text-[#6F6B66]' : 'text-[#B4AEA6]'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
