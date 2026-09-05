import React from 'react';
import { Sparkles, Plus, ExternalLink } from 'lucide-react';

export default function RecommendationPreview({
  suggestions = [],
  onAddSuggestion,
  onAddProduct,
  onOpenAllRecommendations,
  onViewAll
}) {
  const handleAdd = onAddSuggestion || onAddProduct;
  const handleViewAll = onOpenAllRecommendations || onViewAll;

  if (!suggestions || suggestions.length === 0) return null;

  const displayList = suggestions.slice(0, 2);

  return (
    <div className="bg-[#FAF9F6] rounded-[14px] border border-[#E6E1D9] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-[14px] font-semibold text-[#171717]">Recommended for this deal</h3>
          </div>
          <p className="text-[12px] text-[#96918A] mt-0.5">Based on similar customer purchases</p>
        </div>

        {suggestions.length > 2 && (
          <button
            type="button"
            onClick={handleViewAll}
            className="text-[13px] font-semibold text-[#D97757] hover:text-[#C96648] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View all ({suggestions.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {displayList.map((s) => (
          <div 
            key={s.product.id}
            className="p-3 bg-white rounded-[10px] border border-[#E6E1D9] shadow-2xs flex items-center justify-between gap-3 text-[13px]"
          >
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[#171717] truncate block text-[14px]">{s.product.name}</span>
              <span className="text-[12px] text-[#3F8F63] font-semibold block mt-0.5">{s.marginImpact}</span>
            </div>

            <button
              type="button"
              onClick={() => handleAdd?.(s.product)}
              className="px-3 py-1.5 bg-[#F8E9E3] hover:bg-[#D97757] text-[#D97757] hover:text-white text-[12px] font-semibold rounded-[8px] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
