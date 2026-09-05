import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  ExternalLink,
  CheckCircle2, 
  Clock, 
  Building,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function CustomerPortalDashboard() {
  const navigate = useNavigate();

  const customerQuotes = [
    {
      id: 'qt-1024',
      quoteNumber: 'QT-1024',
      title: 'Enterprise Rack Servers & Managed Cloud Suite',
      totalAmount: 124000,
      discount: '18% Applied',
      status: 'UNDER_NEGOTIATION',
      validUntil: '30 Sep 2026',
      itemsCount: 3,
      hasPendingCounter: true
    },
    {
      id: 'qt-1018',
      quoteNumber: 'QT-1018',
      title: 'Annual SLA Dedicated Infrastructure Support',
      totalAmount: 85000,
      discount: '10% Applied',
      status: 'CONFIRMED',
      validUntil: '15 Oct 2026',
      itemsCount: 1,
      hasPendingCounter: false
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Client Workspace
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Review active quotations, submit counter proposals & confirm orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Quotations</span>
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">2</p>
          <span className="text-xs text-slate-400 mt-1 block">Commercial proposals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Negotiations</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">1</p>
          <span className="text-xs text-amber-600 font-medium mt-1 block">Counter-request submitted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">1</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">In fulfillment dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹1,24,000</p>
          <span className="text-xs text-slate-400 mt-1 block">Invoice net 30 terms</span>
        </div>
      </div>

      {/* Customer Quotations List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Your Active Commercial Proposals</h3>
        </div>

        <div className="space-y-4">
          {customerQuotes.map(quote => (
            <div key={quote.id} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 text-sm">{quote.quoteNumber}</span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mt-1">{quote.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{quote.itemsCount} line items · Valid until {quote.validUntil}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium uppercase">Commercial Total</span>
                  <p className="text-2xl font-extrabold text-slate-900">₹{quote.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                {quote.hasPendingCounter ? (
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Your counter-discount request is currently being reviewed by sales leadership.</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Ready for your commercial review and line-item sign-off.
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/customer/quotation/${quote.id}`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Proposal & Counter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
