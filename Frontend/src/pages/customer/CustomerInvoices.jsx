import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileText, CreditCard, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Zap, X, IndianRupee, Package, Hash, Download
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';

const STATUS_META = {
  PAID:    { label: 'Paid',    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-800 border-amber-200',       icon: Clock },
  SENT:    { label: 'Due',     color: 'bg-blue-100 text-blue-800 border-blue-200',           icon: FileText },
  DRAFT:   { label: 'Pending', color: 'bg-slate-100 text-slate-700 border-slate-200',        icon: Clock },
  OVERDUE: { label: 'Overdue', color: 'bg-rose-100 text-rose-800 border-rose-200',           icon: AlertCircle },
};

const PAYMENT_METHODS = [
  { id: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)', icon: '🏦' },
  { id: 'UPI',           label: 'UPI Payment',               icon: '📱' },
  { id: 'CREDIT_CARD',   label: 'Credit Card',               icon: '💳' },
  { id: 'CHEQUE',        label: 'Cheque',                    icon: '📄' },
];

export default function CustomerInvoices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const customerId = user?.id || user?.customerId;

  const [payModalInvoice, setPayModalInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['customerInvoices', customerId],
    queryFn: async () => {
      const res = await api.get(`/customer-portal/invoices?customerId=${customerId}`);
      return res.data?.data || res.data || [];
    }
  });

  const payMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, reference }) => {
      const res = await api.post(`/customer-portal/invoices/${invoiceId}/pay`, {
        customerId, paymentMethod, reference: reference || undefined
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerInvoices', customerId] });
      toast.success('✅ Payment recorded successfully!');
      setPayModalInvoice(null);
      setPayRef('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed')
  });

  const openPayModal = (inv) => { setPayModalInvoice(inv); setPayMethod('BANK_TRANSFER'); setPayRef(''); };

  const summary = {
    total:    invoices.length,
    paid:     invoices.filter(i => i.status === 'PAID').length,
    due:      invoices.filter(i => ['SENT','PARTIAL','OVERDUE'].includes(i.status)).length,
    totalDue: invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.amountRemaining || 0), 0)
  };

  if (isLoading) return (
    <div className="p-8 space-y-4 max-w-4xl mx-auto">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-[#F5F2ED] rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 sm:p-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E1B18] tracking-tight">My Invoices & Payments</h1>
        <p className="text-sm text-[#78716C] mt-1">View and pay outstanding invoices for your orders</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices',      value: summary.total,    color: 'text-[#1E1B18]' },
          { label: 'Paid',                value: summary.paid,     color: 'text-emerald-700' },
          { label: 'Awaiting Payment',    value: summary.due,      color: 'text-amber-700' },
          { label: 'Amount Due',          value: `₹${summary.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-rose-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-[#EBE8E2] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider block">{card.label}</span>
            <span className={`text-xl font-black mt-1 block ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EBE8E2]">
          <FileText className="w-10 h-10 text-[#D1CCC5] mx-auto mb-3" />
          <h3 className="font-bold text-[#1E1B18]">No Invoices Yet</h3>
          <p className="text-sm text-[#78716C] mt-1">Invoices will appear here once your orders are confirmed and fulfilled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const meta = STATUS_META[inv.status] || STATUS_META['DRAFT'];
            const StatusIcon = meta.icon;
            const isExpanded = expandedId === inv.id;
            const isDue = !['PAID'].includes(inv.status);
            const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';

            return (
              <div key={inv.id} className={`bg-white rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${isOverdue ? 'border-rose-200' : 'border-[#EBE8E2]'}`}>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#1E1B18]">{inv.invoiceNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />{meta.label}
                      </span>
                      {isOverdue && <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">OVERDUE</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#78716C]">
                      {inv.orderNumber && <span className="flex items-center gap-1"><Package className="w-3 h-3" />Order: {inv.orderNumber}</span>}
                      {inv.quotationNumber && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Quote: {inv.quotationNumber}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due: {dueDate}</span>
                    </div>
                    {inv.itemsSummary && <p className="text-[11px] text-[#A8A29E] mt-1 truncate max-w-sm">{inv.itemsSummary}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-[#1E1B18]">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</div>
                      {inv.status === 'PARTIAL' && <div className="text-xs text-amber-700 font-semibold">₹{Number(inv.amountRemaining || 0).toLocaleString('en-IN')} remaining</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          downloadInvoicePDF(inv);
                          toast.success(`Downloaded Invoice PDF for ${inv.invoiceNumber}`);
                        }}
                        className="p-2 text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer"
                        title="Download Tax Invoice PDF"
                      >
                        <Download className="w-4 h-4 text-[#B85D19]" />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : inv.id)} className="p-1.5 text-[#78716C] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isDue && (
                        <button onClick={() => openPayModal(inv)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
                          <CreditCard className="w-3.5 h-3.5" />Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#EBE8E2] bg-[#FAF8F5] p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Payment History</h4>
                    {(inv.payments || []).length === 0 ? (
                      <p className="text-xs text-[#A8A29E]">No payments recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {inv.payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded-xl border border-[#EBE8E2] px-3 py-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-mono text-[#A8A29E]">{p.reference || '—'}</span>
                              <span className="text-[#78716C]">{p.paymentMethod?.replace('_', ' ')}</span>
                            </div>
                            <span className="font-bold text-emerald-700">+₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-semibold pt-1 border-t border-[#EBE8E2] text-[#44403C]">
                      <span>Total: ₹{Number(inv.amount).toLocaleString('en-IN')}</span>
                      <span>Paid: ₹{Number(inv.amountPaid || 0).toLocaleString('en-IN')}</span>
                      <span className={inv.amountRemaining > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {inv.amountRemaining > 0 ? `Due: ₹${Number(inv.amountRemaining).toLocaleString('en-IN')}` : 'Fully Paid'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#EBE8E2] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#B85D19] uppercase tracking-wider">Pay Invoice</span>
                <h3 className="text-lg font-bold text-[#1E1B18] mt-0.5">{payModalInvoice.invoiceNumber}</h3>
              </div>
              <button onClick={() => setPayModalInvoice(null)} className="p-1.5 text-[#78716C] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-[#FBF9F7] rounded-xl border border-[#EBE8E2] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#A8A29E] uppercase">Amount Due</span>
                <div className="text-2xl font-black text-[#1E1B18] mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />{Number(payModalInvoice.amountRemaining || payModalInvoice.amount).toLocaleString('en-IN')}
                </div>
              </div>
              <button onClick={() => { setPayRef(`QUICK-${Math.floor(100000 + Math.random() * 900000)}`); setPayMethod('UPI'); toast.info('⚡ Auto-filled for quick testing'); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                <Zap className="w-3 h-3" />Quick Fill
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} type="button" onClick={() => setPayMethod(m.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${payMethod === m.id ? 'border-[#B85D19] bg-[#F5EFEB] ring-1 ring-[#B85D19]' : 'border-[#EBE8E2] bg-white hover:bg-[#FAF8F5]'}`}>
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
              <button onClick={() => setPayModalInvoice(null)} className="flex-1 py-2.5 text-xs font-semibold text-[#78716C] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button onClick={() => payMutation.mutate({ invoiceId: payModalInvoice.id, paymentMethod: payMethod, reference: payRef || undefined })}
                disabled={payMutation.isPending}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50">
                {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
