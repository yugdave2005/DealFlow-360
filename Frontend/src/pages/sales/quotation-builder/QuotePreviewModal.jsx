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
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Customer-Facing Commercial Proposal Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Document Body (Clean Customer View) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs bg-white">
          
          {/* Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div>
              <DealFlowLogo size="md" />
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                DealFlow360 Enterprise Solutions Pvt. Ltd.<br />
                Cyber City, Tower B, Level 14<br />
                Gurugram, Haryana - 122002
              </p>
            </div>

            <div className="text-right sm:text-right space-y-1">
              <span className="text-sm font-extrabold text-slate-900 block font-mono">
                COMMERCIAL PROPOSAL
              </span>
              <p className="text-[11px] text-slate-500">
                Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-500">
                Valid Until: {validUntilDate ? new Date(validUntilDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '30 Days from Issue'}
              </p>
            </div>
          </div>

          {/* Customer & Billing Metadata */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Prepared For Client
              </span>
              <p className="font-extrabold text-slate-900 text-sm">{currentCustomer?.name || 'Customer Account'}</p>
              <p className="text-slate-600 mt-0.5">{currentCustomer?.contact || 'Primary Commercial Contact'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{currentCustomer?.email || 'billing@clientcorp.com'}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Commercial Terms
              </span>
              <p className="font-bold text-slate-800">Standard Net-30 Terms</p>
              <p className="text-slate-500">Currency: INR (₹)</p>
              <p className="text-emerald-700 font-semibold mt-0.5">Tier Pre-Approved Pricing</p>
            </div>
          </div>

          {/* Commercial Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Deliverables & Pricing Schedule
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Item / Description</th>
                    <th className="py-2.5 px-2 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                    <th className="py-2.5 px-3 text-right w-24">Discount</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity || 1);
                    const price = Number(item.unitPrice || 0);
                    const disc = Number(item.discountPercentage || 0);
                    const lineTotal = (qty * price) * (1 - disc / 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 text-xs">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{item.sku} &bull; {item.category}</p>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">{qty}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700">₹{price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">{disc > 0 ? `${disc}%` : '—'}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          {item.isSubscription && <span className="text-[10px] font-normal text-purple-700 block">/month</span>}
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
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 w-full sm:max-w-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Billing Allocation
              </span>
              <div className="flex justify-between text-slate-700">
                <span>One-Time Initial:</span>
                <span className="font-bold">₹{oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-purple-800">
                <span>Recurring Monthly:</span>
                <span className="font-extrabold">₹{recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
              </div>
            </div>

            <div className="w-full sm:max-w-xs space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Promotional Discount:</span>
                <span className="font-semibold">{totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% Standard):</span>
                <span className="font-semibold text-slate-800">₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline font-black text-slate-900">
                <span className="text-sm">Total Proposal Value:</span>
                <span className="text-lg">₹{grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 space-y-1">
            <p>1. This commercial proposal constitutes an official quote subject to DealFlow360 standard terms of service.</p>
            <p>2. Hardware delivery subject to inventory availability. Subscription terms commence upon service activation.</p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
