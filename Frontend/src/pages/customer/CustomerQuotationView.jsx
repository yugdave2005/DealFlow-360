import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DealFlowLogo from '../../components/DealFlowLogo';
import { useAuth } from '../../context/AuthContext';

import { api } from '../../lib/axios';
import { quotationsApi } from '../../features/quotations/quotations.api';

export default function CustomerQuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');

  const customerId = user?.id || user?.customerId || 'bb222222-2222-2222-2222-222222222222';

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['customerQuotation', id, customerId],
    queryFn: async () => {
      const res = await quotationsApi.getCustomerQuotationById(id, customerId);
      return res.data?.data || res.data;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await quotationsApi.acceptQuotation(id, { customerId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Quotation Accepted successfully!');
    }
  });

  const negotiateMutation = useMutation({
    mutationFn: async () => {
      const res = await quotationsApi.negotiateQuotation(id, { 
        customerId, 
        notes, 
        counterDiscount: parseFloat(counterDiscount) || 0 
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Negotiation request submitted');
      setNotes('');
      setCounterDiscount('');
    }
  });

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading Quotation Securely...</div>;
  if (isError || !quote) return <div className="p-12 text-center text-red-500">Quotation not found or you do not have access.</div>;

  const version = quote.versions?.[0];
  const items = version?.items || [];
  const statusColors = { 
    SENT: 'bg-slate-100 text-slate-700 border border-slate-200', 
    NEGOTIATION: 'bg-amber-50 text-amber-700 border border-amber-200', 
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <DealFlowLogo variant="light" size="lg" />
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">Customer Portal</span>
          </div>
          <button onClick={() => navigate('/')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">Return to workspace</button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-6">
          <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-1">Proposal For</p>
              <h2 className="text-2xl font-bold text-white">Your Organization</h2>
            </div>
            <div className="text-right">
              <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${statusColors[quote.status] || 'bg-slate-100 text-slate-700'}`}>
                {quote.status}
              </span>
              <p className="text-slate-400 text-xs mt-2">Ref: {quote.quotationNumber}</p>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Commercial Line Items</h3>
            <div className="space-y-3 mb-8">
              {items.map((item, idx) => {
                const qty = Number(item.quantity || 1);
                const unitPrice = Number(item.unitPrice || 0);
                const disc = Number(item.discountPercentage || 0);
                const lineTotal = (qty * unitPrice) * (1 - disc / 100);

                return (
                  <div key={item.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-base">{item.product?.name || item.productName || `Item #${idx + 1}`}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {qty} units &times; ₹{unitPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right">
                      {disc > 0 && (
                        <span className="text-xs font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                          -{disc}% Discount Applied
                        </span>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-900 text-lg">₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hybrid Billing Breakdown */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 mb-8 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Structure</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-xs text-slate-500 block font-medium">One-Time Hardware & Services</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{(Number(version?.totalAmount || 0) - Number(version?.totalDiscount || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-xs text-slate-500 block font-medium">Estimated Taxes (18% GST)</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{((Number(version?.totalAmount || 0) - Number(version?.totalDiscount || 0)) * 0.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-slate-200 pt-6 mb-8">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Terms Validity</p>
                <p className="text-sm text-slate-700 font-medium">Valid for 30 days from proposal date</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Agreed Value</p>
                <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  <span className="text-2xl text-slate-400 mr-1">₹</span>
                  {((Number(version?.totalAmount || 0) - Number(version?.totalDiscount || 0)) * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {quote.status === 'SENT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Request Terms Revision / Counter-Offer</h4>
                  <p className="text-xs text-slate-500">Submit proposed adjustments or requested commercial discount concession.</p>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Provide comments or requested scope/quantity adjustment..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                    rows="3"
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Proposed Counter Discount (%)</label>
                    <input 
                      type="number" value={counterDiscount} onChange={e => setCounterDiscount(e.target.value)}
                      placeholder="e.g. 20" 
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                    />
                  </div>
                  <button 
                    onClick={() => negotiateMutation.mutate()} disabled={negotiateMutation.isPending}
                    className="w-full bg-white border border-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors shadow-xs text-xs disabled:opacity-50"
                  >
                    {negotiateMutation.isPending ? 'Submitting...' : 'Submit Negotiation Request'}
                  </button>
                </div>
                
                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0 text-center space-y-3">
                  <h4 className="font-bold text-slate-900 text-base">Accept & Confirm Proposal</h4>
                  <p className="text-xs text-slate-500">By confirming, this quotation converts into an active order dispatched for fulfillment.</p>
                  <button 
                    onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? 'Confirming...' : 'Accept & Confirm Quotation'}
                  </button>
                </div>
              </div>
            ) : quote.status === 'NEGOTIATION' ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-1">
                 <h4 className="font-bold text-amber-900 text-lg">Counter-Offer Submitted</h4>
                 <p className="text-xs text-amber-700">Your negotiation request is currently under review by your Sales Representative.</p>
               </div>
            ) : quote.status === 'CONFIRMED' ? (
               <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-1">
                 <h4 className="font-bold text-emerald-900 text-lg">Proposal Confirmed & Active</h4>
                 <p className="text-xs text-emerald-700">Thank you for your business. Our operations team is processing fulfillment and order dispatch.</p>
               </div>
            ) : null}
            
          </div>
        </div>
      </div>
    </div>
  );
}
