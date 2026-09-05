import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle2, HelpCircle, ArrowRight, CornerDownRight, X, Send } from 'lucide-react';
import DealFlowLogo from '../../components/DealFlowLogo';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/axios';

export default function CustomerQuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');
  
  // Line-level inquiry state
  const [activeLineInquiry, setActiveLineInquiry] = useState(null);
  const [lineCommentText, setLineCommentText] = useState('');

  const customerId = user?.id || user?.customerId || 'bb222222-2222-2222-2222-222222222222';

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['customerQuotation', id, customerId],
    queryFn: async () => {
      const res = await api.get(`/customer-portal/quotations/${id}?customerId=${customerId}`);
      return res.data?.data || res.data;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/customer-portal/quotations/${id}/accept`, { customerId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Quotation Accepted successfully!');
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (reason) => {
      const res = await api.post(`/customer-portal/quotations/${id}/decline`, { 
        customerId,
        reason: reason || 'Declined by customer from portal'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Quotation declined');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to decline quotation');
    }
  });

  const negotiateMutation = useMutation({
    mutationFn: async ({ explicitNotes, discountVal }) => {
      const res = await api.post(`/customer-portal/quotations/${id}/negotiate`, { 
        customerId, 
        notes: explicitNotes || notes, 
        counterDiscount: parseFloat(discountVal !== undefined ? discountVal : counterDiscount) || 0 
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Negotiation request / inquiry submitted to your Sales Rep');
      setNotes('');
      setCounterDiscount('');
      setActiveLineInquiry(null);
      setLineCommentText('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit negotiation');
    }
  });

  const handleLineInquirySubmit = (item) => {
    if (!lineCommentText.trim()) {
      toast.error('Please enter your question or modification request');
      return;
    }
    const combinedNotes = `[Line Item: ${item.product?.name || 'Product'}]: ${lineCommentText.trim()}`;
    negotiateMutation.mutate({
      explicitNotes: combinedNotes,
      discountVal: counterDiscount || 0
    });
  };

  if (isLoading) return <div className="p-12 text-center text-[#78716C]">Loading Quotation Securely...</div>;
  if (isError || !quote) return <div className="p-12 text-center text-rose-600">Quotation not found or you do not have access.</div>;

  const version = quote.activeVersion || quote.versions?.[0];
  const items = version?.items || [];

  // Compute exact subtotal from items (or stored net totalAmount)
  const subtotal = items.length > 0
    ? items.reduce((sum, it) => {
        const qty = Number(it.quantity || 1);
        const unitPrice = Number(it.unitPrice || 0);
        const disc = Number(it.discountPercentage || 0);
        return sum + ((qty * unitPrice) * (1 - disc / 100));
      }, 0)
    : Number(version?.totalAmount || 0);

  const taxAmount = subtotal * 0.18;
  const totalAgreed = subtotal + taxAmount;

  const statusColors = { 
    SENT: 'bg-[#F5EFEB] text-[#1E1B18] border border-[#E8DFD8]', 
    NEGOTIATION: 'bg-amber-50 text-amber-800 border border-amber-200', 
    CONFIRMED: 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <DealFlowLogo variant="light" size="lg" />
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#F5EFEB] text-[#44403C] rounded-full border border-[#E8DFD8]">Customer Portal</span>
          </div>
          <button onClick={() => navigate('/')} className="text-xs font-semibold text-[#78716C] hover:text-[#1E1B18] transition-colors cursor-pointer">Return to workspace</button>
        </div>

        <div className="bg-[#FFFFFF] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#EBE8E2] overflow-hidden mb-6">
          <div className="bg-[#1E1B18] px-8 py-6 flex justify-between items-center">
            <div>
              <p className="text-[#A8A29E] text-xs font-semibold tracking-wider uppercase mb-1">Proposal For</p>
              <h2 className="text-2xl font-bold text-white">Your Organization</h2>
            </div>
            <div className="text-right">
              <span className={`px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${statusColors[quote.status] || 'bg-[#F5EFEB] text-[#1E1B18]'}`}>
                {quote.status}
              </span>
              <p className="text-[#A8A29E] text-xs mt-2 font-mono">Ref: {quote.quotationNumber}</p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between border-b border-[#EBE8E2] pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1E1B18]">Commercial Line Items</h3>
                <p className="text-xs text-[#78716C]">Review items or click the comment tool on any line to ask questions</p>
              </div>
            </div>

            {/* Line items with line-level commenting tool */}
            <div className="space-y-3 mb-8">
              {items.map((item, idx) => {
                const qty = Number(item.quantity || 1);
                const unitPrice = Number(item.unitPrice || 0);
                const disc = Number(item.discountPercentage || 0);
                const lineTotal = (qty * unitPrice) * (1 - disc / 100);
                const isInquiring = activeLineInquiry === idx;

                return (
                  <div key={item.id || idx} className="rounded-2xl bg-[#FAF8F5] border border-[#EBE8E2] p-4 space-y-3 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#1E1B18] text-base">{item.product?.name || item.productName || item.name || `Item #${idx + 1}`}</p>
                        <p className="text-xs text-[#78716C] mt-0.5">
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
                          <p className="font-extrabold text-[#1E1B18] text-lg">₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        {quote.status === 'SENT' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isInquiring) {
                                setActiveLineInquiry(null);
                              } else {
                                setActiveLineInquiry(idx);
                                setLineCommentText('');
                              }
                            }}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              isInquiring 
                                ? 'bg-[#1E1B18] text-white' 
                                : 'bg-[#FFFFFF] text-[#78716C] hover:text-[#1E1B18] border border-[#EBE8E2]'
                            }`}
                            title="Ask question or request line change"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Comment</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Line Inquiry Inline Input */}
                    {isInquiring && (
                      <div className="pt-2 border-t border-[#EBE8E2] space-y-2 bg-[#FFFFFF] p-3 rounded-xl">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1E1B18]">
                          <span className="flex items-center gap-1.5 text-[#B85D19]">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Ask question or request change for {item.product?.name || 'this line'}:
                          </span>
                          <button onClick={() => setActiveLineInquiry(null)} className="text-[#A8A29E] hover:text-[#1E1B18]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Can we adjust quantity to 15 or bundle setup support?"
                          value={lineCommentText}
                          onChange={(e) => setLineCommentText(e.target.value)}
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#EBE8E2] rounded-xl text-xs text-[#1E1B18] focus:outline-none focus:border-[#B85D19]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveLineInquiry(null)}
                            className="px-3 py-1.5 text-xs text-[#78716C] hover:bg-[#FAF8F5] rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLineInquirySubmit(item)}
                            disabled={negotiateMutation.isPending}
                            className="px-3.5 py-1.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>{negotiateMutation.isPending ? 'Submitting...' : 'Send Line Inquiry'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hybrid Billing Breakdown */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EBE8E2] p-5 mb-8 space-y-3">
              <h4 className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Billing Structure</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#EBE8E2]">
                  <span className="text-xs text-[#78716C] block font-medium">One-Time Hardware & Services</span>
                  <span className="text-lg font-bold text-[#1E1B18]">
                    ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#EBE8E2]">
                  <span className="text-xs text-[#78716C] block font-medium">Estimated Taxes (18% GST)</span>
                  <span className="text-lg font-bold text-[#1E1B18]">
                    ₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-[#EBE8E2] pt-6 mb-8">
              <div>
                <p className="text-xs text-[#A8A29E] uppercase font-semibold">Terms Validity</p>
                <p className="text-sm text-[#44403C] font-medium">Valid for 30 days from proposal date</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider mb-1">Total Agreed Value</p>
                <p className="text-4xl sm:text-5xl font-black text-[#1E1B18] tracking-tight">
                  <span className="text-2xl text-[#A8A29E] mr-1">₹</span>
                  {totalAgreed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {quote.status === 'SENT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EBE8E2]">
                <div className="space-y-3">
                  <h4 className="font-bold text-[#1E1B18] text-sm">Request Terms Revision / Counter-Offer</h4>
                  <p className="text-xs text-[#78716C]">Submit proposed adjustments or requested commercial discount concession.</p>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Provide comments or requested scope/quantity adjustment..."
                    className="w-full p-3 rounded-xl border border-[#EBE8E2] text-xs bg-[#FFFFFF] text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                    rows="3"
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] mb-1">Proposed Counter Discount (%)</label>
                    <input 
                      type="number" value={counterDiscount} onChange={e => setCounterDiscount(e.target.value)}
                      placeholder="e.g. 20" 
                      className="w-full p-2.5 rounded-xl border border-[#EBE8E2] text-xs bg-[#FFFFFF] text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                    />
                  </div>
                  <button 
                    onClick={() => negotiateMutation.mutate({})} disabled={negotiateMutation.isPending}
                    className="w-full bg-[#FFFFFF] border border-[#EBE8E2] text-[#1E1B18] font-bold py-2.5 px-4 rounded-xl hover:bg-[#F5EFEB] transition-colors shadow-xs text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {negotiateMutation.isPending ? 'Submitting...' : 'Submit Negotiation Request'}
                  </button>
                </div>
                
                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#EBE8E2] md:pl-6 pt-4 md:pt-0 text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-[#1E1B18] text-base">Accept & Confirm Proposal</h4>
                    <p className="text-xs text-[#78716C] mt-1">By confirming, this quotation converts into an active order dispatched for fulfillment.</p>
                  </div>
                  <button 
                    onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
                    className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {acceptMutation.isPending ? 'Confirming...' : 'Accept & Confirm Quotation'}
                  </button>

                  <div className="pt-2 border-t border-[#EBE8E2]">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to decline this commercial proposal?')) {
                          declineMutation.mutate('Customer declined terms from portal');
                        }
                      }}
                      disabled={declineMutation.isPending}
                      className="text-xs font-semibold text-[#A8A29E] hover:text-[#C95757] transition-colors cursor-pointer"
                    >
                      {declineMutation.isPending ? 'Declining...' : 'Decline this proposal'}
                    </button>
                  </div>
                </div>
              </div>

            ) : quote.status === 'NEGOTIATION' || quote.status === 'PENDING_APPROVAL' ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-1">
                 <h4 className="font-bold text-amber-900 text-lg">Counter-Offer Submitted</h4>
                 <p className="text-xs text-amber-700">Your negotiation request is currently under review by your Sales Representative & Governance Team.</p>
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
