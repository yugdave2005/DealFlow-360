import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Search, 
  X, 
  Check, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  ChevronRight,
  Clock,
  Ban,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { api } from '../../lib/axios';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

// Consistent INR Currency Formatter
const formatINR = (val) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
};

// Billing Cycle Helpers
const getCycleLabel = (cycle) => {
  if (!cycle) return 'Monthly';
  const c = String(cycle).toUpperCase();
  if (c === 'YEARLY' || c === 'ANNUAL') return 'Yearly';
  if (c === 'QUARTERLY') return 'Quarterly';
  return 'Monthly';
};

const getCycleSuffix = (cycle) => {
  if (!cycle) return '/mo';
  const c = String(cycle).toUpperCase();
  if (c === 'YEARLY' || c === 'ANNUAL') return '/yr';
  if (c === 'QUARTERLY') return '/qtr';
  return '/mo';
};

// Date Formatter
const formatSlaDate = (dateStr) => {
  if (!dateStr) return { date: '—', time: '' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: String(dateStr), time: '' };
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { date, time };
  } catch {
    return { date: String(dateStr), time: '' };
  }
};

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, PAUSED, CANCELLED

  // Selected subscription for detail drawer
  const [selectedSub, setSelectedSub] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [isProratingSeats, setIsProratingSeats] = useState(false);
  const [targetSeats, setTargetSeats] = useState(1);
  const [newCycle, setNewCycle] = useState('MONTHLY');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // 1. Fetch live subscriptions list from backend
  const { data: rawSubscriptions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['salesSubscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res?.data || res || [];
    }
  });

  const subscriptions = Array.isArray(rawSubscriptions) ? rawSubscriptions : [];

  // Derived Financial KPIs (Zero NaN guarantee)
  const metrics = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
    const totalActiveCount = activeSubs.length;

    const totalMRR = activeSubs.reduce((acc, sub) => {
      const mrr = Number(sub.mrr);
      if (!isNaN(mrr) && isFinite(mrr) && mrr > 0) return acc + mrr;
      const amt = Number(sub.amount) || 0;
      const cycle = String(sub.billingCycle || sub.interval || 'MONTHLY').toUpperCase();
      const derivedMrr = cycle === 'YEARLY' ? amt / 12 : cycle === 'QUARTERLY' ? amt / 3 : amt;
      return acc + (isNaN(derivedMrr) ? 0 : derivedMrr);
    }, 0);

    const totalARR = totalMRR * 12;

    return {
      activeCount: totalActiveCount,
      totalCount: subscriptions.length,
      mrr: Math.round(totalMRR),
      arr: Math.round(totalARR)
    };
  }, [subscriptions]);

  // Filter Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const subNum = sub.subscriptionNumber || sub.id || '';
      const custName = sub.customer?.companyName || sub.customer?.name || '';
      const prodName = sub.product?.name || '';
      const term = searchTerm.toLowerCase();

      const matchesSearch = 
        subNum.toLowerCase().includes(term) ||
        custName.toLowerCase().includes(term) ||
        prodName.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      const subCycle = String(sub.billingCycle || sub.interval || 'MONTHLY').toUpperCase();
      const matchesCycle = cycleFilter === 'ALL' || subCycle === cycleFilter;
      if (!matchesCycle) return false;

      const subStatus = String(sub.status || 'ACTIVE').toUpperCase();
      if (statusFilter !== 'ALL' && subStatus !== statusFilter) return false;

      return true;
    });
  }, [subscriptions, searchTerm, cycleFilter, statusFilter]);

  // Open / Close Drawer
  const handleOpenDrawer = (sub) => {
    setSelectedSub(sub);
    setNewCycle(sub.billingCycle || sub.interval || 'MONTHLY');
    setTargetSeats(sub.quantity || 1);
    setIsEditingCycle(false);
    setIsProratingSeats(false);
    setShowCancelModal(false);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedSub(null);
    setIsEditingCycle(false);
    setIsProratingSeats(false);
    setShowCancelModal(false);
  };

  // Modify Subscription Mutation (e.g. change billing cycle or pause or seats proration)
  const modifyMutation = useMutation({
    mutationFn: async ({ id, interval, status, quantity }) => {
      const res = await api.patch(`/subscriptions/${id}`, { interval, status, quantity });
      return res.data?.data || res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['salesSubscriptions'] });
      if (updated && selectedSub) {
        setSelectedSub(prev => ({ ...prev, ...updated }));
      }
      setIsEditingCycle(false);
      setIsProratingSeats(false);
      if (updated?.proration) {
        toast.success(
          `Proration applied! ${updated.proration.deltaQuantity > 0 ? 'Debit Invoice' : 'Credit Note'} ${
            updated.proration.invoiceNumber || updated.proration.creditNoteNumber
          } issued for ${formatINR(Math.abs(updated.proration.proratedAmount))}`
        );
      } else {
        toast.success('Subscription terms updated successfully');
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Update failed');
    }
  });

  // Cancel Subscription Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/subscriptions/${id}/cancel`, { immediate: true, reason: 'Sales Ops cancellation' });
      return res.data?.data || res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['salesSubscriptions'] });
      if (updated && selectedSub) {
        setSelectedSub(prev => ({ ...prev, ...updated, status: 'CANCELLED' }));
      } else if (selectedSub) {
        setSelectedSub(prev => ({ ...prev, status: 'CANCELLED' }));
      }
      setShowCancelModal(false);
      if (updated?.creditNote) {
        toast.success(
          `Cancelled with Credit Note ${updated.creditNote.creditNoteNumber} issued for ${formatINR(updated.creditNote.refundAmount)} (${updated.creditNote.daysRefunded} days unused)`
        );
      } else {
        toast.success('Subscription contract cancelled successfully');
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Cancellation failed');
    }
  });

  // Proration live calculations for active drawer sub
  const daysRemainingInCycle = useMemo(() => {
    if (!selectedSub?.nextBillingDate) return 18;
    const nextDate = new Date(selectedSub.nextBillingDate);
    const now = new Date();
    const diff = Math.max(0, nextDate.getTime() - now.getTime());
    return Math.max(1, Math.min(30, Math.ceil(diff / (1000 * 60 * 60 * 24))));
  }, [selectedSub]);

  const currentSeats = selectedSub?.quantity || 1;
  const currentUnitPrice = selectedSub?.unitPrice || 4999;
  const seatDelta = targetSeats - currentSeats;
  const daysInCycle = selectedSub?.billingCycle === 'YEARLY' ? 365 : selectedSub?.billingCycle === 'QUARTERLY' ? 90 : 30;
  const liveProratedAmount = Math.round((currentUnitPrice / daysInCycle) * daysRemainingInCycle * seatDelta);
  const cancelRefundAmount = Math.round((currentUnitPrice * currentSeats / daysInCycle) * daysRemainingInCycle);


  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* 1. Page Header (Uncarded canvas) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-[38px] font-semibold text-[#171717] tracking-tight leading-tight">
              Recurring Subscriptions
            </h1>
            <p className="text-[15px] text-[#6F6B66] mt-1">
              Track recurring commitments, billing schedules, and MRR generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#6F6B66] hover:text-[#171717] bg-[#FFFFFF] hover:bg-[#F2EFEA] border border-[#E6E1D9] rounded-[9px] transition-colors shadow-xs"
              title="Refresh subscriptions"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Subscription Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E1D9] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#96918A] uppercase tracking-[0.05em]">
              Active Subscriptions
            </span>
            <div className="w-6 h-6 rounded-md bg-[#F8E9E3] text-[#D97757] flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[30px] font-semibold text-[#171717] tracking-tight">
            {metrics.activeCount}
          </p>
          <span className="text-[12px] text-[#6F6B66] block">
            {metrics.totalCount} total account {metrics.totalCount === 1 ? 'contract' : 'contracts'}
          </span>
        </div>

        {/* Monthly Recurring Revenue (MRR) */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E1D9] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#96918A] uppercase tracking-[0.05em]">
              Monthly Recurring (MRR)
            </span>
            <div className="w-6 h-6 rounded-md bg-[#EAF5EE] text-[#3F8F63] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[30px] font-semibold text-[#171717] tracking-tight">
            {formatINR(metrics.mrr)}
          </p>
          <span className="text-[12px] text-[#6F6B66] block">
            Normalized monthly billing run-rate
          </span>
        </div>

        {/* Annualized Run-Rate (ARR) */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E1D9] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#96918A] uppercase tracking-[0.05em]">
              Annualized Run-Rate (ARR)
            </span>
            <div className="w-6 h-6 rounded-md bg-[#F5F2ED] text-[#171717] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[30px] font-semibold text-[#171717] tracking-tight">
            {formatINR(metrics.arr)}
          </p>
          <span className="text-[12px] text-[#6F6B66] block">
            12-month contracted forward value
          </span>
        </div>
      </div>

      {/* 3. Search + Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-[380px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
            <input
              type="text"
              placeholder="Search subscription or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-[#FFFFFF] border border-[#E6E1D9] rounded-[9px] text-sm text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-colors shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cycle Dropdown */}
          <div className="relative">
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="h-10 pl-3.5 pr-8 bg-[#FFFFFF] border border-[#E6E1D9] rounded-[9px] text-xs font-medium text-[#171717] focus:outline-none focus:border-[#D97757] shadow-xs cursor-pointer appearance-none"
            >
              <option value="ALL">All Cycles</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#96918A] pointer-events-none" />
          </div>
        </div>

        {/* Status Filter Capsules */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#171717] text-[#FFFFFF] shadow-xs'
                : 'bg-[#FFFFFF] text-[#6F6B66] hover:bg-[#F2EFEA] border border-[#E6E1D9]'
            }`}
          >
            All ({subscriptions.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB] font-semibold'
                : 'bg-[#FFFFFF] text-[#6F6B66] hover:bg-[#F2EFEA] border border-[#E6E1D9]'
            }`}
          >
            Active ({subscriptions.filter(s => s.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setStatusFilter('PAUSED')}
            className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'PAUSED'
                ? 'bg-[#FBF2E3] text-[#C98A32] border border-[#F3DFC1] font-semibold'
                : 'bg-[#FFFFFF] text-[#6F6B66] hover:bg-[#F2EFEA] border border-[#E6E1D9]'
            }`}
          >
            Paused ({subscriptions.filter(s => s.status === 'PAUSED').length})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'CANCELLED'
                ? 'bg-[#FBEAEA] text-[#C95757] border border-[#F5D5D5] font-semibold'
                : 'bg-[#FFFFFF] text-[#6F6B66] hover:bg-[#F2EFEA] border border-[#E6E1D9]'
            }`}
          >
            Cancelled ({subscriptions.filter(s => s.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* 4. Main Subscription Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E1D9] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FBEAEA] text-[#C95757] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#171717]">Unable to load subscriptions.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#D97757] bg-[#F8E9E3] hover:bg-[#F2D7CD] rounded-[9px] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={RefreshCw}
              title="No active subscriptions found."
              description="Subscriptions are automatically generated when recurring products (SaaS, SLA Support) in confirmed quotations are executed."
              actionLabel="View Quotations"
              onAction={() => navigate('/sales/quotations')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[11px] font-medium text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-3 px-5">Subscription #</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Product / Service</th>
                  <th className="py-3 px-5">Qty</th>
                  <th className="py-3 px-5">Billing Cycle</th>
                  <th className="py-3 px-5">Recurring Amount</th>
                  <th className="py-3 px-5">Next Billing Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4] text-sm">
                {filteredSubscriptions.map((sub) => {
                  const subNumber = sub.subscriptionNumber || (sub.order?.orderNumber ? `SUB-2026-${sub.order.orderNumber.replace('ORD-', '')}` : sub.id?.slice(0, 8).toUpperCase());
                  const custName = sub.customer?.companyName || sub.customer?.name || 'Customer Organization';
                  const custTier = sub.customer?.tier || 'GOLD';
                  const prodName = sub.product?.name || 'Recurring Service Package';
                  const qty = sub.quantity || 1;
                  const cycle = sub.billingCycle || sub.interval || 'MONTHLY';
                  const cycleLabel = getCycleLabel(cycle);
                  const cycleSuffix = getCycleSuffix(cycle);
                  const amount = Number(sub.amount) || (Number(sub.mrr) * (cycle === 'YEARLY' ? 12 : cycle === 'QUARTERLY' ? 3 : 1)) || 0;
                  const nextDateFormatted = formatSlaDate(sub.nextBillingDate);
                  const status = (sub.status || 'ACTIVE').toUpperCase();

                  return (
                    <tr
                      key={sub.id}
                      className="h-[68px] hover:bg-[#FBFAF8] transition-colors duration-150 group cursor-pointer"
                      onClick={() => handleOpenDrawer(sub)}
                    >
                      {/* Subscription Number */}
                      <td className="py-4 px-5">
                        <span className="font-mono text-[13px] font-semibold text-[#D97757] group-hover:text-[#C96648] transition-colors">
                          {subNumber}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#171717] text-[14px]">
                          {custName}
                        </div>
                        <div className="text-[12px] text-[#96918A] font-medium tracking-wide">
                          {custTier}
                        </div>
                      </td>

                      {/* Product / Service */}
                      <td className="py-4 px-5 max-w-[220px]">
                        <div className="text-[13px] text-[#35322F] font-medium line-clamp-1" title={prodName}>
                          {prodName}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-4 px-5">
                        <span className="text-[14px] font-semibold text-[#171717]">{qty}</span>{' '}
                        <span className="text-[12px] text-[#96918A]">{qty === 1 ? 'unit' : 'units'}</span>
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-[#F5F2ED] border border-[#E6E1D9] text-[#6F6B66]">
                          {cycleLabel}
                        </span>
                      </td>

                      {/* Recurring Amount */}
                      <td className="py-4 px-5">
                        <span className="text-[14px] font-semibold text-[#171717]">
                          {formatINR(amount)}
                        </span>
                        <span className="text-[12px] text-[#96918A] font-normal ml-0.5">
                          {cycleSuffix}
                        </span>
                      </td>

                      {/* Next Billing Date */}
                      <td className="py-4 px-5">
                        <div className="text-[13px] font-semibold text-[#171717]">
                          {nextDateFormatted.date}
                        </div>
                        {nextDateFormatted.time && (
                          <div className="text-[12px] text-[#96918A]">
                            {nextDateFormatted.time}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F63]"></span>
                            <span>Active</span>
                          </span>
                        ) : status === 'PAUSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBF2E3] text-[#C98A32] border border-[#F3DFC1]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C98A32]"></span>
                            <span>Paused</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBEAEA] text-[#C95757] border border-[#F5D5D5]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C95757]"></span>
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDrawer(sub)}
                          className="h-[34px] px-3 bg-[#FFFFFF] hover:bg-[#F8E9E3] text-[#D97757] border border-[#E6E1D9] hover:border-[#D97757]/40 rounded-[8px] text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Table Footer */}
        {!isLoading && filteredSubscriptions.length > 0 && (
          <div className="p-4 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center justify-between text-[12px] text-[#96918A]">
            <span>Showing {filteredSubscriptions.length} recurring {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'}</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3F8F63]"></span>
              <span className="text-[#6F6B66]">Automated Recurring Invoicing Engine Active</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. SUBSCRIPTION DETAILS SLIDE-OUT DRAWER */}
      {/* ========================================================================= */}
      {drawerOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity"
            onClick={handleCloseDrawer}
          />

          {/* Slide-out Surface */}
          <div className="relative w-full sm:w-[520px] bg-[#FFFFFF] h-full shadow-2xl border-l border-[#E6E1D9] flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E6E1D9] bg-[#FAF9F6] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D97757] uppercase tracking-wider">Subscription</span>
                  <span className="font-mono text-xs font-bold text-[#171717] bg-[#FFFFFF] border border-[#E6E1D9] px-2 py-0.5 rounded">
                    {selectedSub.subscriptionNumber || selectedSub.id?.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#171717] mt-1">
                  {selectedSub.customer?.companyName || selectedSub.customer?.name || 'Client Corporation'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {selectedSub.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB]">
                      <Check className="w-3 h-3" />
                      Active Subscription
                    </span>
                  ) : selectedSub.status === 'PAUSED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF2E3] text-[#C98A32] border border-[#F3DFC1]">
                      <Pause className="w-3 h-3" />
                      Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBEAEA] text-[#C95757] border border-[#F5D5D5]">
                      <Ban className="w-3 h-3" />
                      Cancelled
                    </span>
                  )}
                  <span className="text-xs text-[#96918A]">
                    &bull; Order {selectedSub.order?.orderNumber || 'ORD-1004'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 text-[#96918A] hover:text-[#171717] hover:bg-[#F2EFEA] rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product & Contract Summary */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E6E1D9] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                      Subscribed Service
                    </span>
                    <p className="text-sm font-bold text-[#171717] mt-0.5">
                      {selectedSub.product?.name || 'Enterprise Cloud & SaaS License'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                      Licensed Units
                    </span>
                    <p className="text-base font-bold text-[#171717]">
                      {selectedSub.quantity || 1} <span className="text-xs text-[#6F6B66] font-normal">units</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EEEAE4]">
                  <div>
                    <span className="text-[11px] text-[#96918A] block font-medium">Billing Cadence</span>
                    <strong className="text-xs font-semibold text-[#171717]">
                      {getCycleLabel(selectedSub.billingCycle || selectedSub.interval)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#96918A] block font-medium">Unit Rate</span>
                    <strong className="text-xs font-semibold text-[#171717]">
                      {formatINR(selectedSub.unitPrice || 4999)} / unit
                    </strong>
                  </div>
                </div>
              </div>

              {/* Financial Run-Rate Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[#FFFFFF] border border-[#E6E1D9] rounded-xl space-y-1 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                    Monthly MRR
                  </span>
                  <p className="text-xl font-bold text-[#171717]">
                    {formatINR(selectedSub.mrr || (Number(selectedSub.amount) / (selectedSub.billingCycle === 'YEARLY' ? 12 : 1)))}
                  </p>
                  <span className="text-[11px] text-[#3F8F63] font-medium block">Active Revenue Stream</span>
                </div>

                <div className="p-4 bg-[#FFFFFF] border border-[#E6E1D9] rounded-xl space-y-1 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                    Contract ARR
                  </span>
                  <p className="text-xl font-bold text-[#171717]">
                    {formatINR(selectedSub.arr || (Number(selectedSub.mrr || selectedSub.amount) * 12))}
                  </p>
                  <span className="text-[11px] text-[#6F6B66] font-medium block">12-Month Run-Rate</span>
                </div>
              </div>

              {/* Key Timeline Dates */}
              <div className="p-4 bg-[#FFFFFF] border border-[#E6E1D9] rounded-xl space-y-3 shadow-xs">
                <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">
                  Subscription Milestones
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#96918A] block font-medium">Contract Start Date</span>
                    <strong className="text-[#171717] font-semibold">
                      {formatSlaDate(selectedSub.startDate || selectedSub.createdAt).date}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#96918A] block font-medium">Next Scheduled Billing</span>
                    <strong className="text-[#D97757] font-semibold">
                      {formatSlaDate(selectedSub.nextBillingDate).date}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Billing Schedule Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Upcoming Billing Schedule
                  </span>
                  <span className="text-[11px] text-[#6F6B66] font-medium">Automated Debit</span>
                </div>

                <div className="bg-[#FAF9F6] border border-[#E6E1D9] rounded-xl overflow-hidden divide-y divide-[#EEEAE4]">
                  {(selectedSub.schedule || [
                    { date: selectedSub.nextBillingDate, amount: selectedSub.amount, status: 'UPCOMING' }
                  ]).map((item, idx) => {
                    const dateFmt = formatSlaDate(item.date);
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-[#96918A]" />
                          <div>
                            <strong className="text-[#171717] font-semibold block">{dateFmt.date}</strong>
                            <span className="text-[11px] text-[#96918A]">Cycle #{idx + 1}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#171717]">{formatINR(item.amount || selectedSub.amount)}</span>
                          <span className="text-[11px] block font-medium text-[#3F8F63]">
                            {idx === 0 ? '● Upcoming' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mid-Cycle Seat Adjustment & Proration Tool */}
              {selectedSub.status !== 'CANCELLED' && (
                <div className="p-4 bg-[#FAF9F6] border border-[#E6E1D9] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#171717] block">Mid-Cycle Seat Proration</span>
                      <span className="text-[11px] text-[#6F6B66]">Prorate charges/credits for mid-cycle quantity change</span>
                    </div>
                    {!isProratingSeats ? (
                      <button
                        onClick={() => { setIsProratingSeats(true); setTargetSeats(currentSeats); }}
                        className="text-xs font-semibold text-[#D97757] hover:underline cursor-pointer"
                      >
                        Adjust Seats
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsProratingSeats(false)}
                        className="text-xs text-[#96918A] hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {isProratingSeats && (
                    <div className="space-y-3 pt-2 border-t border-[#EEEAE4]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#35322F]">Target Seat Count:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTargetSeats(prev => Math.max(1, prev - 1))}
                            className="w-7 h-7 bg-[#FFFFFF] border border-[#E6E1D9] rounded-md font-bold text-sm text-[#171717] hover:bg-[#F2EFEA] flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-bold text-sm text-[#171717]">{targetSeats}</span>
                          <button
                            type="button"
                            onClick={() => setTargetSeats(prev => prev + 1)}
                            className="w-7 h-7 bg-[#FFFFFF] border border-[#E6E1D9] rounded-md font-bold text-sm text-[#171717] hover:bg-[#F2EFEA] flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {seatDelta !== 0 ? (
                        <div className="p-3 bg-[#FFFFFF] border border-[#E6E1D9] rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[#6F6B66]">
                            <span>Days Remaining in Cycle:</span>
                            <span className="font-semibold text-[#171717]">{daysRemainingInCycle} of {daysInCycle} days</span>
                          </div>
                          <div className="flex items-center justify-between text-[#6F6B66]">
                            <span>Seat Delta:</span>
                            <span className={`font-semibold ${seatDelta > 0 ? 'text-[#3F8F63]' : 'text-[#C95757]'}`}>
                              {seatDelta > 0 ? `+${seatDelta} seats (Upgrade)` : `${seatDelta} seats (Downgrade)`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-[#EEEAE4]">
                            <span className="font-semibold text-[#171717]">
                              {seatDelta > 0 ? 'Prorated Debit Invoice:' : 'Prorated Credit Note:'}
                            </span>
                            <span className="font-bold text-sm text-[#D97757]">
                              {formatINR(Math.abs(liveProratedAmount))}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#96918A]">
                            Formula: ({formatINR(currentUnitPrice)} / {daysInCycle}) &times; {daysRemainingInCycle} days &times; {Math.abs(seatDelta)} seats
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#96918A] text-center italic py-1">
                          No seat change selected ({currentSeats} current seats).
                        </p>
                      )}

                      <button
                        onClick={() => modifyMutation.mutate({ id: selectedSub.id, quantity: targetSeats })}
                        disabled={modifyMutation.isPending || seatDelta === 0}
                        className="w-full py-2 bg-[#D97757] hover:bg-[#C96648] disabled:opacity-50 text-[#FFFFFF] text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                      >
                        {modifyMutation.isPending ? 'Calculating & Applying...' : `Confirm & Apply Proration (${formatINR(Math.abs(liveProratedAmount))})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Modify Subscription Cadence Section */}
              {selectedSub.status !== 'CANCELLED' && (
                <div className="p-4 bg-[#FAF9F6] border border-[#E6E1D9] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717]">Billing Cadence Adjustment</span>
                    {!isEditingCycle ? (
                      <button
                        onClick={() => setIsEditingCycle(true)}
                        className="text-xs font-semibold text-[#D97757] hover:underline cursor-pointer"
                      >
                        Modify Cycle
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingCycle(false)}
                        className="text-xs text-[#96918A] hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {isEditingCycle && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setNewCycle(c)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                              newCycle === c
                                ? 'bg-[#D97757] text-[#FFFFFF] border-[#D97757]'
                                : 'bg-[#FFFFFF] text-[#6F6B66] border-[#E6E1D9] hover:bg-[#F2EFEA]'
                            }`}
                          >
                            {getCycleLabel(c)}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => modifyMutation.mutate({ id: selectedSub.id, interval: newCycle })}
                        disabled={modifyMutation.isPending}
                        className="w-full py-2 bg-[#171717] hover:bg-[#333333] text-[#FFFFFF] text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                      >
                        {modifyMutation.isPending ? 'Saving...' : 'Confirm Cadence Change'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel Confirmation Prompt with Prorated Refund Credit Note */}
              {showCancelModal && (
                <div className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[2px] z-30 flex items-center justify-center p-6 animate-in fade-in duration-150">
                  <div className="w-full bg-[#FFFFFF] rounded-[14px] border border-[#E6E1D9] shadow-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FBEAEA] border border-[#F5D5D5] flex items-center justify-center text-[#C95757] shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[15px] font-bold text-[#171717]">Cancel Subscription & Issue Credit Note?</h4>
                        <p className="text-xs text-[#6F6B66] leading-relaxed">
                          Cancelling now will terminate recurring billing for <strong>{selectedSub.customer?.companyName || 'this customer'}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Prorated refund preview box */}
                    <div className="p-3 bg-[#FAF9F6] border border-[#E6E1D9] rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#6F6B66]">
                        <span>Unused Days in Current Cycle:</span>
                        <span className="font-semibold text-[#171717]">{daysRemainingInCycle} days remaining</span>
                      </div>
                      <div className="flex items-center justify-between text-[#6F6B66]">
                        <span>Calculated Prorated Refund:</span>
                        <span className="font-bold text-[#3F8F63]">{formatINR(cancelRefundAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#EEEAE4] text-[11px]">
                        <span className="text-[#96918A]">Generated Credit Note:</span>
                        <span className="font-mono font-semibold text-[#171717]">CRN-2026-AUTO</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEEAE4]">
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] bg-[#FFFFFF] hover:bg-[#F2EFEA] border border-[#E6E1D9] rounded-[9px] transition-colors cursor-pointer"
                      >
                        Keep Active
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelMutation.mutate(selectedSub.id)}
                        disabled={cancelMutation.isPending}
                        className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#C95757] hover:bg-[#B54A4A] rounded-[9px] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        {cancelMutation.isPending ? 'Processing Credit Note...' : `Confirm & Issue Credit Note (${formatINR(cancelRefundAmount)})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between gap-3">
              {selectedSub.status === 'ACTIVE' ? (
                <>
                  <button
                    onClick={() => modifyMutation.mutate({ 
                      id: selectedSub.id, 
                      status: 'PAUSED' 
                    })}
                    disabled={modifyMutation.isPending}
                    className="flex-1 h-[40px] bg-[#FFFFFF] hover:bg-[#F2EFEA] text-[#6F6B66] border border-[#E6E1D9] rounded-[9px] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Billing</span>
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 h-[40px] bg-[#FFFFFF] hover:bg-[#FBEAEA] text-[#C95757] border border-[#E6E1D9] hover:border-[#F5D5D5] rounded-[9px] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Contract</span>
                  </button>
                </>
              ) : selectedSub.status === 'PAUSED' ? (
                <button
                  onClick={() => modifyMutation.mutate({ 
                    id: selectedSub.id, 
                    status: 'ACTIVE' 
                  })}
                  disabled={modifyMutation.isPending}
                  className="w-full h-[40px] bg-[#3F8F63] hover:bg-[#347853] text-[#FFFFFF] rounded-[9px] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Active Billing</span>
                </button>
              ) : (
                <div className="w-full text-center text-xs font-medium text-[#96918A] py-1">
                  Contract is permanently cancelled
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
