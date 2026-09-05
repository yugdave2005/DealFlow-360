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

export default function DealHealth() {
  const navigate = useNavigate();

  // Deal Health Categories Data
  const stalledDeals = [
    {
      id: 'qt-1024',
      quoteNumber: 'QT-1024',
      customer: 'Acme Corporation Ltd',
      amount: 124000,
      daysInactive: 8,
      status: 'UNDER_NEGOTIATION',
      reason: 'Customer has not responded to counter-proposal sent 8 days ago.'
    },
    {
      id: 'qt-1019',
      quoteNumber: 'QT-1019',
      customer: 'Sterling Manufacturing',
      amount: 62000,
      daysInactive: 12,
      status: 'DRAFT',
      reason: 'Draft proposal untouched since initial line item entry.'
    }
  ];

  const discountAnomalies = [
    {
      id: 'qt-1024',
      quoteNumber: 'QT-1024',
      customer: 'Beta Industries',
      typicalDiscount: '8%',
      appliedDiscount: '19%',
      exceededBy: '+11%',
      riskScore: 68,
      riskLevel: 'HIGH',
      reason: 'Applied discount exceeds rep baseline by 110% without executive memo.'
    },
    {
      id: 'qt-1031',
      quoteNumber: 'QT-1031',
      customer: 'Apex Logistics Hub',
      typicalDiscount: '5%',
      appliedDiscount: '15%',
      exceededBy: '+10%',
      riskScore: 54,
      riskLevel: 'MEDIUM',
      reason: 'Hardware unit price dropped below cost floor.'
    }
  ];

  const deliveryRisks = [
    {
      orderId: 'ORD-1003',
      customer: 'Gujarat Infotech Solutions',
      product: 'Managed Firewall Gateway X-500',
      expectedSLA: '2 days',
      currentEstimate: '5 days',
      delayDays: '+3 days',
      status: 'AT_RISK',
      reason: 'Anand Regional Depot stock depleted, waiting for OEM re-route.'
    }
  ];

  const approvalDelays = [
    {
      quoteNumber: 'QT-1024',
      customer: 'Acme Corporation Ltd',
      level: 'SALES_MANAGER',
      pendingSince: '4 business days',
      approver: 'Rajiv Malhotra (Sales Director)'
    }
  ];

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
            {stalledDeals.map((deal) => (
              <div key={deal.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{deal.quoteNumber}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{deal.customer}</h4>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Inactive {deal.daysInactive} days
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{deal.reason}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="font-bold text-slate-900">₹{deal.amount.toLocaleString('en-IN')}</span>
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
              Risk Thresholds Exceeded
            </span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.map((deal) => (
              <div key={deal.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{deal.quoteNumber}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{deal.customer}</h4>
                  </div>
                  <RiskBadge score={deal.riskScore} level={deal.riskLevel} />
                </div>
                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs mb-2">
                  <div>
                    <span className="text-slate-400 block">Typical Rep:</span>
                    <strong className="text-slate-700">{deal.typicalDiscount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Applied:</span>
                    <strong className="text-rose-600">{deal.appliedDiscount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Anomaly:</span>
                    <strong className="text-rose-700 font-bold">{deal.exceededBy}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">{deal.reason}</span>
                  <button
                    onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Review Quote</span>
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
              SLA Threat
            </span>
          </div>

          <div className="space-y-3">
            {deliveryRisks.map((order) => (
              <div key={order.orderId} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{order.orderId}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{order.customer}</h4>
                    <p className="text-xs text-slate-500">{order.product}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    Delayed ({order.delayDays})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 my-2">
                  <span>Target SLA: <strong>{order.expectedSLA}</strong></span>
                  <span className="text-rose-600 font-bold">Estimated: {order.currentEstimate}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-500">{order.reason}</span>
                  <button
                    onClick={() => navigate(`/sales/fulfillment/${order.orderId}`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Re-route Inventory</span>
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
              <h3 className="font-bold text-slate-900 text-base">Approval Delays</h3>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
              Escalations
            </span>
          </div>

          <div className="space-y-3">
            {approvalDelays.map((app, idx) => (
              <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{app.quoteNumber}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{app.customer}</h4>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    Pending {app.pendingSince}
                  </span>
                </div>
                <p className="text-xs text-slate-600">Assigned Reviewer: <strong>{app.approver}</strong></p>
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
