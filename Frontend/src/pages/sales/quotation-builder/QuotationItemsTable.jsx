import React from 'react';
import { Plus } from 'lucide-react';
import QuotationItemRow from './QuotationItemRow';

export default function QuotationItemsTable({
  items = [],
  onUpdateItem,
  onRemoveItem,
  onOpenDrawer,
  tierDiscountLimit = 15,
  onClearAll
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Quotation Items
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Table Area */}
      {items.length === 0 ? (
        <div className="py-14 px-4 text-center">
          <p className="text-xs font-semibold text-slate-700">No products added yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
            Add products from the catalog on the left to start building this quote.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                <th className="py-2.5 pl-4 pr-3">Product</th>
                <th className="py-2.5 px-2 text-center w-24">Qty</th>
                <th className="py-2.5 px-2 text-right w-28">Unit Price</th>
                <th className="py-2.5 px-2 text-right w-24">Discount</th>
                <th className="py-2.5 px-3 text-right w-28">Total</th>
                <th className="py-2.5 pl-2 pr-4 text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, index) => (
                <QuotationItemRow
                  key={item.id || index}
                  item={item}
                  index={index}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  onOpenDrawer={onOpenDrawer}
                  tierDiscountLimit={tierDiscountLimit}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
