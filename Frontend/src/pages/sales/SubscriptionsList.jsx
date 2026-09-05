import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  RefreshCw, Search, Calculator, CheckCircle2, 
  TrendingUp, ArrowUpRight, XCircle, CreditCard
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { billingApi } from '../../features/billing/billing.api.js';

export default function SubscriptionsList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');

  // Proration Modal state
  const [modifyingSub, setModifyingSub] = useState(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [prorationPreview, setProrationPreview] = useState(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['salesSubscriptions'],
    queryFn: async () => {
      try {
        const res = await billingApi.getSubscriptions();
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    }
  });

  const prorateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await billingApi.prorateSubscription(id, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      setProrationPreview(data.data);
      toast.success('Subscription prorated and partial invoice generated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to prorate subscription');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await billingApi.cancelSubscription(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesSubscriptions'] });
      toast.success('Subscription cancelled successfully');
    }
  });

  const totalMRR = subscriptions.reduce((acc, sub) => {
    const amt = Number(sub.amount) || 0;
    return acc + (sub.interval === 'YEARLY' ? amt / 12 : amt);
  }, 0);

  const totalARR = totalMRR * 12;

  const filteredSubscriptions = subscriptions.filter(sub => {
    const subNum = sub.id || '';
    const custName = sub.customer?.companyName || '';
    const matchesSearch = subNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = cycleFilter === 'ALL' || sub.interval === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  const handlePreviewProration = () => {
    prorateMutation.mutate({
      id: modifyingSub.id,
      payload: {
        newQuantity: Number(newQuantity),
        oldQuantity: modifyingSub.quantity,
        MRR: modifyingSub.amount
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Subscriptions</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage billing schedules, mid-cycle prorations, and MRR generation</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
            <RefreshCw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{subscriptions.filter(s => s.status !== 'CANCELLED').length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Recurring client accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">₹{Math.round(totalMRR).toLocaleString('en-IN')}</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Normalized monthly billing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Annualized Run-rate (ARR)</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{Math.round(totalARR).toLocaleString('en-IN')}</p>
          <span className="text-xs text-slate-400 mt-1 block">12-month contracted value</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscription # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Cycle:</span>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={RefreshCw}
              title="No active subscriptions found."
              description="Subscriptions are automatically generated when recurring products (SaaS, SLA Support) in confirmed quotations are executed."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product / Service</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Cycle</th>
                  <th className="py-3.5 px-4">Base Cost</th>
                  <th className="py-3.5 px-4">Next Billing Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{sub.customer?.companyName}</div>
                      <div className="text-xs text-slate-400 font-mono">SUB-{sub.id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700 max-w-[220px] truncate">
                      {sub.product?.name || 'Software Subscription'}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {sub.quantity}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {sub.interval || 'MONTHLY'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ₹{Number(sub.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-indigo-600">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={sub.status || 'ACTIVE'} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      {sub.status !== 'CANCELLED' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setModifyingSub(sub);
                              setNewQuantity(sub.quantity);
                              setProrationPreview(null);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modify Quantity (Prorate)"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if(window.confirm('Are you sure you want to cancel this subscription?')) {
                                cancelMutation.mutate(sub.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Subscription"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proration Modal */}
      {modifyingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Mid-Cycle Change</span>
                <h3 className="text-lg font-bold text-slate-900">Prorate Subscription</h3>
              </div>
              <button
                onClick={() => setModifyingSub(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {!prorationPreview ? (
              <>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Current Quantity:</span>
                    <strong className="text-slate-900 font-bold text-sm">{modifyingSub.quantity}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <strong className="text-slate-900">₹{Number(modifyingSub.amount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Billing:</span>
                    <strong className="text-indigo-600">
                      {new Date(modifyingSub.nextBillingDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">New Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-slate-500">
                    Entering a new quantity will calculate the partial charge or credit memo based on remaining days.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setModifyingSub(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePreviewProration}
                    disabled={prorateMutation.isPending || Number(newQuantity) === modifyingSub.quantity}
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs disabled:opacity-50"
                  >
                    Generate Proration
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Proration Finalized</h4>
                <div className="bg-slate-50 p-4 rounded-xl text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Days Remaining:</span>
                    <span className="font-bold text-slate-900">{prorationPreview.remainingDays} days</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-700">Prorated Charge:</span>
                    <span className="font-bold text-emerald-700">₹{Math.round(prorationPreview.proratedAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 px-4">
                  A partial invoice has been generated for the difference and added to Finance billing queue.
                </p>
                <div className="pt-2">
                  <button
                     onClick={() => setModifyingSub(null)}
                     className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl"
                  >
                    Complete & Check Invoices
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
