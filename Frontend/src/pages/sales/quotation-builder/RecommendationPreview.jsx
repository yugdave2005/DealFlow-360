import React from 'react';
import { Sparkles, Plus, ExternalLink } from 'lucide-react';

export default function RecommendationPreview({
  suggestions = [],
  onAddSuggestion,
  onOpenAllRecommendations
}) {
  if (!suggestions || suggestions.length === 0) return null;

  const displayList = suggestions.slice(0, 2);

  return (
    <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Recommended for this deal</h3>
          </div>
          <p className="text-[11px] text-slate-400">Based on similar customer purchases</p>
        </div>

        {suggestions.length > 2 && (
          <button
            type="button"
            onClick={onOpenAllRecommendations}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
          >
            <span>View all ({suggestions.length})</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayList.map((s) => (
          <div 
            key={s.product.id}
            className="p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs flex items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-slate-900 truncate block">{s.product.name}</span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">{s.marginImpact}</span>
            </div>

            <button
              type="button"
              onClick={() => onAddSuggestion(s.product)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold rounded-md transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
