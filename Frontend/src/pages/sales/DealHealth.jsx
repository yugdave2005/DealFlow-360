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
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0">
        <div>
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
            Deal Health & Risk Radar
          </h1>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Automated detection of stalled negotiations, discount anomalies & delivery slippage
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Stalled Deals</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#D9A654]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#D9A654] mt-2">{stalledDeals.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">&gt; 7 days without progress</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Discount Anomalies</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#C95757]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#C95757] mt-2">{discountAnomalies.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">Exceeds rep baseline</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Delivery At-Risk</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#D97757]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#D97757] mt-2">{deliveryRisks.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">SLA slippage detected</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Approval Bottlenecks</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#8B6CC7]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#8B6CC7] mt-2">{approvalDelays.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">&gt; 48h in review queue</p>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: STALLED DEALS */}
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D9A654]" />
              <h3 className="text-[15px] font-semibold text-[#171717]">Stalled Deals</h3>
            </div>
            <span className="text-xs bg-amber-50 text-[#D9A654] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              {stalledDeals.length} Action Needed
            </span>
          </div>

          <div className="space-y-3">
            {stalledDeals.length === 0 ? (
              <div className="p-6 text-center text-[#96918A] text-xs font-medium bg-[#FAF9F6] rounded-[10px] border border-dashed border-[#E6E1D9]">
                <CheckCircle2 className="w-6 h-6 text-[#3F8F63] mx-auto mb-1.5" />
                No stalled quotations. All deals moving actively.
              </div>
            ) : stalledDeals.map((deal) => (
              <div key={deal.id} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9] hover:border-[#D8D1C8] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#D97757]">{deal.quotationNumber || `QT-${deal.id.slice(0,6)}`}</span>
                    <h4 className="font-semibold text-[#171717] text-sm mt-0.5">{deal.status}</h4>
                  </div>
                  <span className="text-xs font-semibold text-[#D9A654] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Inactive {deal.daysSinceUpdate || 0} days
                  </span>
                </div>
                <p className="text-xs text-[#6F6B66] mb-3">No activity recorded for over 7 days in status: {deal.status}</p>
                <div className="flex items-center justify-end pt-2 border-t border-[#E6E1D9]/60 text-xs">
                  <button
                    onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                    className="text-[#D97757] hover:text-[#C96648] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#C95757]" />
              <h3 className="text-[15px] font-semibold text-[#171717]">Discount Anomalies</h3>
            </div>
            <span className="text-xs bg-rose-50 text-[#C95757] font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {discountAnomalies.length} High Risk
            </span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.length === 0 ? (
              <div className="p-6 text-center text-[#96918A] text-xs font-medium bg-[#FAF9F6] rounded-[10px] border border-dashed border-[#E6E1D9]">
                <CheckCircle2 className="w-6 h-6 text-[#3F8F63] mx-auto mb-1.5" />
                No discount anomalies detected. Margins are compliant.
              </div>
            ) : discountAnomalies.map((deal, idx) => (
              <div key={idx} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9] hover:border-[#D8D1C8] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#D97757]">{deal.quotationNumber || `V${deal.versionNumber}`}</span>
                    <h4 className="font-semibold text-[#171717] text-sm mt-0.5">Created by {deal.createdBy || 'Sales Rep'}</h4>
                  </div>
                  <RiskBadge score={deal.riskScore} />
                </div>
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-[8px] border border-[#E6E1D9] text-xs mb-2">
                  <div>
                    <span className="text-[#96918A] block">Total Amount:</span>
                    <strong className="text-[#171717] font-bold">₹{Number(deal.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[#96918A] block">Total Discount:</span>
                    <strong className="text-[#C95757] font-bold">₹{Number(deal.totalDiscount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#96918A]">Risk score exceeds tolerance limit</span>
                  <button
                    onClick={() => navigate('/sales/quotations')}
                    className="text-[#D97757] hover:text-[#C96648] font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors"
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
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D97757]" />
              <h3 className="text-[15px] font-semibold text-[#171717]">Delivery Promise Slippage</h3>
            </div>
            <span className="text-xs bg-orange-50 text-[#D97757] font-semibold px-2.5 py-0.5 rounded-full border border-orange-200">
              {deliveryRisks.length} At Risk
            </span>
          </div>

          <div className="space-y-3">
            {deliveryRisks.length === 0 ? (
              <div className="p-6 text-center text-[#96918A] text-xs font-medium bg-[#FAF9F6] rounded-[10px] border border-dashed border-[#E6E1D9]">
                <CheckCircle2 className="w-6 h-6 text-[#3F8F63] mx-auto mb-1.5" />
                All fulfillment plans are on schedule. No SLA delays.
              </div>
            ) : deliveryRisks.map((order, idx) => (
              <div key={idx} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9] hover:border-[#D8D1C8] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#D97757]">{order.orderId || 'Order Item'}</span>
                    <h4 className="font-semibold text-[#171717] text-sm mt-0.5">Warehouse: {order.warehouse}</h4>
                    <p className="text-xs text-[#96918A]">Quantity: {order.quantity} units</p>
                  </div>
                  <span className="text-xs font-semibold text-[#C95757] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Delayed ({order.daysOverdue} days)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-[#96918A]">Estimated delivery date elapsed</span>
                  <button
                    onClick={() => navigate('/sales/fulfillment')}
                    className="text-[#D97757] hover:text-[#C96648] font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors"
                  >
                    <span>View Fulfillment</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: APPROVAL DELAYS */}
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#8B6CC7]" />
              <h3 className="text-[15px] font-semibold text-[#171717]">Pending Approval Requests</h3>
            </div>
            <span className="text-xs bg-purple-50 text-[#8B6CC7] font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">
              {approvalDelays.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {approvalDelays.length === 0 ? (
              <div className="p-6 text-center text-[#96918A] text-xs font-medium bg-[#FAF9F6] rounded-[10px] border border-dashed border-[#E6E1D9]">
                <CheckCircle2 className="w-6 h-6 text-[#3F8F63] mx-auto mb-1.5" />
                No pending approval bottlenecks in the queue.
              </div>
            ) : approvalDelays.map((app) => (
              <div key={app.id} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9] hover:border-[#D8D1C8] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#D97757]">{app.quotationVersion?.quotation?.quotationNumber || `REQ-${app.id.slice(0,6)}`}</span>
                    <h4 className="font-semibold text-[#171717] text-sm mt-0.5">Assigned to: {app.assignedRole}</h4>
                  </div>
                  <span className="text-xs font-semibold text-[#8B6CC7] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                    Risk: {app.quotationVersion?.riskScore ?? 0}
                  </span>
                </div>
                <p className="text-xs text-[#6F6B66]">Total: ₹{Number(app.quotationVersion?.totalAmount || 0).toLocaleString('en-IN')}</p>
                <div className="flex justify-end pt-2 text-xs">
                  <button
                    onClick={() => navigate('/sales/approvals')}
                    className="text-[#D97757] hover:text-[#C96648] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
