import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Percent } from 'lucide-react';

export default function QuotationItemDrawer({
  isOpen,
  onClose,
  item,
  index,
  onSave,
  tierDiscountLimit = 15
}) {
  const [formData, setFormData] = useState({
    quantity: 1,
    unitPrice: 0,
    discountPercentage: 0,
    notes: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discountPercentage: item.discountPercentage || 0,
        notes: item.notes || ''
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const qty = Number(formData.quantity || 1);
  const unitPrice = Number(formData.unitPrice || 0);
  const discountPct = Number(formData.discountPercentage || 0);
  const cost = Number(item.unitCost || item.cost || unitPrice * 0.65);
  const allowed = Number(item.allowedDiscount || tierDiscountLimit || 15);

  const lineGross = qty * unitPrice;
  const lineDiscountAmt = lineGross * (discountPct / 100);
  const lineNet = lineGross - lineDiscountAmt;

  const totalCost = qty * cost;
  const lineMargin = lineNet - totalCost;
  const marginPct = lineNet > 0 ? ((lineMargin / lineNet) * 100).toFixed(1) : '0.0';

  const isOverLimit = discountPct > allowed;
  const variance = (discountPct - allowed).toFixed(1);

  const handleSave = () => {
    onSave(index, {
      ...item,
      quantity: qty,
      unitPrice: unitPrice,
      discountPercentage: discountPct,
      notes: formData.notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Quotation Item</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.sku} &bull; {item.productName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            
            {/* Parameters */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: Math.max(1, qty - 1) })}
                      className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full text-center bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: qty + 1 })}
                      className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 ${
                      isOverLimit 
                        ? 'border border-rose-300 bg-rose-50 text-rose-800' 
                        : 'border border-slate-200 bg-slate-50 text-slate-900 focus:ring-indigo-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tax Rate
                  </label>
                  <input
                    type="text"
                    disabled
                    value="18% GST"
                    className="w-full p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional commercial notes..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Pricing Governance Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Pricing Governance
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Allowed Discount</span>
                  <span className="font-bold text-slate-800">{allowed}%</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Applied Discount</span>
                  <span className={`font-bold ${isOverLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                    {discountPct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold flex items-center gap-1 ${isOverLimit ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isOverLimit ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Exceeds Limit (+{variance}%)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Within Limit ✓</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500">Margin Impact:</span>
                <span className="font-bold text-slate-900">{marginPct}%</span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
