import React from 'react';
import { IndianRupee, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import BillingBreakdown from './BillingBreakdown';

export default function QuoteSummaryCard({ calculations }) {
  const {
    subtotal = 0,
    oneTimeSubtotal = 0,
    recurringSubtotal = 0,
    totalDiscount = 0,
    tax = 0,
    grandTotalWithTax = 0,
    margin = 0,
    marginPercentage = '0.0'
  } = calculations || {};

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EBE8E2] pb-2.5">
        <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
          Quote Summary
        </h3>
        <span className="text-[10px] font-bold text-[#A8A29E] uppercase font-mono">
          INR (₹)
        </span>
      </div>

      {/* Hybrid Billing Split */}
      <BillingBreakdown
        oneTimeSubtotal={oneTimeSubtotal}
        recurringSubtotal={recurringSubtotal}
      />

      {/* Financial Line Items */}
      <div className="space-y-1.5 text-xs text-[#78716C]">
        <div className="flex justify-between">
          <span className="text-[#78716C]">Subtotal (Gross):</span>
          <span className="font-semibold text-[#1E1B18]">
            ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between text-rose-600">
          <span>Total Discount:</span>
          <span className="font-semibold">
            {totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0'}
          </span>
        </div>

        <div className="flex justify-between text-[#78716C]">
          <span>Estimated GST (18%):</span>
          <span className="font-semibold text-[#1E1B18]">
            ₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Grand Total */}
        <div className="border-t border-[#EBE8E2] pt-2.5 flex justify-between items-baseline">
          <span className="font-bold text-[#1E1B18] text-xs uppercase tracking-wider">
            Grand Total:
          </span>
          <span className="font-black text-[#1E1B18] text-xl tracking-tight">
            ₹{grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Expected Margin Banner */}
        <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/70 flex items-center justify-between mt-2">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
              Expected Margin
            </span>
            <span className="text-xs font-extrabold text-emerald-900">
              ₹{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-sm font-black text-emerald-700 bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200/80">
            {marginPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
