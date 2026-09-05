import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCatalogItem({ product, onAdd }) {
  const isSub = product.isSubscription || product.category === 'SUBSCRIPTIONS';

  return (
    <div className="p-3 rounded-[10px] border border-[#E6E1D9] hover:border-[#D97757]/60 bg-white hover:bg-[#FAF9F6] transition-all flex items-center justify-between gap-3 group">
      <div className="min-w-0 flex-1">
        <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#171717] group-hover:text-[#D97757] transition-colors truncate">
          {product.name}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-[#96918A] font-mono mt-0.5">
          <span>{product.sku}</span>
          <span>&bull;</span>
          <span className="capitalize">{product.category?.toLowerCase() || 'item'}</span>
        </div>
        <div className="text-[13px] sm:text-[14px] font-bold text-[#171717] mt-1">
          ₹{Number(product.basePrice || 0).toLocaleString('en-IN')}
          {isSub && <span className="text-[11px] font-normal text-[#96918A] ml-1">/mo</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAdd(product)}
        className="px-3 py-1.5 text-[12px] font-semibold text-[#D97757] bg-[#F8E9E3] hover:bg-[#D97757] hover:text-white rounded-[8px] transition-all shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
        title={`Add ${product.name} to quote`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add</span>
      </button>
    </div>
  );
}
