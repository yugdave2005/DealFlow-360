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
    <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#EEEAE4] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#171717] tracking-tight">
            Quotation Items
          </h2>
          <span className="text-[12px] font-semibold text-[#6F6B66] bg-[#F5F2ED] px-2.5 py-0.5 rounded-full border border-[#E6E1D9]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[13px] font-semibold text-[#96918A] hover:text-[#C95757] transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Table Area */}
      {items.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <p className="text-[15px] font-semibold text-[#171717]">No products added yet</p>
          <p className="text-[13px] text-[#6F6B66] mt-1 max-w-sm mx-auto">
            Add products from the catalog on the left to start building this quote.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#E6E1D9]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] text-[11px] font-semibold uppercase tracking-wider text-[#96918A] border-b border-[#E6E1D9] sticky top-0 z-10">
                <th className="py-3.5 pl-5 pr-3">Product</th>
                <th className="py-3.5 px-3 text-center w-28">Qty</th>
                <th className="py-3.5 px-3 text-right w-32">Unit Price</th>
                <th className="py-3.5 px-3 text-right w-28">Discount</th>
                <th className="py-3.5 px-4 text-right w-32">Total</th>
                <th className="py-3.5 pl-3 pr-5 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAE4] bg-white">
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
