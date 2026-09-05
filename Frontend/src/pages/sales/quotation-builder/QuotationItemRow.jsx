import React from 'react';
import { MoreVertical, Trash2, Edit3, AlertCircle } from 'lucide-react';

export default function QuotationItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onOpenDrawer,
  tierDiscountLimit = 15
}) {
  const qty = Number(item.quantity || 1);
  const price = Number(item.unitPrice || 0);
  const disc = Number(item.discountPercentage || 0);
  const allowed = Number(item.allowedDiscount || tierDiscountLimit || 15);
  const isOverLimit = disc > allowed;

  const lineGross = qty * price;
  const lineDiscountAmt = lineGross * (disc / 100);
  const lineNet = lineGross - lineDiscountAmt;

  const isSub = item.isSubscription || item.category === 'SUBSCRIPTIONS';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors group text-xs">
      {/* Product Name & SKU */}
      <td className="py-3 pl-4 pr-3 align-middle">
        <div 
          onClick={() => onOpenDrawer(index)}
          className="cursor-pointer group/title"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-900 group-hover/title:text-indigo-600 transition-colors">
              {item.productName || 'Line Item'}
            </span>
            {isSub && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200">
                Recurring
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
            <span className="capitalize">{item.category?.toLowerCase() || 'item'}</span>
            <span>&bull;</span>
            <span>{item.sku || 'SKU-001'}</span>
          </div>
        </div>
      </td>

      {/* Quantity Stepper */}
      <td className="py-3 px-2 align-middle text-center">
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => onUpdate(index, { ...item, quantity: Math.max(1, qty - 1) })}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-colors"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => onUpdate(index, { ...item, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-8 text-center bg-transparent text-xs font-semibold text-slate-900 focus:outline-none p-0"
          />
          <button
            type="button"
            onClick={() => onUpdate(index, { ...item, quantity: qty + 1 })}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-colors"
          >
            +
          </button>
        </div>
      </td>

      {/* Unit Price */}
      <td className="py-3 px-2 align-middle text-right">
        <div className="inline-flex items-center justify-end relative w-24">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₹</span>
          <input
            type="number"
            step="100"
            value={price}
            onChange={(e) => onUpdate(index, { ...item, unitPrice: parseFloat(e.target.value) || 0 })}
            className="w-full pl-4 pr-1.5 py-1 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 text-right"
          />
        </div>
      </td>

      {/* Discount % */}
      <td className="py-3 px-2 align-middle text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <div className="relative w-16">
            <input
              type="number"
              step="0.5"
              min="0"
              max="90"
              value={disc}
              onChange={(e) => onUpdate(index, { ...item, discountPercentage: parseFloat(e.target.value) || 0 })}
              className={`w-full pr-4 pl-1.5 py-1 text-xs font-semibold text-right rounded-lg border focus:outline-none focus:ring-1 ${
                isOverLimit 
                  ? 'border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-500' 
                  : 'border-slate-200 bg-white text-slate-900 focus:ring-indigo-600'
              }`}
            />
            <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] ${isOverLimit ? 'text-rose-500' : 'text-slate-400'}`}>%</span>
          </div>
          {isOverLimit && (
            <span 
              title={`Exceeds ${allowed}% limit by +${(disc - allowed).toFixed(1)}%`}
              className="text-rose-500 cursor-help"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </td>

      {/* Line Total */}
      <td className="py-3 px-3 align-middle text-right font-bold text-slate-900">
        ₹{lineNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        {isSub && <span className="text-[10px] text-purple-700 font-normal block">/mo</span>}
      </td>

      {/* Actions */}
      <td className="py-3 pl-2 pr-4 align-middle text-right">
        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onOpenDrawer(index)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
            title="Edit Item Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Remove Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
