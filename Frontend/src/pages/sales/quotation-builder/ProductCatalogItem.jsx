import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCatalogItem({ product, onAdd }) {
  const isSub = product.isSubscription || product.category === 'SUBSCRIPTIONS';

  return (
    <div className="py-2.5 px-3 rounded-lg border border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-2.5 group">
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
          {product.name}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
          <span>{product.sku}</span>
          <span>&bull;</span>
          <span className="capitalize">{product.category?.toLowerCase() || 'item'}</span>
        </div>
        <div className="text-xs font-bold text-slate-800 mt-1">
          ₹{product.basePrice.toLocaleString('en-IN')}
          {isSub && <span className="text-[10px] font-normal text-slate-400">/mo</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAdd(product)}
        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-md transition-all shrink-0 flex items-center gap-1 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white"
        title={`Add ${product.name} to quote`}
      >
        <Plus className="w-3 h-3" />
        <span>Add</span>
      </button>
    </div>
  );
}
