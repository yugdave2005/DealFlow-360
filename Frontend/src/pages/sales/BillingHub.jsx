import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Receipt, 
  RefreshCw, 
  CreditCard, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Sliders, 
  FileText, 
  RotateCcw, 
  Package, 
  IndianRupee, 
  ShieldCheck, 
  Zap,
  ArrowUpRight,
  Filter,
  Search,
  Layers
} from 'lucide-react';
import { api } from '../../lib/axios';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const formatINR = (val) => {
  const num = Number(val || 0);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export default function BillingHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, INVOICES, SUBSCRIPTIONS, SCHEDULE
  const [searchTerm, setSearchTerm] = useState('');

  // Proration interactive calculator state
  const [prorationModalSub, setProrationModalSub] = useState(null);
  const [newQty, setNewQty] = useState(1);

  // 1. Fetch Invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['billingInvoices'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data?.data || res.data || [];
    }
  });

  // 2. Fetch Subscriptions
  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['billingSubscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data?.data || res.data || [];
    }
  });

  const isLoading = loadingInvoices || loadingSubs;

  // Proration Mutation
  const prorationMutation = useMutation({
    mutationFn: async ({ id, quantity }) => {
      const res = await api.post(`/subscriptions/${id}/prorate`, { newQuantity: quantity });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billingSubscriptions'] });
      toast.success(data.message || 'Subscription updated and proration credited!');
      setProrationModalSub(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Proration failed')
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const mrr = subscriptions.filter(s => s.status === 'ACTIVE').reduce((s, sub) => {
      const price = Number(sub.recurringPrice || 0);
      const cycle = String(sub.billingCycle || 'MONTHLY').toUpperCase();
      if (cycle === 'YEARLY') return s + (price / 12);
      if (cycle === 'QUARTERLY') return s + (price / 3);
      return s + price;
    }, 0);

    return { totalInvoiced, totalPaid, totalDue, mrr, activeSubsCount: subscriptions.filter(s => s.status === 'ACTIVE').length };
  }, [invoices, subscriptions]);

  // Combined Hybrid Stream
  const hybridFeed = useMemo(() => {
    const combined = [
      ...invoices.map(inv => ({
        type: 'INVOICE',
        id: inv.id,
        number: inv.invoiceNumber,
        customer: inv.order?.customer?.name || 'Customer Account',
        orderNumber: inv.order?.orderNumber,
        amount: Number(inv.totalAmount || 0),
        status: inv.status,
        date: inv.createdAt,
        dueDate: inv.dueDate,
        isRecurring: false,
        raw: inv
      })),
      ...subscriptions.map(sub => ({
        type: 'SUBSCRIPTION',
        id: sub.id,
        number: `SUB-${sub.id.slice(0, 6).toUpperCase()}`,
        customer: sub.order?.customer?.name || 'Enterprise Client',
        orderNumber: sub.order?.orderNumber,
        amount: Number(sub.recurringPrice || 0),
        status: sub.status,
        date: sub.startDate,
        dueDate: sub.nextBillingDate,
        isRecurring: true,
        billingCycle: sub.billingCycle,
        raw: sub
      }))
    ];

    return combined
      .filter(item => {
        if (activeTab === 'INVOICES' && item.type !== 'INVOICE') return false;
        if (activeTab === 'SUBSCRIPTIONS' && item.type !== 'SUBSCRIPTION') return false;
        if (activeTab === 'SCHEDULE' && !item.dueDate) return false;
        if (searchTerm) {
          const matchNum = item.number?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchCust = item.customer?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchNum || matchCust;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [invoices, subscriptions, activeTab, searchTerm]);

  if (isLoading) {
    return <div className="p-8 max-w-7xl mx-auto space-y-4"><LoadingSkeleton count={4} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E1B18] tracking-tight">Hybrid Billing & AR Hub</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Reconcile one-time hardware orders, recurring subscriptions, proration schedules, and invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (invoices.length > 0) {
                downloadInvoicePDF(invoices[0]);
                toast.success('Latest Tax Invoice PDF downloaded');
              } else {
                toast.info('No invoices available to download');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EBE8E2] text-xs font-bold text-[#1E1B18] hover:bg-[#F5EFEB] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#B85D19]" />
            Download Sample Invoice PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EBE8E2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Monthly Rec. Revenue (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#1E1B18] mt-2">{formatINR(stats.mrr)}<span className="text-xs font-normal text-[#A8A29E]">/mo</span></div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">{stats.activeSubsCount} active recurring subscriptions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8E2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Total Invoiced (AR)</span>
            <Receipt className="w-4 h-4 text-[#B85D19]" />
          </div>
          <div className="text-2xl font-black text-[#1E1B18] mt-2">{formatINR(stats.totalInvoiced)}</div>
          <span className="text-[11px] text-[#78716C] mt-1 inline-block">{invoices.length} invoices generated</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8E2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{formatINR(stats.totalPaid)}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">100% reconciled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8E2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Outstanding Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{formatINR(stats.totalDue)}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 inline-block">Awaiting customer payment</span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE8E2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2]/80 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Billing Items', icon: Layers },
            { id: 'INVOICES', label: 'Tax Invoices (One-Time)', icon: Receipt },
            { id: 'SUBSCRIPTIONS', label: 'Subscriptions (Recurring)', icon: RefreshCw },
            { id: 'SCHEDULE', label: 'Upcoming Schedules', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-[#B85D19] shadow-xs border border-[#E8DFD8]'
                  : 'text-[#78716C] hover:text-[#1E1B18]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#EBE8E2] rounded-xl text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
          />
        </div>
      </div>

      {/* Hybrid Billing Items List */}
      <div className="space-y-3">
        {hybridFeed.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EBE8E2]">
            <Receipt className="w-10 h-10 text-[#D1CCC5] mx-auto mb-3" />
            <h3 className="font-bold text-[#1E1B18]">No billing records match your filter</h3>
            <p className="text-xs text-[#78716C] mt-1">Confirmed orders with hardware and subscription lines will appear here automatically.</p>
          </div>
        ) : (
          hybridFeed.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white rounded-2xl border border-[#EBE8E2] p-5 shadow-xs hover:border-[#B85D19]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                  item.isRecurring ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {item.isRecurring ? <RefreshCw className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">{item.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.isRecurring ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {item.isRecurring ? `Recurring (${item.billingCycle || 'Monthly'})` : 'One-Time Invoice'}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#78716C]">
                    <span className="font-medium text-[#1E1B18]">{item.customer}</span>
                    {item.orderNumber && <span>Order: <span className="font-mono">{item.orderNumber}</span></span>}
                    {item.dueDate && <span>Next Billing / Due: <span className="font-semibold text-[#1E1B18]">{new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EBE8E2]">
                <div className="text-right">
                  <div className="text-base font-black text-[#1E1B18]">{formatINR(item.amount)}</div>
                  <span className="text-[10px] text-[#A8A29E] font-medium">{item.isRecurring ? 'per billing cycle' : 'gross invoice total'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.type === 'INVOICE' && (
                    <button
                      onClick={() => {
                        downloadInvoicePDF(item.raw);
                        toast.success(`Downloaded PDF for ${item.number}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#EBE8E2] text-[#1E1B18] text-xs font-bold rounded-xl transition-all cursor-pointer"
                      title="Download Official PDF Invoice"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B85D19]" />
                      PDF
                    </button>
                  )}

                  {item.type === 'SUBSCRIPTION' && (
                    <button
                      onClick={() => {
                        setProrationModalSub(item.raw);
                        setNewQty(item.raw.quantity || 1);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#EBE8E2] text-xs font-bold text-[#1E1B18] rounded-xl transition-all cursor-pointer"
                      title="Simulate mid-cycle proration change"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#B85D19]" />
                      Prorate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mid-Cycle Proration Simulation Modal (PDF B7 Requirement) */}
      {prorationModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#EBE8E2] p-6 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-[#B85D19] uppercase tracking-wider">Subscription Management</span>
              <h3 className="text-lg font-bold text-[#1E1B18] mt-0.5">Mid-Cycle Proration & Adjustment</h3>
              <p className="text-xs text-[#78716C] mt-1">Modify active user seats or plans. DealFlow360 automatically computes remaining cycle days and generates credit notes or invoices.</p>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EBE8E2] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Current Recurring Price:</span>
                <span className="font-bold text-[#1E1B18]">{formatINR(prorationModalSub.recurringPrice)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Current License Count:</span>
                <span className="font-bold text-[#1E1B18]">{prorationModalSub.quantity || 1} seats</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Adjust New License Seats</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE8E2] rounded-xl text-sm font-bold text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20"
                />
              </div>
              <span className="text-[11px] text-[#A8A29E] mt-1 block">
                {newQty > (prorationModalSub.quantity || 1)
                  ? `⚡ Upgrading: Generates a prorated invoice for +${newQty - (prorationModalSub.quantity || 1)} seats.`
                  : `🔄 Downsizing: Issues a prorated credit note for unutilized days.`}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#EBE8E2]">
              <button
                onClick={() => setProrationModalSub(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-[#78716C] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => prorationMutation.mutate({ id: prorationModalSub.id, quantity: newQty })}
                disabled={prorationMutation.isPending}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {prorationMutation.isPending ? 'Calculating...' : 'Apply Proration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
