import React from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

export default function RecommendationsDrawer({
  isOpen,
  onClose,
  suggestions = [],
  onAddSuggestion
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recommended Add-ons</h3>
                <p className="text-[11px] text-slate-400">AI-ranked cross-sell opportunities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {suggestions.map((s) => (
              <div
                key={s.product.id}
                className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{s.product.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.reason}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    {s.marginImpact}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">
                    ₹{s.product.basePrice.toLocaleString('en-IN')}
                    {s.product.isSubscription && <span className="text-[10px] font-normal text-slate-400">/mo</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onAddSuggestion(s.product);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to Quote</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex justify-end bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
