import React from 'react';
import { ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';

export default function QuoteSummary({
  calculations,
  onOpenBilling,
  onOpenGovernance
}) {
  const {
    subtotal = 0,
    oneTimeSubtotal = 0,
    recurringSubtotal = 0,
    totalDiscount = 0,
    tax = 0,
    grandTotalWithTax = 0,
    marginPercentage = '0.0',
    riskScore = 0,
    riskLevel = 'LOW',
    approvalRequirement = 'NONE'
  } = calculations || {};

  const isRiskHigh = riskScore >= 45;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4 sticky top-20">
      
      {/* Title */}
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Quote Summary
      </h3>

      {/* One-Time vs Recurring */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>One-time</span>
          <span className="font-semibold text-slate-900">
            ₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Recurring</span>
          <span className="font-semibold text-purple-700">
            ₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenBilling}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors pt-0.5 block"
        >
          View billing breakdown &rarr;
        </button>
      </div>

      <div className="h-[1px] bg-slate-100" />

      {/* Financial Line Breakdown */}
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">
            ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between text-rose-600">
          <span>Discount</span>
          <span className="font-semibold">
            {totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span className="font-semibold text-slate-900">
            ₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="h-[1px] bg-slate-100" />

      {/* Grand Total & Margin */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grand Total</span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            ₹{grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-600 pt-0.5">
          <span>Expected Margin</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
            {marginPercentage}%
          </span>
        </div>
      </div>

      {/* Subtle Governance Status Row */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Governance
          </span>
          <button
            type="button"
            onClick={onOpenGovernance}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-0.5"
          >
            <span>View details</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isRiskHigh ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="font-semibold text-slate-800">
              {isRiskHigh ? 'High Risk' : 'Low Risk'} ({riskScore}/100)
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {approvalRequirement === 'NONE' ? 'Approval not required' : 'Approval required'}
          </span>
        </div>
      </div>

    </div>
  );
}
