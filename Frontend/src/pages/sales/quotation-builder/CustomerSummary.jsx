import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ExternalLink, Search, X } from 'lucide-react';

export default function CustomerSummary({
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  currentCustomer,
  validUntilDate,
  onValidUntilChange,
  onOpenDetails
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.tier || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const selectedLabel = selectedCustomerId
    ? (customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown')
    : 'N/A';

  const handleSelect = (id) => {
    onSelectCustomer(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectCustomer('');
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-[14px] border border-[#E6E1D9] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        
        {/* Balanced 5-Column Field Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 flex-1 items-start">
          
          {/* 1. Target Account — Searchable Custom Dropdown */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1" ref={dropdownRef}>
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Customer
            </label>
            <div className="relative">
              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                className={`w-full h-11 pl-3.5 pr-8 bg-white border rounded-[10px] text-[14px] font-medium text-left transition-all shadow-2xs flex items-center justify-between truncate cursor-pointer ${
                  isOpen
                    ? 'border-[#D97757] ring-2 ring-[#D97757]/15'
                    : 'border-[#E6E1D9] hover:border-[#C9C3BA]'
                }`}
              >
                <span className={`truncate ${selectedCustomerId ? 'text-[#171717]' : 'text-[#96918A]'}`}>
                  {selectedLabel}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {selectedCustomerId && (
                    <span
                      onClick={handleClear}
                      className="text-[#96918A] hover:text-[#D97757] transition-colors cursor-pointer p-0.5 rounded"
                      title="Clear selection"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-[#96918A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Panel */}
              {isOpen && (
                <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E6E1D9] rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-w-[220px]">
                  
                  {/* Search Bar */}
                  <div className="p-2 border-b border-[#EEEAE4] bg-[#FAF9F6]">
                    <div className="flex items-center gap-2 bg-white border border-[#E6E1D9] rounded-[8px] px-2.5 h-8 focus-within:border-[#D97757] focus-within:ring-1 focus-within:ring-[#D97757]/20 transition-all">
                      <Search className="w-3.5 h-3.5 text-[#96918A] shrink-0" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search customers..."
                        className="flex-1 bg-transparent text-[13px] text-[#171717] placeholder:text-[#B5AFA8] outline-none min-w-0"
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="text-[#96918A] hover:text-[#D97757] transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-52 overflow-y-auto py-1">
                    
                    {/* N/A Option */}
                    <button
                      type="button"
                      onClick={() => handleSelect('')}
                      className={`w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                        !selectedCustomerId
                          ? 'bg-[#F8E9E3] text-[#D97757] font-semibold'
                          : 'text-[#6F6B66] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C9C3BA] shrink-0" />
                      <span>N/A — No customer</span>
                    </button>

                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-4 text-center text-[13px] text-[#96918A]">
                        No customers match &ldquo;{searchTerm}&rdquo;
                      </div>
                    ) : (
                      filteredCustomers.map(c => {
                        const isSelected = c.id === selectedCustomerId;
                        const tierColor =
                          c.tier === 'ENTERPRISE' ? 'bg-[#F8E9E3] text-[#C96648]' :
                          c.tier === 'GOLD' ? 'bg-[#FDF6E7] text-[#B45309]' :
                          'bg-[#F5F2ED] text-[#6F6B66]';
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelect(c.id)}
                            className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected ? 'bg-[#F8E9E3]' : 'hover:bg-[#FAF9F6]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className={`text-[13px] font-semibold truncate ${isSelected ? 'text-[#D97757]' : 'text-[#171717]'}`}>
                                {c.name}
                              </p>
                              <p className="text-[11px] text-[#96918A] truncate">{c.email}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierColor}`}>
                              {c.tier}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer count */}
                  <div className="px-3 py-1.5 border-t border-[#EEEAE4] bg-[#FAF9F6]">
                    <p className="text-[11px] text-[#96918A]">
                      {filteredCustomers.length} of {customers.length} accounts
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Customer Tier */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Customer Tier
            </label>
            <div className="h-11 flex items-center">
              <span className="px-3 py-1 rounded-full bg-[#F8E9E3] text-[#C96648] font-semibold text-[12px] border border-[#E9B8A7]">
                {currentCustomer?.tier || 'N/A'}
              </span>
            </div>
          </div>

          {/* 3. Discount Limit */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Discount Limit
            </label>
            <div className="h-11 flex items-center">
              {selectedCustomerId ? (
                <span className="px-3 py-1 rounded-full bg-[#EAF5EE] text-[#3F8F63] font-semibold text-[12px] border border-[#BDE3CE]">
                  &le; {currentCustomer?.tierDiscountLimit ?? 10}% ({currentCustomer?.tier || 'Standard'})
                </span>
              ) : (
                <span className="text-[13px] text-[#96918A]">—</span>
              )}
            </div>
          </div>

          {/* 4. Primary Contact */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#96918A] uppercase tracking-wider">
              Primary Contact
            </label>
            <div className="h-11 flex items-center text-[14px] font-medium text-[#171717] truncate" title={currentCustomer?.contact || '—'}>
              {selectedCustomerId ? (currentCustomer?.contact || 'Account Rep') : <span className="text-[#96918A]">—</span>}
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
            disabled={!selectedCustomerId}
            className="text-[13px] font-semibold text-[#D97757] hover:text-[#C96648] transition-colors inline-flex items-center gap-1.5 py-2 px-3 rounded-[8px] hover:bg-[#F8E9E3] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>View customer details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

