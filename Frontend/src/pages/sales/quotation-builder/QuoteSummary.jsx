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
    <div className="bg-white rounded-[14px] border border-[#E6E1D9] p-5 shadow-sm space-y-4 sticky top-20">
      
      {/* Title */}
      <h3 className="text-[12px] font-semibold text-[#96918A] uppercase tracking-wider">
        Quote Summary
      </h3>

      {/* One-Time vs Recurring */}
      <div className="space-y-2 text-[14px]">
        <div className="flex justify-between text-[#6F6B66]">
          <span>One-time</span>
          <span className="font-semibold text-[#171717]">
            ₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between text-[#6F6B66]">
          <span>Recurring</span>
          <span className="font-semibold text-[#C96648]">
            ₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenBilling}
          className="text-[13px] font-semibold text-[#D97757] hover:text-[#C96648] transition-colors pt-1 block cursor-pointer"
        >
          View billing breakdown &rarr;
        </button>
      </div>

      <div className="h-[1px] bg-[#EEEAE4]" />

      {/* Financial Line Breakdown */}
      <div className="space-y-2 text-[14px] text-[#6F6B66]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-[#171717]">
            ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between text-[#C95757]">
          <span>Discount</span>
          <span className="font-semibold">
            {totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span className="font-semibold text-[#171717]">
            ₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="h-[1px] bg-[#EEEAE4]" />

      {/* Grand Total & Margin */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[13px] font-semibold text-[#6F6B66] uppercase tracking-wider">Grand Total</span>
          <span className="text-[24px] sm:text-[28px] font-bold text-[#171717] tracking-tight">
            ₹{grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-[13px] text-[#6F6B66] pt-1">
          <span>Expected Margin</span>
          <span className="font-bold text-[#3F8F63] bg-[#EAF5EE] border border-[#BDE3CE] px-2.5 py-0.5 rounded-[6px] text-[12px]">
            {marginPercentage}%
          </span>
        </div>
      </div>

      {/* Governance Status Row */}
      <div className="pt-4 border-t border-[#EEEAE4] space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A]">
            Governance
          </span>
          <button
            type="button"
            onClick={onOpenGovernance}
            className="text-[13px] font-semibold text-[#D97757] hover:text-[#C96648] transition-colors inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>View details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRiskHigh ? 'bg-[#C95757]' : 'bg-[#3F8F63]'}`} />
            <span className="font-semibold text-[#171717]">
              {isRiskHigh ? 'High Risk' : 'Low Risk'} ({riskScore}/100)
            </span>
          </div>
          <span className="text-[12px] font-medium text-[#6F6B66]">
            {approvalRequirement === 'NONE' ? 'Approval not required' : 'Approval required'}
          </span>
        </div>
      </div>

    </div>
  );
}
