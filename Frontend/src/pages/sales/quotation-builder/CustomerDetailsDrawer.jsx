import React from 'react';
import { X, Building, Mail, Phone, MapPin, ShieldCheck, User } from 'lucide-react';

export default function CustomerDetailsDrawer({
  isOpen,
  onClose,
  customer
}) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Customer Details</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-600">
            
            {/* Company Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</span>
              <p className="text-sm font-extrabold text-slate-900">{customer.name || 'Account Corporation'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold text-[10px]">
                {customer.tier || 'Standard'} Tier Account
              </span>
            </div>

            {/* Contacts */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Contact</span>
              
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{customer.contact || 'Primary Account Representative'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-600">{customer.email || 'billing@accountcorp.com'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">+91 (080) 4120-8800</span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-600">Prestige Tech Park, Outer Ring Road, Bangalore, KA - 560103</span>
              </div>
            </div>

            {/* Governance Limits */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tier Commercial Governance
              </span>
              <div className="flex justify-between">
                <span>Standard Discount Limit:</span>
                <span className="font-bold text-emerald-700">&le; {customer.tierDiscountLimit || 15}%</span>
              </div>
              <div className="flex justify-between">
                <span>Approval Threshold:</span>
                <span className="font-semibold text-slate-800">&gt; {customer.tierDiscountLimit || 15}% requires Manager</span>
              </div>
              <div className="flex justify-between">
                <span>Credit Terms:</span>
                <span className="font-semibold text-slate-800">Net 30 Days</span>
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
