import React from 'react';
import { ChevronDown, ExternalLink, Calendar } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Balanced 5-Column Field Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 flex-1 items-start">
          
          {/* 1. Target Account */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Customer
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer truncate"
              >
                {customers.length === 0 ? (
                  <option value="" disabled>No customer accounts found</option>
                ) : (
                  customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Customer Tier */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Customer Tier
            </label>
            <div className="h-[30px] flex items-center">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                {currentCustomer?.tier || 'Standard'}
              </span>
            </div>
          </div>

          {/* 3. Discount Limit */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Discount Limit
            </label>
            <div className="h-[30px] flex items-center">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-100">
                &le; {currentCustomer?.tierDiscountLimit || 15}% Standard
              </span>
            </div>
          </div>

          {/* 4. Primary Contact */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Contact
            </label>
            <div className="h-[30px] flex items-center text-xs font-semibold text-slate-800 truncate" title={currentCustomer?.contact || 'Account Rep'}>
              {currentCustomer?.contact || 'Account Rep'}
            </div>
          </div>

          {/* 5. Valid Until */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Valid Until
            </label>
            <div className="relative">
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => onValidUntilChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Right side: View Details */}
        <div className="shrink-0 flex items-center justify-end xl:border-l xl:border-slate-100 xl:pl-4 pt-1 xl:pt-0">
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-indigo-50/70"
          >
            <span>View customer details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
