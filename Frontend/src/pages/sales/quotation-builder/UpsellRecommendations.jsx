import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

export default function UpsellRecommendations({
  suggestions = [],
  onAddSuggestion,
  onDismissSuggestion
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-[#FAF8F5] rounded-2xl border border-[#EBE8E2] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#B85D19]" />
          <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Recommended For This Deal
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F5EFEB] text-[#B85D19] rounded-full border border-[#E8DFD8]">
          AI Attach Engine
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {suggestions.map((s) => (
          <div 
            key={s.product.id}
            className="p-3 bg-[#FFFFFF] rounded-xl border border-[#EBE8E2] shadow-xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#1E1B18] truncate">{s.product.name}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {s.marginImpact}
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] truncate mt-0.5">{s.reason}</p>
              <span className="text-xs font-black text-[#1E1B18] mt-1 block">
                ₹{s.product.basePrice.toLocaleString('en-IN')}
                {s.product.isSubscription && <span className="text-[10px] font-normal text-[#A8A29E]">/mo</span>}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onDismissSuggestion(s.product.id)}
                className="p-1.5 text-[#A8A29E] hover:text-[#1E1B18] rounded-lg hover:bg-[#F5EFEB] transition-colors cursor-pointer"
                title="Dismiss recommendation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onAddSuggestion(s.product)}
                className="px-3 py-1.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
