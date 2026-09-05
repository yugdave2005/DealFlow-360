import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DealFlowLogo from '../../components/DealFlowLogo';

const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/customer-portal`;

export default function CustomerQuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');

  // Hardcode a mock customer ID for the purpose of the hackathon / demo
  const mockCustomerId = 'bb222222-2222-2222-2222-222222222222';

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['customerQuotation', id],
    queryFn: async () => {
      const res = await fetch(`${API}/quotations/${id}?customerId=${mockCustomerId}`);
      if (!res.ok) throw new Error('Failed to fetch quotation');
      return (await res.json()).data;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/quotations/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: mockCustomerId })
      });
      if (!res.ok) throw new Error('Acceptance failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', id] });
      toast.success('Quotation Accepted successfully!');
    }
  });

  const negotiateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/quotations/${id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: mockCustomerId, notes, counterDiscount: parseFloat(counterDiscount) || 0 })
      });
      if (!res.ok) throw new Error('Negotiation failed');
      return res.json();
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
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Line Items</h3>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{item.productId.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-slate-500">{item.quantity} x ₹{parseFloat(item.unitPrice).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-lg">₹{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    {item.discountPercentage > 0 && <span className="text-xs font-bold text-red-500 px-2 py-0.5 bg-red-50 rounded-md">-{item.discountPercentage}% off</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end border-t border-slate-100 pt-6 mb-8">
              <p className="text-slate-500 font-medium">Valid until: {new Date(quote.validUntil).toLocaleDateString()}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Agreed Value</p>
                <p className="text-5xl font-black text-slate-900 tracking-tight">
                  <span className="text-2xl text-slate-400 mr-1">₹</span>
                  {parseFloat(version?.totalAmount - version?.totalDiscount).toLocaleString()}
                </p>
              </div>
            </div>

            {(quote.status === 'SENT' || quote.status === 'NEGOTIATION') ? (
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Request Adjustment</h4>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="We'd like to proceed, but can we adjust the terms slightly?"
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows="3"
                  />
                  <input 
                    type="number" value={counterDiscount} onChange={e => setCounterDiscount(e.target.value)}
                    placeholder="Target total discount amount (₹)" 
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button 
                    onClick={() => negotiateMutation.mutate()} disabled={negotiateMutation.isPending}
                    className="w-full bg-white border border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Submit Counter-offer
                  </button>
                </div>
                
                <div className="flex flex-col justify-center border-l border-slate-200 pl-6 text-center">
                  <h4 className="font-bold text-slate-800 mb-2">Ready to proceed?</h4>
                  <p className="text-sm text-slate-500 mb-6">By accepting, this proposal converts to an active order.</p>
                  <button 
                    onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? 'Processing...' : 'Accept Proposal'}
                  </button>
                </div>
              </div>
            ) : (
               <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
                 <h4 className="font-bold text-green-800 text-xl mb-1">Proposal Confirmed</h4>
                 <p className="text-green-700">Thank you for your business. Our team is processing your order.</p>
               </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
