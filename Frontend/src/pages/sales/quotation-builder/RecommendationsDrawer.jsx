import React from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

export default function RecommendationsDrawer({
  isOpen,
  onClose,
  suggestions = [],
  onAddSuggestion
}) {
  if (!isOpen) return null;

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
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717]">Recommended Add-ons</h3>
                <p className="text-[12px] text-[#96918A]">AI-ranked cross-sell opportunities</p>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[14px]">
            {suggestions.map((s) => (
              <div
                key={s.product.id}
                className="p-4 bg-white rounded-[12px] border border-[#E6E1D9] shadow-2xs space-y-3 hover:border-[#D97757]/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-[#171717] text-[15px]">{s.product.name}</h4>
                    <p className="text-[13px] text-[#6F6B66] mt-1 leading-relaxed">{s.reason}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#3F8F63] bg-[#EAF5EE] border border-[#BDE3CE] px-2.5 py-0.5 rounded-full shrink-0">
                    {s.marginImpact}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EEEAE4]">
                  <span className="font-bold text-[#171717] text-[15px]">
                    ₹{Number(s.product.basePrice || 0).toLocaleString('en-IN')}
                    {s.product.isSubscription && <span className="text-[11px] font-normal text-[#96918A] ml-1">/mo</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onAddSuggestion(s.product);
                    }}
                    className="h-9 px-4 bg-[#D97757] hover:bg-[#C96648] text-white font-semibold rounded-[8px] shadow-2xs transition-colors flex items-center gap-1.5 text-[13px] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Quote</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E6E1D9] flex justify-end bg-[#FAF9F6]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 text-[13px] font-semibold text-[#6F6B66] hover:text-[#171717] bg-white hover:bg-[#F5F2ED] border border-[#E6E1D9] rounded-[9px] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
