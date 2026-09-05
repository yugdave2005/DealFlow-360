import React from 'react';
import { Trash2, Edit3, AlertCircle } from 'lucide-react';

export default function QuotationItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onOpenDrawer,
  tierDiscountLimit = 15
}) {
  const qty = item.quantity === '' ? '' : Number(item.quantity ?? 1);
  const price = item.unitPrice === '' ? '' : Number(item.unitPrice ?? 0);
  const disc = item.discountPercentage === '' ? '' : Number(item.discountPercentage ?? 0);
  const allowed = Number(item.allowedDiscount || tierDiscountLimit || 15);
  const isOverLimit = Number(disc || 0) > allowed;

  const numericQty = Number(qty || 1);
  const numericPrice = Number(price || 0);
  const numericDisc = Number(disc || 0);

  const lineGross = numericQty * numericPrice;
  const lineDiscountAmt = lineGross * (numericDisc / 100);
  const lineNet = lineGross - lineDiscountAmt;

  const isSub = item.isSubscription || item.category === 'SUBSCRIPTIONS';

  const handleDiscountChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onUpdate?.(index, { ...item, discountPercentage: '' });
    } else {
      const parsed = parseFloat(val);
      onUpdate?.(index, { ...item, discountPercentage: isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)) });
    }
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onUpdate?.(index, { ...item, unitPrice: '' });
    } else {
      const parsed = parseFloat(val);
      onUpdate?.(index, { ...item, unitPrice: isNaN(parsed) ? 0 : Math.max(0, parsed) });
    }
  };

  const handleQtyChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onUpdate?.(index, { ...item, quantity: '' });
    } else {
      const parsed = parseInt(val, 10);
      onUpdate?.(index, { ...item, quantity: isNaN(parsed) ? 1 : Math.max(1, parsed) });
    }
  };

  return (
    <tr className="hover:bg-[#FBFAF8] transition-colors group text-[13px] sm:text-[14px]" style={{ height: '70px' }}>
      {/* Product Name & SKU */}
      <td className="py-3.5 pl-5 pr-3 align-middle">
        <div 
          onClick={() => onOpenDrawer?.(index)}
          className="cursor-pointer group/title"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#171717] group-hover/title:text-[#D97757] transition-colors text-[14px] sm:text-[15px]">
              {item.productName || 'Line Item'}
            </span>
            {isSub && (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#F8E9E3] text-[#C96648] rounded-full border border-[#E9B8A7]">
                Recurring
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#96918A] font-mono mt-0.5">
            <span className="capitalize">{item.category?.toLowerCase() || 'item'}</span>
            <span>&bull;</span>
            <span>{item.sku || 'SKU-001'}</span>
          </div>
        </div>
      </td>

      {/* Quantity Stepper */}
      <td className="py-3.5 px-3 align-middle text-center">
        <div className="inline-flex items-center rounded-[9px] border border-[#E6E1D9] bg-white shadow-2xs">
          <button
            type="button"
            onClick={() => onUpdate?.(index, { ...item, quantity: Math.max(1, numericQty - 1) })}
            className="w-7 h-8 flex items-center justify-center text-[#96918A] hover:text-[#171717] hover:bg-[#F5F2ED] font-bold transition-colors cursor-pointer rounded-l-[8px]"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={handleQtyChange}
            onBlur={() => { if (qty === '' || Number(qty) < 1) onUpdate?.(index, { ...item, quantity: 1 }); }}
            className="w-10 text-center bg-transparent text-[13px] font-semibold text-[#171717] focus:outline-none p-0"
          />
          <button
            type="button"
            onClick={() => onUpdate?.(index, { ...item, quantity: numericQty + 1 })}
            className="w-7 h-8 flex items-center justify-center text-[#96918A] hover:text-[#171717] hover:bg-[#F5F2ED] font-bold transition-colors cursor-pointer rounded-r-[8px]"
          >
            +
          </button>
        </div>
      </td>

      {/* Unit Price */}
      <td className="py-3.5 px-3 align-middle text-right">
        <div className="inline-flex items-center justify-end relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#96918A] text-[12px]">₹</span>
          <input
            type="number"
            step="100"
            min="0"
            value={price}
            onChange={handlePriceChange}
            onBlur={() => { if (price === '') onUpdate?.(index, { ...item, unitPrice: 0 }); }}
            className="w-full pl-5 pr-2 py-1.5 text-[13px] font-semibold text-[#171717] bg-white border border-[#E6E1D9] rounded-[9px] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 text-right shadow-2xs"
          />
        </div>
      </td>

      {/* Discount % */}
      <td className="py-3.5 px-3 align-middle text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          <div className="relative w-20">
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={disc}
              onChange={handleDiscountChange}
              onBlur={() => { if (disc === '') onUpdate?.(index, { ...item, discountPercentage: 0 }); }}
              className={`w-full pr-5 pl-2.5 py-1.5 text-[13px] font-semibold text-right rounded-[9px] border focus:outline-none shadow-2xs ${
                isOverLimit 
                  ? 'border-[#F5C7C7] bg-[#FBEAEA] text-[#C95757] focus:border-[#C95757]' 
                  : 'border-[#E6E1D9] bg-white text-[#171717] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15'
              }`}
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none font-bold ${isOverLimit ? 'text-[#C95757]' : 'text-[#96918A]'}`}>%</span>
          </div>
          {isOverLimit && (
            <span 
              title={`Exceeds ${allowed}% limit by +${(numericDisc - allowed).toFixed(1)}%`}
              className="text-[#C95757] cursor-help"
            >
              <AlertCircle className="w-4 h-4" />
            </span>
          )}
        </div>
      </td>

      {/* Line Total */}
      <td className="py-3.5 px-4 align-middle text-right font-bold text-[#171717] text-[14px] sm:text-[15px]">
        ₹{lineNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        {isSub && <span className="text-[11px] text-[#C96648] font-normal block">/mo</span>}
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5 align-middle text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onOpenDrawer?.(index)}
            className="p-1.5 text-[#96918A] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-[8px] transition-colors cursor-pointer"
            title="Edit Item Details"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            className="p-1.5 text-[#96918A] hover:text-[#C95757] hover:bg-[#FBEAEA] rounded-[8px] transition-colors cursor-pointer"
            title="Remove Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
