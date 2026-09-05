import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

export default function UpsellRecommendations({
  suggestions = [],
  onAddSuggestion,
  onDismissSuggestion
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/40 to-slate-50 rounded-xl border border-indigo-200/80 p-3 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
            Recommended For This Deal
          </h3>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-100/80 text-indigo-800 rounded-md">
          AI Attach Engine
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((s) => (
          <div 
            key={s.product.id}
            className="p-2.5 bg-white rounded-lg border border-indigo-100/90 shadow-2xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 truncate">{s.product.name}</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                  {s.marginImpact}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{s.reason}</p>
              <span className="text-xs font-black text-slate-900 mt-1 block">
                ₹{s.product.basePrice.toLocaleString('en-IN')}
                {s.product.isSubscription && <span className="text-[10px] font-normal text-slate-400">/mo</span>}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onDismissSuggestion(s.product.id)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                title="Dismiss recommendation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onAddSuggestion(s.product)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
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
