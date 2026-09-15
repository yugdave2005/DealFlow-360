import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Truck, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Percent,
  Layers,
  Send,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { api } from '../../lib/axios';

export default function DealHealth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['dealHealth'],
    queryFn: async () => {
      try {
        const res = await api.get('/dealhealth');
        return res.data?.data || res.data || {};
      } catch (e) {
        return {};
      }
    }
  });

  // Automated Nudge Mutation
  const nudgeMutation = useMutation({
    mutationFn: async ({ quotationId, recipientRole }) => {
      const res = await api.post('/dealhealth/nudge', { quotationId, recipientRole });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Automated follow-up reminder dispatched!');
      queryClient.invalidateQueries({ queryKey: ['dealHealth'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch nudge');
    }
  });

  // Governance Escalation Mutation
  const escalateMutation = useMutation({
    mutationFn: async ({ quotationId, reason }) => {
      const res = await api.post('/dealhealth/escalate', { quotationId, reason });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Deal escalated to Executive Leadership!');
      queryClient.invalidateQueries({ queryKey: ['dealHealth'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to escalate deal');
    }
  });

  // Expedite Fulfillment Mutation
  const expediteMutation = useMutation({
    mutationFn: async ({ fulfillmentItemId }) => {
      const res = await api.post('/dealhealth/expedite', { fulfillmentItemId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Carrier expedited to Overnight Express!');
      queryClient.invalidateQueries({ queryKey: ['dealHealth'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to expedite fulfillment');
    }
  });

  const stalledDeals = healthData?.stalledDeals || [];
  const discountAnomalies = healthData?.discountAnomalies || [];
  const deliveryRisks = healthData?.deliverySlippage || [];
  const summary = healthData?.summary || { stalledCount: 0, anomalyCount: 0, slippageCount: 0 };

  const totalAtRisk = summary.stalledCount + summary.anomalyCount + summary.slippageCount;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Page Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">
              Deal Health & Anomaly Radar
            </h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">
              Live monitoring of stalled negotiations, margin slippages, and fulfillment delays
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            totalAtRisk > 0 
              ? 'bg-rose-50 text-rose-700 border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {totalAtRisk > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{totalAtRisk} Active Deal Alert{totalAtRisk === 1 ? '' : 's'}</span>
          </span>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                Stalled Negotiations
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#F5EFEB] text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1E1B18] tracking-tight">
              {summary.stalledCount}
            </p>
            <span className="text-xs text-[#78716C] block">
              Inactive &gt; 7 days without revision
            </span>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                Discount Anomalies
              </span>
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-rose-600 tracking-tight">
              {summary.anomalyCount}
            </p>
            <span className="text-xs text-[#78716C] block">
              Risk score exceeding governance tolerance
            </span>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                Delivery Slippage
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#F5EFEB] text-[#B85D19] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1E1B18] tracking-tight">
              {summary.slippageCount}
            </p>
            <span className="text-xs text-[#78716C] block">
              Shipments delayed past promised ETA
            </span>
          </div>
        </div>
      )}

      {/* 3. Detailed Radar Anomaly Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: STALLED DEALS */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold text-[#1E1B18]">Stalled Negotiations</h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {stalledDeals.length} Stuck
            </span>
          </div>

          <div className="space-y-3">
            {stalledDeals.length === 0 ? (
              <div className="p-6 text-center text-[#78716C] text-xs font-medium bg-[#FAF8F5] rounded-xl border border-dashed border-[#EBE8E2]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                No stalled deals. Velocity is healthy!
              </div>
            ) : stalledDeals.map(deal => (
              <div key={deal.id} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] hover:border-[#B85D19]/30 transition-all space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B85D19]">{deal.quotationNumber || `QT-${deal.id.slice(0,6)}`}</span>
                    <h4 className="font-bold text-[#1E1B18] text-sm mt-0.5">{deal.status}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Inactive {deal.daysSinceUpdate || 0}d
                  </span>
                </div>
                <p className="text-xs text-[#78716C]">No update for over 7 days. Customer may need a follow-up concession.</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E2] text-xs gap-2">
                  <button
                    onClick={() => nudgeMutation.mutate({ quotationId: deal.id, recipientRole: 'CUSTOMER' })}
                    disabled={nudgeMutation.isPending}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Nudge</span>
                  </button>
                  <button
                    onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                    className="text-[#78716C] hover:text-[#1E1B18] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: DISCOUNT ANOMALIES */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-bold text-[#1E1B18]">Discount Anomalies</h3>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              {discountAnomalies.length} High Risk
            </span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.length === 0 ? (
              <div className="p-6 text-center text-[#78716C] text-xs font-medium bg-[#FAF8F5] rounded-xl border border-dashed border-[#EBE8E2]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                No discount anomalies. Margins compliant.
              </div>
            ) : discountAnomalies.map((deal, idx) => (
              <div key={idx} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] hover:border-[#B85D19]/30 transition-all space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B85D19]">{deal.quotationNumber || `Rev v${deal.versionNumber}`}</span>
                    <h4 className="font-bold text-[#1E1B18] text-sm mt-0.5">By {deal.createdBy || 'Sales Rep'}</h4>
                  </div>
                  <RiskBadge score={deal.riskScore} />
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#EBE8E2] text-xs">
                  <div>
                    <span className="text-[#A8A29E] text-[10px] uppercase font-bold block">Total Amount:</span>
                    <strong className="text-[#1E1B18] font-bold">₹{Number(deal.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[#A8A29E] text-[10px] uppercase font-bold block">Total Concession:</span>
                    <strong className="text-rose-600 font-bold">-₹{Number(deal.totalDiscount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E2] text-xs gap-2">
                  <button
                    onClick={() => escalateMutation.mutate({ quotationId: deal.id, reason: 'High Risk Margin Concession' })}
                    disabled={escalateMutation.isPending}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Escalate to VP</span>
                  </button>
                  <button
                    onClick={() => navigate(`/sales/quotations/${deal.id || ''}`)}
                    className="text-[#78716C] hover:text-[#1E1B18] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Review</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: DELIVERY SLIPPAGE */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#B85D19]" />
              <h3 className="text-base font-bold text-[#1E1B18]">Delivery Promise Slippage</h3>
            </div>
            <span className="text-xs bg-[#F5EFEB] text-[#B85D19] font-bold px-2.5 py-0.5 rounded-full border border-[#E8DFD8]">
              {deliveryRisks.length} At Risk
            </span>
          </div>

          <div className="space-y-3">
            {deliveryRisks.length === 0 ? (
              <div className="p-6 text-center text-[#78716C] text-xs font-medium bg-[#FAF8F5] rounded-xl border border-dashed border-[#EBE8E2]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                All fulfillment dispatches on schedule.
              </div>
            ) : deliveryRisks.map((order, idx) => (
              <div key={idx} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] hover:border-[#B85D19]/30 transition-all space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B85D19]">{order.orderId || 'ORD-1004'}</span>
                    <h4 className="font-bold text-[#1E1B18] text-sm mt-0.5">Warehouse: {order.warehouse}</h4>
                    <p className="text-xs text-[#78716C]">Allocated: {order.quantity} units</p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Delayed ({order.daysOverdue}d)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E2] text-xs gap-2">
                  <button
                    onClick={() => expediteMutation.mutate({ fulfillmentItemId: order.id })}
                    disabled={expediteMutation.isPending}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Expedite ETA</span>
                  </button>
                  <button
                    onClick={() => navigate('/sales/fulfillment')}
                    className="text-[#78716C] hover:text-[#1E1B18] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Fulfillment</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
