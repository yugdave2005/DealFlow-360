import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Receipt, 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Building,
  Layers,
  ArrowDownRight,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Sparkles,
  Zap,
  Check,
  ExternalLink,
  Download
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';

import { api } from '../../lib/axios';

export default function InvoicesList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Recording Modal state
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['salesInvoices'],
    queryFn: async () => {
      try {
        const res = await api.get('/invoices');
        const list = res.data?.data || res.data || (Array.isArray(res) ? res : []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, paymentReference }) => {
      const res = await api.post(`/invoices/${invoiceId}/pay`, {
        paymentMethod,
        paymentReference
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Payment recorded successfully & invoice marked as PAID');
      setPayingInvoice(null);
      setPaymentReference('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Payment recording failed');
    }
  });

  const handleQuickPay = (inv) => {
    const autoRef = `UPI-FAST-${Date.now().toString().slice(-6)}`;
    recordPaymentMutation.mutate({
      invoiceId: inv.id,
      paymentMethod: 'UPI',
      paymentReference: autoRef
    });
    toast.info(`Processing Quick 1-Click Payment for ${inv.invoiceNumber}...`);
  };

  const totalCollected = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const totalOutstanding = invoices
    .filter(i => i.status !== 'PAID')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const filteredInvoices = invoices.filter(inv => {
    const invNum = inv.invoiceNumber || inv.id || '';
    const custName = inv.customer?.companyName || '';
    const ordNum = inv.orderNumber || '';
    
    const matchesSearch = invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordNum.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRecordPaymentSubmit = () => {
    const ref = paymentReference.trim() || `TXN-REF-${Date.now().toString().slice(-6)}`;
    recordPaymentMutation.mutate({
      invoiceId: payingInvoice.id,
      paymentMethod,
      paymentReference: ref
    });
  };

  const handleAutoFillTest = () => {
    setPaymentMethod('UPI');
    setPaymentReference(`UPI-TEST-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">Billing & Invoices</h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">Hybrid billing schedules, one-time hardware settlements & recurring cycles</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Quick 1-Click Pay Enabled</span>
          </span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8A29E]">Total Invoices</span>
            <Receipt className="w-4 h-4 text-[#A8A29E]" />
          </div>
          <p className="text-2xl font-bold text-[#1E1B18]">{invoices.length}</p>
          <span className="text-xs text-[#78716C] mt-1 block">One-time & recurring portfolios</span>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8A29E]">Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Realized payments settled</span>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8A29E]">Outstanding AR</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[#1E1B18]">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          <span className="text-xs text-amber-700 font-medium mt-1 block">Pending & overdue receivables</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
            <input
              type="text"
              placeholder="Search invoice #, order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-sm text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#78716C]">Billing Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-xs font-medium text-[#44403C] focus:outline-none focus:border-[#B85D19]"
            >
              <option value="ALL">All Types</option>
              <option value="ONE_TIME">One-Time (Hardware/Services)</option>
              <option value="RECURRING">Recurring (Subscriptions)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#78716C]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-xs font-medium text-[#44403C] focus:outline-none focus:border-[#B85D19]"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="SENT">Sent / Unpaid</option>
              <option value="DRAFT">Draft</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description="Invoices are generated automatically when confirmed orders start fulfillment or subscriptions cycle."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EBE8E2] text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Billing Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Payment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E2]/60">
                {filteredInvoices.map((inv) => {
                  const isRecurring = inv.type === 'RECURRING';
                  const isPaid = inv.status === 'PAID';

                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#B85D19]">
                        {inv.invoiceNumber || inv.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#1E1B18]">{inv.customer?.companyName || 'Enterprise Client'}</div>
                        <div className="text-xs text-[#A8A29E]">{inv.itemsSummary || 'Standard Line Items'}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs font-medium text-[#78716C]">
                        {inv.orderNumber || 'ORD-1004'}
                      </td>
                      <td className="py-4 px-4">
                        {isRecurring ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <RefreshCw className="w-3 h-3" />
                            Recurring Subscription
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5EFEB] text-[#44403C] border border-[#E8DFD8]">
                            <Layers className="w-3 h-3 text-[#78716C]" />
                            One-Time Hardware/Services
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#1E1B18] text-base">
                        ₹{Number(inv.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#78716C]">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={inv.status || 'PENDING'} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              downloadInvoicePDF(inv);
                              toast.success(`Downloaded Tax Invoice PDF for ${inv.invoiceNumber || inv.id}`);
                            }}
                            className="p-1.5 text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer"
                            title="Download Official Tax Invoice PDF"
                          >
                            <Download className="w-4 h-4 text-[#B85D19]" />
                          </button>

                          {isPaid ? (
                            <span className="text-xs font-semibold text-emerald-700 inline-flex items-center justify-end gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          ) : (
                            <>
                              {/* 1-Click Quick Pay Button */}
                              <button
                                onClick={() => handleQuickPay(inv)}
                                disabled={recordPaymentMutation.isPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-[#B85D19] hover:from-amber-600 hover:to-[#9E4E13] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                title="Instant 1-Click Settlement (Test Mode)"
                              >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Quick Pay</span>
                              </button>

                              {/* Manual Record Payment Button */}
                              <button
                                onClick={() => {
                                  setPayingInvoice(inv);
                                  setPaymentReference(`UPI-PAY-${Date.now().toString().slice(-6)}`);
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-[#F5EFEB] text-[#44403C] border border-[#EBE8E2] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal with Quick Test Fill */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-2xl shadow-xl border border-[#EBE8E2] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
              <div>
                <span className="text-xs font-bold text-[#B85D19] uppercase tracking-wider">Settlement Portal</span>
                <h3 className="text-lg font-bold text-[#1E1B18]">Record Payment</h3>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EBE8E2] p-3.5 rounded-xl space-y-1.5 text-xs text-[#78716C]">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <strong className="text-[#1E1B18] font-mono">{payingInvoice.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <strong className="text-[#1E1B18]">{payingInvoice.customer?.companyName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Amount Due:</span>
                <strong className="text-[#1E1B18] text-sm font-bold">₹{Number(payingInvoice.amount).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#44403C]">Payment Method</label>
                  <button
                    type="button"
                    onClick={handleAutoFillTest}
                    className="text-[11px] font-bold text-[#B85D19] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    Auto-Fill Test Info
                  </button>
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl font-medium text-[#1E1B18] focus:outline-none focus:border-[#B85D19]"
                >
                  <option value="UPI">UPI / Instant Corporate Rail (Fastest)</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS / Bank Transfer</option>
                  <option value="CREDIT_CARD">Corporate Card</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#44403C] mb-1">Transaction Ref / UTR / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-PAY-849201"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-[#1E1B18] font-mono placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBE8E2]">
              <button
                type="button"
                onClick={() => handleQuickPay(payingInvoice)}
                disabled={recordPaymentMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant 1-Click Pay</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#78716C] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPaymentSubmit}
                  disabled={recordPaymentMutation.isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {recordPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
