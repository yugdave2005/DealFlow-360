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
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Billing Structure</h3>
                <p className="text-[11px] text-slate-400">Hybrid commercial breakdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            
            {/* ONE-TIME Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                One-Time Commercial Charges
              </span>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Hardware Lines ({hardwareItems.length}):</span>
                  <span className="font-semibold text-slate-800">₹{hwTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Services ({serviceItems.length}):</span>
                  <span className="font-semibold text-slate-800">₹{svcTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                  <span>Total One-Time:</span>
                  <span>₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* RECURRING Breakdown */}
            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/70 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                Recurring Subscriptions (ARR Driver)
              </span>

              {subscriptionItems.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No recurring subscription items attached.</p>
              ) : (
                <div className="space-y-2">
                  {subscriptionItems.map((sub, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 bg-white p-2 rounded-lg border border-purple-100">
                      <span className="font-semibold truncate max-w-[180px]">{sub.productName}</span>
                      <span className="font-bold text-purple-900">
                        ₹{(Number(sub.unitPrice || 0) * (1 - (Number(sub.discountPercentage || 0)/100))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-purple-200/60 pt-1 flex justify-between font-bold text-purple-950">
                    <span>Total Monthly ARR:</span>
                    <span>₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Schedule Terms */}
            <div className="space-y-2 text-slate-500 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Schedule & Terms
              </span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Invoice Generation: On Order Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Terms: Net 30 Days Standard</span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex justify-end bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
