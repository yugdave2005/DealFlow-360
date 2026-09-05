import React from 'react';
import { X, Receipt, Calendar, CreditCard } from 'lucide-react';

export default function BillingDrawer({
  isOpen,
  onClose,
  oneTimeSubtotal = 0,
  recurringSubtotal = 0,
  items = []
}) {
  if (!isOpen) return null;

  const hardwareItems = items.filter(i => i.category === 'HARDWARE');
  const serviceItems = items.filter(i => i.category === 'SERVICES');
  const subscriptionItems = items.filter(i => i.isSubscription || i.category === 'SUBSCRIPTIONS');

  const hwTotal = hardwareItems.reduce((sum, i) => sum + (Number(i.quantity || 1) * Number(i.unitPrice || 0) * (1 - (Number(i.discountPercentage || 0)/100))), 0);
  const svcTotal = serviceItems.reduce((sum, i) => sum + (Number(i.quantity || 1) * Number(i.unitPrice || 0) * (1 - (Number(i.discountPercentage || 0)/100))), 0);

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
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717]">Billing Structure</h3>
                <p className="text-[12px] text-[#96918A]">Hybrid commercial breakdown</p>
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
            
            {/* ONE-TIME Breakdown */}
            <div className="p-4 bg-[#FAF9F6] rounded-[12px] border border-[#EEEAE4] space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                One-Time Commercial Charges
              </span>

              <div className="space-y-2 text-[#6F6B66]">
                <div className="flex justify-between">
                  <span>Hardware Lines ({hardwareItems.length}):</span>
                  <span className="font-semibold text-[#171717]">₹{hwTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Services ({serviceItems.length}):</span>
                  <span className="font-semibold text-[#171717]">₹{svcTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="border-t border-[#EEEAE4] pt-2 flex justify-between font-bold text-[#171717]">
                  <span>Total One-Time:</span>
                  <span>₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* RECURRING Breakdown */}
            <div className="p-4 bg-[#F8E9E3]/40 rounded-[12px] border border-[#E9B8A7]/70 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C96648] block">
                Recurring Subscriptions (ARR Driver)
              </span>

              {subscriptionItems.length === 0 ? (
                <p className="text-[13px] text-[#6F6B66] italic">No recurring subscription items attached.</p>
              ) : (
                <div className="space-y-2.5">
                  {subscriptionItems.map((sub, idx) => (
                    <div key={idx} className="flex justify-between text-[#171717] bg-white p-3 rounded-[10px] border border-[#E6E1D9]">
                      <span className="font-semibold truncate max-w-[200px]">{sub.productName}</span>
                      <span className="font-bold text-[#C96648]">
                        ₹{(Number(sub.unitPrice || 0) * (1 - (Number(sub.discountPercentage || 0)/100))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[#E9B8A7]/60 pt-2 flex justify-between font-bold text-[#C96648]">
                    <span>Total Monthly ARR:</span>
                    <span>₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Schedule Terms */}
            <div className="space-y-2 text-[#6F6B66] pt-1 text-[13px]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                Schedule & Terms
              </span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#96918A]" />
                <span>Invoice Generation: On Order Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#96918A]" />
                <span>Payment Terms: Net 30 Days Standard</span>
              </div>
            </div>

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
