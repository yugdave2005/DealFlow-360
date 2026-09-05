import React from 'react';
import { X, Building2, Mail, Phone, MapPin, ShieldCheck, User } from 'lucide-react';

export default function CustomerDetailsDrawer({
  isOpen,
  onClose,
  customer
}) {
  if (!isOpen || !customer) return null;

  const tier = (customer.tier || 'STANDARD').toUpperCase();
  const getTierBadgeStyle = (t) => {
    switch (t) {
      case 'ENTERPRISE':
        return 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]';
      case 'GOLD':
      case 'STANDARD':
      default:
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-[#171717]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E6E1D9] flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E6E1D9] flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#171717]">Customer Details</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#96918A] hover:text-[#171717] rounded-lg hover:bg-[#EDE8E0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px] sm:text-[14px] text-[#6F6B66]">
            
            {/* Company Info */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">Company Name</span>
              <p className="text-[17px] font-semibold text-[#171717]">{customer.name || customer.companyName || 'Account Corporation'}</p>
              <span className={`inline-block mt-1 px-3 py-0.5 rounded-full border font-semibold text-[12px] ${getTierBadgeStyle(tier)}`}>
                {tier} Tier Account
              </span>
            </div>

            {/* Contacts */}
            <div className="space-y-3.5 pt-4 border-t border-[#EEEAE4]">
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">Primary Contact</span>
              
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#96918A]" />
                <span className="font-semibold text-[#171717] text-[14px]">{customer.contact || customer.contactName || 'Primary Account Representative'}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#96918A]" />
                <span className="text-[#6F6B66] text-[14px]">{customer.email || 'billing@accountcorp.com'}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#96918A]" />
                <span className="text-[#6F6B66] text-[14px]">+91 (080) 4120-8800</span>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#96918A] shrink-0 mt-0.5" />
                <span className="text-[#6F6B66] text-[13px]">Prestige Tech Park, Outer Ring Road, Bangalore, KA - 560103</span>
              </div>
            </div>

            {/* Governance Limits */}
            <div className="p-4 bg-[#FAF9F6] rounded-[12px] border border-[#EEEAE4] space-y-2.5">
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                Tier Commercial Governance
              </span>
              <div className="flex justify-between text-[14px]">
                <span>Standard Discount Limit:</span>
                <span className="font-semibold text-[#3F8F63]">&le; {customer.tierDiscountLimit || 15}%</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span>Approval Threshold:</span>
                <span className="font-medium text-[#171717]">&gt; {customer.tierDiscountLimit || 15}% requires Manager</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span>Credit Terms:</span>
                <span className="font-medium text-[#171717]">Net 30 Days</span>
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
