import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  CornerDownRight, 
  X, 
  Send, 
  Download, 
  CreditCard, 
  Receipt, 
  Zap, 
  IndianRupee,
  Clock
} from 'lucide-react';
import DealFlowLogo from '../../components/DealFlowLogo';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/axios';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { downloadQuotationPDF, downloadInvoicePDF } from '../../utils/pdfGenerator';

const PAYMENT_METHODS = [
  { id: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)', icon: '🏦' },
  { id: 'UPI', label: 'UPI Payment', icon: '📱' },
  { id: 'CREDIT_CARD', label: 'Corporate Card', icon: '💳' },
  { id: 'CHEQUE', label: 'Cheque', icon: '📄' }
];

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

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');

  const customerId = user?.id || user?.customerId || 'bb222222-2222-2222-2222-222222222222';

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['customerQuotation', id, customerId],
    queryFn: async () => {
      const res = await quotationsApi.getCustomerQuotationById(id, customerId);
      return res.data?.data || res.data;
    }
  });

  // Fetch customer invoices to link payment directly
  const { data: customerInvoices = [] } = useQuery({
    queryKey: ['customerInvoices', customerId],
    queryFn: async () => {
      const res = await api.get(`/customer-portal/invoices?customerId=${customerId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!customerId
  });

  // Match invoice for this quotation / order
  const matchedInvoice = customerInvoices.find(
    inv => inv.quotationNumber === quote?.quotationNumber || inv.order?.quotationId === quote?.id || inv.orderId === quote?.order?.id
  ) || customerInvoices[0];

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await quotationsApi.acceptQuotation(id, { customerId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      queryClient.invalidateQueries({ queryKey: ['customerInvoices', customerId] });
      toast.success('Quotation Accepted successfully! Tax Invoice is generated.');
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
      toast.success('Quotation declined.');
    }
  });

  const negotiateMutation = useMutation({
    mutationFn: async ({ explicitNotes, discountVal }) => {
      const discountToSubmit = discountVal !== undefined ? discountVal : (Number(counterDiscount) || 0);
      const notesToSubmit = explicitNotes || notes;
      
      const res = await api.post(`/customer-portal/quotations/${id}/negotiate`, {
        customerId,
        proposedDiscountPercentage: Number(discountToSubmit),
        notes: notesToSubmit
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success(data?.data?.message || 'Revision request submitted to sales team!');
      setNotes('');
      setCounterDiscount('');
      setActiveLineInquiry(null);
      setLineCommentText('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit negotiation request');
    }
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async () => {
      let invId = matchedInvoice?.id;
      if (!invId) {
        const resInvoices = await api.get(`/customer-portal/invoices?customerId=${customerId}`);
        const list = resInvoices.data?.data || resInvoices.data || [];
        const found = list.find(inv => 
          inv.quotationNumber === quote?.quotationNumber || 
          inv.order?.quotationId === quote?.id || 
          inv.orderId === quote?.order?.id
        ) || list[0];
        if (found) invId = found.id;
      }
      if (!invId) {
        throw new Error('Invoice is being generated for this quotation. Please check back in a moment or visit Invoices.');
      }
      const res = await api.post(`/customer-portal/invoices/${invId}/pay`, {
        customerId,
        paymentMethod,
        reference: payRef || undefined
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      queryClient.invalidateQueries({ queryKey: ['customerInvoices', customerId] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      toast.success('Payment recorded successfully for Quotation!');
      setPayModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Payment failed')
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
          <button onClick={() => navigate('/portal/invoices')} className="text-xs font-semibold text-[#78716C] hover:text-[#1E1B18] transition-colors cursor-pointer">
            View All Invoices & Payments &rarr;
          </button>
        </div>

        <div className="bg-[#FFFFFF] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#EBE8E2] overflow-hidden mb-6">
          <div className="bg-[#1E1B18] px-8 py-6 flex justify-between items-center">
            <div>
              <p className="text-[#A8A29E] text-xs font-semibold tracking-wider uppercase mb-1">Proposal For</p>
              <h2 className="text-2xl font-bold text-white">{quote?.customer?.companyName || quote?.customer?.name || 'Your Organization'}</h2>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadQuotationPDF(quote);
                    toast.success('Downloaded official proposal PDF');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#EBE8E2] text-xs font-bold text-[#1E1B18] rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Download Official PDF Proposal"
                >
                  <Download className="w-3.5 h-3.5 text-[#B85D19]" />
                  Download PDF
                </button>
              </div>
            </div>

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
                        <div>
                          {disc > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mr-2">
                              {disc}% OFF
                            </span>
                          )}
                          <span className="font-bold text-[#1E1B18] text-lg">
                            ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {quote.status === 'SENT' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLineInquiry(isInquiring ? null : idx);
                              setLineCommentText('');
                            }}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isInquiring
                                ? 'bg-[#B85D19] text-white border-[#B85D19]'
                                : 'bg-white text-[#78716C] hover:text-[#1E1B18] border-[#EBE8E2]'
                            }`}
                            title="Ask question or propose change for this item"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isInquiring && (
                      <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#B85D19]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#B85D19] flex items-center gap-1">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Ask question / request modification for "{item.product?.name || 'this item'}"
                          </span>
                          <button onClick={() => setActiveLineInquiry(null)} className="text-[#A8A29E] hover:text-[#1E1B18] p-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          value={lineCommentText}
                          onChange={(e) => setLineCommentText(e.target.value)}
                          placeholder="e.g. Can we increase warranty, bundle accessories, or adjust quantity to 5 units?"
                          className="w-full p-2.5 rounded-lg border border-[#EBE8E2] text-xs text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20"
                          rows="2"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveLineInquiry(null)}
                            className="px-3 py-1.5 text-xs text-[#78716C] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLineInquirySubmit(item)}
                            disabled={negotiateMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>{negotiateMutation.isPending ? 'Sending...' : 'Send Inquiry'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EBE8E2] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs text-[#A8A29E] uppercase font-semibold">Terms Validity</p>
                <p className="text-sm text-[#44403C] font-medium">Valid for 30 days from proposal date</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider mb-1">Total Agreed Value</p>
                <p className="text-4xl font-black text-[#1E1B18] tracking-tight">₹{totalAgreed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {quote.status === 'SENT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EBE8E2]">
                <div className="space-y-3">
                  <h4 className="font-bold text-[#1E1B18] text-sm">Request Terms Revision</h4>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Provide comments or requested scope/quantity adjustment..."
                    className="w-full p-3 rounded-xl border border-[#EBE8E2] text-xs bg-[#FFFFFF] text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20"
                    rows="3"
                  />
                  <input 
                    type="number" value={counterDiscount} onChange={e => setCounterDiscount(e.target.value)}
                    placeholder="Proposed Discount (%)" 
                    className="w-full p-2.5 rounded-xl border border-[#EBE8E2] text-xs bg-[#FFFFFF] text-[#1E1B18]"
                  />
                  <button 
                    onClick={() => negotiateMutation.mutate({})} disabled={negotiateMutation.isPending}
                    className="w-full bg-[#FFFFFF] border border-[#EBE8E2] text-[#1E1B18] font-bold py-2.5 rounded-xl text-xs hover:bg-[#F5EFEB] cursor-pointer"
                  >
                    Submit Negotiation
                  </button>
                </div>
                
                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#EBE8E2] md:pl-6 pt-4 md:pt-0 space-y-4">
                  <button 
                    onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
                    className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer"
                  >
                    Accept & Confirm
                  </button>
                  <button
                    onClick={() => declineMutation.mutate()}
                    className="text-xs font-semibold text-[#A8A29E] hover:text-[#C95757] w-full text-center cursor-pointer"
                  >
                    Decline proposal
                  </button>
                </div>
              </div>

            ) : quote.status === 'NEGOTIATION' ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-1">
                 <h4 className="font-bold text-amber-900 text-lg">Counter-Offer Submitted</h4>
                 <p className="text-xs text-amber-700">Under review by your Sales Representative.</p>
               </div>
            ) : quote.status === 'CONFIRMED' ? (
               <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-4">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                   <div>
                     <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                       <h4 className="font-bold text-emerald-900 text-lg">Proposal Confirmed & Invoice Ready</h4>
                     </div>
                     <p className="text-xs text-emerald-800 mt-1">
                       Order has been confirmed. You can now pay the quotation invoice directly online.
                     </p>
                   </div>

                   <div className="flex items-center gap-2 flex-wrap">
                     {matchedInvoice && (
                       <button
                         onClick={() => {
                           downloadInvoicePDF(matchedInvoice);
                           toast.success('Downloaded Tax Invoice PDF');
                         }}
                         className="px-3 py-2 bg-white text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                       >
                         <Download className="w-3.5 h-3.5 text-[#B85D19]" />
                         Tax Invoice PDF
                       </button>
                     )}

                     <button
                       onClick={() => setPayModalOpen(true)}
                       className="px-4 py-2 bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                     >
                       <CreditCard className="w-3.5 h-3.5" />
                       Pay Quotation (₹{totalAgreed.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                     </button>
                   </div>
                 </div>
               </div>
            ) : null}
            
          </div>
        </div>
      </div>

      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#EBE8E2] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#B85D19] uppercase tracking-wider">Direct Quotation Settlement</span>
                <h3 className="text-lg font-bold text-[#1E1B18] mt-0.5">Pay for {quote.quotationNumber}</h3>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="p-1.5 text-[#78716C] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-[#FBF9F7] rounded-xl border border-[#EBE8E2] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#A8A29E] uppercase">Total Amount Due</span>
                <div className="text-2xl font-black text-[#1E1B18] mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />{totalAgreed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <button onClick={() => { setPayRef(`QUICK-${Math.floor(100000 + Math.random() * 900000)}`); setPaymentMethod('UPI'); toast.info('⚡ Auto-filled for quick testing'); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                <Zap className="w-3 h-3" />Quick Fill
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${paymentMethod === m.id ? 'border-[#B85D19] bg-[#F5EFEB] ring-1 ring-[#B85D19]' : 'border-[#EBE8E2] bg-white hover:bg-[#FAF8F5]'}`}>
                    <span className="text-base">{m.icon}</span>
                    <span className="block font-semibold text-[#1E1B18] mt-1 leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Transaction Reference <span className="text-[#A8A29E] font-normal">(optional)</span></label>
              <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. UTR123456789 / Cheque No."
                className="w-full px-3 py-2.5 text-xs bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]" />
            </div>

            <div className="flex gap-2 pt-1 border-t border-[#EBE8E2]">
              <button onClick={() => setPayModalOpen(false)} className="flex-1 py-2.5 text-xs font-semibold text-[#78716C] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button onClick={() => payInvoiceMutation.mutate()}
                disabled={payInvoiceMutation.isPending}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50">
                {payInvoiceMutation.isPending ? 'Processing...' : 'Confirm Quotation Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
