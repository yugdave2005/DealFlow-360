import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  Building,
  ArrowRight,
  Inbox
} from 'lucide-react';
import { api } from '../../lib/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerPortalDashboard() {
  const navigate = useNavigate();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['customerPortalQuotations'],
    queryFn: async () => {
      try {
        const res = await api.get('/customer-portal/quotations');
        return res.data?.data || res.data || [];
      } catch (e) {
        const fallback = await api.get('/quotations').catch(() => ({ data: { data: [] } }));
        return fallback.data?.data || fallback.data || [];
      }
    }
  });

  const quotesList = Array.isArray(quotations) ? quotations : [];
  const activeQuotations = quotesList.filter(q => !['CANCELLED', 'REJECTED'].includes(q.status));
  const pendingNegotiations = quotesList.filter(q => ['UNDER_NEGOTIATION', 'NEGOTIATION', 'PENDING_APPROVAL'].includes(q.status));
  const confirmedOrders = quotesList.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status));
  
  const outstandingBalance = confirmedOrders.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
  }, 0);

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
          <p className="text-2xl font-bold text-slate-900">{activeQuotations.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Commercial proposals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Negotiations</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingNegotiations.length}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 block">Under review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{confirmedOrders.length}</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">In fulfillment dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{outstandingBalance.toLocaleString('en-IN')}</p>
          <span className="text-xs text-slate-400 mt-1 block">Confirmed deals total</span>
        </div>
      </div>

      {/* Quotation Reviews & Actions */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Active Quotations</h3>
            <p className="text-xs text-slate-500">Commercial proposals submitted by your sales representative</p>
          </div>
          <button 
            onClick={() => navigate('/customer/quotations')}
            className="text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1"
          >
            <span>View All ({quotesList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={2} />
        ) : quotesList.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-100">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No active quotations found</p>
            <p className="text-xs text-slate-400 mt-0.5">When your account representative issues a proposal, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotesList.slice(0, 5).map(quote => {
              const v = quote.activeVersion || (quote.versions && quote.versions[0]) || {};
              const total = Number(v.totalAmount || quote.totalAmount || 0);
              const discount = Number(v.totalDiscount || 0);
              return (
                <div 
                  key={quote.id} 
                  className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{quote.quotationNumber || `QT-${quote.id.slice(0,6)}`}</span>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="text-xs text-slate-500">
                      <span>Created: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'Recent'}</span>
                      {discount > 0 && <span className="ml-3 font-semibold text-emerald-700">₹{discount.toLocaleString('en-IN')} Discount Applied</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Amount</span>
                      <span className="text-base font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</span>
                    </div>

                    <button
                      onClick={() => navigate(`/customer/quotations/${quote.id}`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Review Proposal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
