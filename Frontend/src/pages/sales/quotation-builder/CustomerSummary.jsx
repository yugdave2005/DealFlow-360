import React from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

export default function CustomerSummary({
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  currentCustomer,
  validUntilDate,
  onValidUntilChange,
  onOpenDetails
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Customer selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
          <div className="min-w-[240px] sm:w-64">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer truncate"
              >
                {customers.length === 0 ? (
                  <option value="" disabled>No customer accounts found</option>
                ) : (
                  customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Key Customer Parameters */}
          <div className="flex items-center gap-6 flex-wrap text-xs text-slate-600">
            <div>
              <span className="text-slate-400 text-[11px] block">Customer Tier</span>
              <span className="font-semibold text-slate-900">{currentCustomer?.tier || 'Standard'}</span>
            </div>

            <div className="border-l border-slate-100 pl-4">
              <span className="text-slate-400 text-[11px] block">Discount Limit</span>
              <span className="font-semibold text-slate-900">&le;{currentCustomer?.tierDiscountLimit || 15}%</span>
            </div>

            <div className="border-l border-slate-100 pl-4">
              <span className="text-slate-400 text-[11px] block">Primary Contact</span>
              <span className="font-semibold text-slate-900">{currentCustomer?.contact || 'Account Rep'}</span>
            </div>

            <div className="border-l border-slate-100 pl-4">
              <span className="text-slate-400 text-[11px] block">Valid Until</span>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => onValidUntilChange?.(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 p-0 border-0 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: View Customer Details Drawer trigger */}
        <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
          >
            <span>View customer details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
