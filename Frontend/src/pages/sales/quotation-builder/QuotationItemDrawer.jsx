import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Percent, Package } from 'lucide-react';

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
        className="absolute inset-0 bg-[#171717]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E6E1D9] flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E6E1D9] flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717]">Edit Quotation Item</h3>
                <p className="text-[12px] text-[#96918A] font-mono mt-0.5">{item.sku} &bull; {item.productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#96918A] hover:text-[#171717] rounded-lg hover:bg-[#EDE8E0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[14px]">
            
            {/* Parameters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6F6B66] mb-1.5">
                    Quantity
                  </label>
                  <div className="flex items-center rounded-[10px] border border-[#E6E1D9] bg-white shadow-2xs h-11">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: Math.max(1, qty - 1) })}
                      className="px-3.5 h-full text-[#96918A] hover:text-[#171717] hover:bg-[#F5F2ED] font-bold rounded-l-[9px]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full text-center bg-transparent text-[14px] font-semibold text-[#171717] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: qty + 1 })}
                      className="px-3.5 h-full text-[#96918A] hover:text-[#171717] hover:bg-[#F5F2ED] font-bold rounded-r-[9px]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6F6B66] mb-1.5">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-semibold text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6F6B66] mb-1.5">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className={`w-full h-11 px-3.5 rounded-[10px] text-[14px] font-semibold focus:outline-none shadow-2xs ${
                      isOverLimit 
                        ? 'border border-[#F5C7C7] bg-[#FBEAEA] text-[#C95757] focus:border-[#C95757]' 
                        : 'border border-[#E6E1D9] bg-white text-[#171717] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6F6B66] mb-1.5">
                    Tax Rate
                  </label>
                  <input
                    type="text"
                    disabled
                    value="18% GST"
                    className="w-full h-11 px-3.5 bg-[#FAF9F6] border border-[#E6E1D9] rounded-[10px] text-[14px] font-semibold text-[#96918A] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6F6B66] mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional commercial notes..."
                  className="w-full p-3 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 shadow-2xs"
                />
              </div>
            </div>

            {/* Pricing Governance Section */}
            <div className="p-4 bg-[#FAF9F6] rounded-[12px] border border-[#EEEAE4] space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                Pricing Governance
              </span>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="bg-white p-3 rounded-[9px] border border-[#E6E1D9]">
                  <span className="text-[#96918A] text-[11px] block">Allowed Discount</span>
                  <span className="font-bold text-[#171717] text-[15px]">{allowed}%</span>
                </div>
                <div className="bg-white p-3 rounded-[9px] border border-[#E6E1D9]">
                  <span className="text-[#96918A] text-[11px] block">Applied Discount</span>
                  <span className={`font-bold text-[15px] ${isOverLimit ? 'text-[#C95757]' : 'text-[#171717]'}`}>
                    {discountPct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] pt-1">
                <span className="text-[#6F6B66]">Status:</span>
                <span className={`font-semibold flex items-center gap-1.5 ${isOverLimit ? 'text-[#C95757]' : 'text-[#3F8F63]'}`}>
                  {isOverLimit ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Exceeds Limit (+{variance}%)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Within Limit ✓</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-[13px] border-t border-[#EEEAE4] pt-2">
                <span className="text-[#6F6B66]">Margin Impact:</span>
                <span className="font-bold text-[#171717]">{marginPct}%</span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E6E1D9] flex items-center justify-end gap-3 bg-[#FAF9F6]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-[13px] font-semibold text-[#6F6B66] hover:text-[#171717] bg-white border border-[#E6E1D9] hover:bg-[#F5F2ED] rounded-[9px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-5 text-[13px] font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[9px] shadow-2xs transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
