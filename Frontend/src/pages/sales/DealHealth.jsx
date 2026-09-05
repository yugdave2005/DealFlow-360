import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Truck, 
  ShieldAlert, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  Building, 
  Percent, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import EmptyState from '../../components/common/EmptyState';

const API_DEAL_HEALTH = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/deal-health`;
const API_APPROVALS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/approvals/pending`;
const getToken = () => localStorage.getItem('accessToken');

export default function DealHealth() {
  const navigate = useNavigate();

  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: ['dealHealthData'],
    queryFn: async () => {
      const res = await fetch(API_DEAL_HEALTH, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return { stalledDeals: [], discountAnomalies: [], deliverySlippage: [], summary: { stalledCount: 0, anomalyCount: 0, slippageCount: 0 } };
      return res.json();
    }
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['dealHealthApprovals'],
    queryFn: async () => {
      const res = await fetch(API_APPROVALS, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const stalledDeals = healthData?.stalledDeals || [];
  const discountAnomalies = healthData?.discountAnomalies || [];
  const deliveryRisks = healthData?.deliverySlippage || [];
  const approvalDelays = pendingApprovals || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deal Health & Risk Radar</h1>
              <p className="text-sm text-slate-500 mt-0.5">Automated detection of stalled negotiations, discount anomalies & delivery slippage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stalled Deals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{stalledDeals.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">&gt; 7 days without progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Discount Anomalies</span>
            <Percent className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{discountAnomalies.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Exceeds rep baseline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivery At-Risk</span>
            <Truck className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-700">{deliveryRisks.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">SLA slippage detected</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approval Bottlenecks</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{approvalDelays.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">&gt; 48h in review queue</span>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: STALLED DEALS */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-base">Stalled Deals</h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {stalledDeals.length} Action Needed
            </span>
          </div>

          <div className="space-y-3">
            {stalledDeals.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No stalled quotations. All deals moving actively.
              </div>
            ) : stalledDeals.map((deal) => (
              <div key={deal.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{deal.quotationNumber || `QT-${deal.id.slice(0,6)}`}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{deal.status}</h4>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Inactive {deal.daysSinceUpdate || 0} days
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">No activity recorded for over 7 days in status: {deal.status}</p>
                <div className="flex items-center justify-end pt-2 border-t border-slate-200/60 text-xs">
                  <button
                    onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <span>Open Deal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: DISCOUNT ANOMALIES */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-base">Discount Anomalies</h3>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
              {discountAnomalies.length} High Risk
            </span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No discount anomalies detected. Margins are compliant.
              </div>
            ) : discountAnomalies.map((deal, idx) => (
              <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{deal.quotationNumber || `V${deal.versionNumber}`}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">Created by {deal.createdBy || 'Sales Rep'}</h4>
                  </div>
                  <RiskBadge score={deal.riskScore} />
                </div>
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs mb-2">
                  <div>
                    <span className="text-slate-400 block">Total Amount:</span>
                    <strong className="text-slate-900 font-bold">₹{Number(deal.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Discount:</span>
                    <strong className="text-rose-600 font-bold">₹{Number(deal.totalDiscount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">Risk score exceeds tolerance limit</span>
                  <button
                    onClick={() => navigate('/sales/quotations')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Review Quotes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: DELIVERY RISK */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-base">Delivery Promise Slippage</h3>
            </div>
            <span className="text-xs bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
              {deliveryRisks.length} At Risk
            </span>
          </div>

          <div className="space-y-3">
            {deliveryRisks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All fulfillment plans are on schedule. No SLA delays.
              </div>
            ) : deliveryRisks.map((order, idx) => (
              <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{order.orderId || 'Order Item'}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">Warehouse: {order.warehouse}</h4>
                    <p className="text-xs text-slate-500">Quantity: {order.quantity} units</p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    Delayed ({order.daysOverdue} days)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-500">Estimated delivery date elapsed</span>
                  <button
                    onClick={() => navigate('/sales/fulfillment')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Fulfillment Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: APPROVAL DELAYS */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-base">Pending Approval Requests</h3>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
              {approvalDelays.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {approvalDelays.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No pending approval bottlenecks in the queue.
              </div>
            ) : approvalDelays.map((app) => (
              <div key={app.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{app.quotationVersion?.quotation?.quotationNumber || `REQ-${app.id.slice(0,6)}`}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">Assigned to: {app.assignedRole}</h4>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    Risk: {app.quotationVersion?.riskScore ?? 0}
                  </span>
                </div>
                <p className="text-xs text-slate-600">Total: ₹{Number(app.quotationVersion?.totalAmount || 0).toLocaleString('en-IN')}</p>
                <div className="flex justify-end pt-2 text-xs">
                  <button
                    onClick={() => navigate('/sales/approvals')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <span>Open Approval Queue</span>
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
