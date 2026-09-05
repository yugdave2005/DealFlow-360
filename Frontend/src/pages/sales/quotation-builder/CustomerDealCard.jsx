import React from 'react';
import { Building, User, Mail, Calendar, DollarSign, ShieldCheck, ChevronDown } from 'lucide-react';

export default function CustomerDealCard({
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  currentCustomer,
  validUntilDate,
  onValidUntilChange,
  dealOwner = 'Sales Representative'
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left: Customer Selection Dropdown & Tier Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 min-w-[260px] sm:w-72">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/60 shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Target Account / Customer
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => onSelectCustomer(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer truncate"
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
          </div>

          {/* Quick Info Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Customer Tier */}
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Tier</span>
              <span className="text-xs font-bold text-indigo-700">{currentCustomer?.tier || 'Standard'}</span>
            </div>

            {/* Primary Contact */}
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Contact</span>
              <span className="text-xs font-semibold text-slate-800">
                {currentCustomer?.contact 
                  ? `${currentCustomer.contact}${currentCustomer.email ? ` (${currentCustomer.email})` : ''}`
                  : 'Standard Account Rep'}
              </span>
            </div>

            {/* Governance Limit */}
            <div className="px-2.5 py-1 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Discount Limit</span>
                <span className="text-xs font-bold text-emerald-700">&le; {currentCustomer?.tierDiscountLimit || 15}% Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deal Meta (Currency, Validity, Owner) */}
        <div className="flex items-center gap-3 text-xs border-t lg:border-t-0 lg:border-l border-slate-100 pt-2 lg:pt-0 lg:pl-3.5 shrink-0 flex-wrap">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency</span>
            <span className="font-bold text-slate-800">INR (₹)</span>
          </div>

          <div className="border-l border-slate-100 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valid Until</span>
            <input 
              type="date"
              value={validUntilDate}
              onChange={(e) => onValidUntilChange?.(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 p-0 border-0 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="border-l border-slate-100 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deal Owner</span>
            <span className="font-semibold text-slate-800">{dealOwner}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
