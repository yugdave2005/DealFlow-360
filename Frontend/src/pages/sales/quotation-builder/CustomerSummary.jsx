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
    <div className="bg-white rounded-[14px] border border-[#E6E1D9] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        
        {/* Balanced 5-Column Field Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 flex-1 items-start">
          
          {/* 1. Target Account */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Customer
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all appearance-none cursor-pointer truncate shadow-2xs"
              >
                {customers.length === 0 ? (
                  <option value="" disabled>No customer accounts found</option>
                ) : (
                  customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier} · &le;{c.tierDiscountLimit}% disc)
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#96918A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Customer Tier */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Customer Tier
            </label>
            <div className="h-11 flex items-center">
              <span className="px-3 py-1 rounded-full bg-[#F8E9E3] text-[#C96648] font-semibold text-[12px] border border-[#E9B8A7]">
                {currentCustomer?.tier || 'STANDARD'}
              </span>
            </div>
          </div>

          {/* 3. Discount Limit */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Discount Limit
            </label>
            <div className="h-11 flex items-center">
              <span className="px-3 py-1 rounded-full bg-[#EAF5EE] text-[#3F8F63] font-semibold text-[12px] border border-[#BDE3CE]">
                &le; {currentCustomer?.tierDiscountLimit ?? 10}% ({currentCustomer?.tier || 'Standard'})
              </span>
            </div>
          </div>

          {/* 4. Primary Contact */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Primary Contact
            </label>
            <div className="h-11 flex items-center text-[14px] font-medium text-[#171717] truncate" title={currentCustomer?.contact || 'Account Rep'}>
              {currentCustomer?.contact || 'Account Rep'}
            </div>
          </div>

          {/* 5. Valid Until */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Valid Until
            </label>
            <div className="relative">
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => onValidUntilChange?.(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all cursor-pointer shadow-2xs"
              />
            </div>
          </div>

        </div>

        {/* Right side: View Details */}
        <div className="shrink-0 flex items-center justify-end xl:border-l xl:border-[#EEEAE4] xl:pl-5 pt-1 xl:pt-0">
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-[13px] font-semibold text-[#D97757] hover:text-[#C96648] transition-colors inline-flex items-center gap-1.5 py-2 px-3 rounded-[8px] hover:bg-[#F8E9E3] cursor-pointer"
          >
            <span>View customer details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
