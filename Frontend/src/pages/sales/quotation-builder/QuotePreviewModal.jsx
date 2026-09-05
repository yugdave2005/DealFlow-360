import React from 'react';
import { X, Printer, Download, CheckCircle, Building, ShieldCheck, FileText } from 'lucide-react';
import DealFlowLogo from '../../../components/DealFlowLogo';

export default function QuotePreviewModal({
  isOpen,
  onClose,
  currentCustomer,
  items = [],
  calculations = {},
  validUntilDate
}) {
  if (!isOpen) return null;

  const {
    subtotal = 0,
    oneTimeSubtotal = 0,
    recurringSubtotal = 0,
    totalDiscount = 0,
    tax = 0,
    grandTotalWithTax = 0
  } = calculations || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-[#171717]/50 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[16px] shadow-2xl border border-[#E6E1D9] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#171717] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#D97757]" />
            <span className="text-[13px] font-bold uppercase tracking-wider text-white">
              Customer-Facing Commercial Proposal Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-[12px] font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-[8px] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Document Body (Clean Customer View) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[13px] sm:text-[14px] bg-white">
          
          {/* Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#EEEAE4] pb-6">
            <div>
              <DealFlowLogo size="md" />
              <p className="text-[12px] text-[#6F6B66] mt-2.5 leading-relaxed">
                DealFlow360 Enterprise Solutions Pvt. Ltd.<br />
                Cyber City, Tower B, Level 14<br />
                Gurugram, Haryana - 122002
              </p>
            </div>

            <div className="text-right sm:text-right space-y-1">
              <span className="text-[15px] font-extrabold text-[#171717] block font-mono">
                COMMERCIAL PROPOSAL
              </span>
              <p className="text-[12px] text-[#6F6B66]">
                Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[12px] text-[#6F6B66]">
                Valid Until: {validUntilDate ? new Date(validUntilDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '30 Days from Issue'}
              </p>
            </div>
          </div>

          {/* Customer & Billing Metadata */}
          <div className="grid grid-cols-2 gap-6 bg-[#FAF9F6] p-5 rounded-[12px] border border-[#E6E1D9]">
            <div>
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block mb-1">
                Prepared For Client
              </span>
              <p className="font-extrabold text-[#171717] text-[15px]">{currentCustomer?.name || 'Customer Account'}</p>
              <p className="text-[#6F6B66] text-[13px] mt-0.5">{currentCustomer?.contact || 'Primary Commercial Contact'}</p>
              <p className="text-[#96918A] font-mono text-[12px]">{currentCustomer?.email || 'billing@clientcorp.com'}</p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block mb-1">
                Commercial Terms
              </span>
              <p className="font-bold text-[#171717]">Standard Net-30 Terms</p>
              <p className="text-[#6F6B66]">Currency: INR (₹)</p>
              <p className="text-[#3F8F63] font-semibold mt-0.5">Tier Pre-Approved Pricing</p>
            </div>
          </div>

          {/* Commercial Line Items Table */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-semibold text-[#171717] uppercase tracking-wider">
              Deliverables & Pricing Schedule
            </h4>

            <div className="border border-[#E6E1D9] rounded-[12px] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] text-[11px] font-semibold text-[#96918A] uppercase border-b border-[#E6E1D9]">
                    <th className="py-3 px-4">Item / Description</th>
                    <th className="py-3 px-3 text-center w-20">Qty</th>
                    <th className="py-3 px-4 text-right w-32">Unit Price</th>
                    <th className="py-3 px-4 text-right w-28">Discount</th>
                    <th className="py-3 px-4 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAE4]">
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity || 1);
                    const price = Number(item.unitPrice || 0);
                    const disc = Number(item.discountPercentage || 0);
                    const lineTotal = (qty * price) * (1 - disc / 100);

                    return (
                      <tr key={idx} className="hover:bg-[#FAF9F6] text-[13px]">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#171717]">{item.productName}</p>
                          <p className="text-[11px] font-mono text-[#96918A]">{item.sku} &bull; {item.category}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#171717]">{qty}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[#171717]">₹{price.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right text-[#C95757] font-semibold">{disc > 0 ? `${disc}%` : '—'}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#171717]">
                          ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          {item.isSubscription && <span className="text-[11px] font-normal text-[#C96648] block">/month</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Hybrid Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="bg-[#FAF9F6] p-4 rounded-[12px] border border-[#E6E1D9] w-full sm:max-w-xs space-y-1.5">
              <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                Billing Allocation
              </span>
              <div className="flex justify-between text-[#6F6B66]">
                <span>One-Time Initial:</span>
                <span className="font-semibold text-[#171717]">₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-[#C96648]">
                <span>Recurring Monthly:</span>
                <span className="font-bold">₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
              </div>
            </div>

            <div className="w-full sm:max-w-xs space-y-2 text-right">
              <div className="flex justify-between text-[#6F6B66]">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-[#171717]">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#C95757]">
                <span>Promotional Discount:</span>
                <span className="font-semibold">{totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0'}</span>
              </div>
              <div className="flex justify-between text-[#6F6B66]">
                <span>GST (18% Standard):</span>
                <span className="font-semibold text-[#171717]">₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t-2 border-[#171717] pt-2.5 flex justify-between items-baseline font-bold text-[#171717]">
                <span className="text-[14px]">Total Proposal Value:</span>
                <span className="text-[20px]">₹{grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="border-t border-[#EEEAE4] pt-4 text-[12px] text-[#96918A] space-y-1">
            <p>1. This commercial proposal constitutes an official quote subject to DealFlow360 standard terms of service.</p>
            <p>2. Hardware delivery subject to inventory availability. Subscription terms commence upon service activation.</p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 text-[13px] font-semibold text-[#171717] bg-white hover:bg-[#F5F2ED] border border-[#E6E1D9] rounded-[9px] transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
