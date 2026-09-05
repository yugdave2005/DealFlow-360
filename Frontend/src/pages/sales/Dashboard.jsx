import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckSquare, 
  AlertTriangle, 
  IndianRupee, 
  ArrowUpRight, 
  Clock, 
  Plus, 
  ShieldAlert, 
  Truck, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { exportToExcel, exportToPDF } from '../../lib/exportUtils';

import { api } from '../../lib/axios';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { dashboardApi } from '../../features/dashboard/dashboard.api';
import { dealHealthApi } from '../../features/deal-health/deal-health.api';

const fetchDashboardData = async () => {
  const [metricsRes, quotesRes, healthRes] = await Promise.all([
    dashboardApi.getSalesMetrics().catch(() => ({ data: { data: null } })),
    quotationsApi.getQuotations().catch(() => ({ data: { data: [] } })),
    dealHealthApi.getDealHealthOverview().catch(() => ({ data: { data: null } })),
  ]);

  const metrics = metricsRes?.data?.data || null;
  const quotes = quotesRes?.data?.data || [];
  const health = healthRes?.data?.data || null;

  return { metrics, quotes, health };
};

// Simple Error Boundary to trap React Crashes locally
class DashboardErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Dashboard Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto bg-rose-50 rounded-2xl border border-rose-200 mt-10">
          <h2 className="text-xl font-bold text-rose-700">Dashboard Render Crash</h2>
          <p className="text-sm text-rose-600 mt-2">{this.state.error?.toString()}</p>
          <pre className="mt-4 p-4 bg-white rounded-lg border border-rose-100 text-xs overflow-auto">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['salesDashboard'],
    queryFn: fetchDashboardData
  });

  const quotes = data?.quotes || [];
  const metrics = data?.metrics || {
    activeQuotations: 0,
    pendingApprovals: 0,
    atRiskDeals: 0
  };
  const health = data?.health || {
    anomalyCount: 0,
    stalledDeals: []
  };

  // Compute Pipeline Value from active quotes
  const pipelineValue = quotes.reduce((sum, q) => {
    const activeVersion = q.versions?.find(v => v.id === q.activeVersionId) || q.versions?.[0];
    const amount = Number(activeVersion?.totalAmount || 0) - Number(activeVersion?.totalDiscount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Derive "Needs Your Attention" items based on real deal conditions
  const attentionItems = [];
  
  // Pending approvals
  quotes.filter(q => q.status === 'PENDING_APPROVAL').slice(0, 2).forEach(q => {
    attentionItems.push({
      id: `appr-${q.id}`,
      type: 'Pending Approval',
      quote: q.quotationNumber,
      title: `${q.quotationNumber} requires manager authorization`,
      reason: 'Discount limit exceeded standard representative threshold',
      riskScore: 68,
      actionUrl: `/sales/approvals`,
      icon: CheckSquare,
      color: 'purple'
    });
  });

  // Negotiation items
  quotes.filter(q => q.status === 'NEGOTIATION' || q.status === 'UNDER_NEGOTIATION').slice(0, 2).forEach(q => {
    attentionItems.push({
      id: `neg-${q.id}`,
      type: 'Customer Negotiation',
      quote: q.quotationNumber,
      title: `${q.quotationNumber} customer requested term adjustment`,
      reason: 'Counter-offer received on line item pricing',
      riskScore: 45,
      actionUrl: `/sales/quotations/${q.id}`,
      icon: MessageSquare,
      color: 'amber'
    });
  });

  // Stalled items from deal-health
  health?.stalledDeals?.slice(0, 2).forEach(d => {
    attentionItems.push({
      id: `stalled-${d.id}`,
      type: 'Stalled Quotation',
      quote: d.quotationNumber,
      title: `${d.quotationNumber} inactive for ${d.daysSinceUpdate} days`,
      reason: `Deal currently in ${d.status} without updates`,
      riskScore: 55,
      actionUrl: `/sales/quotations/${d.id}`,
      icon: Clock,
      color: 'red'
    });
  });

  // Derive real activity stream from recent quotations and approvals
  const activityStream = useMemo(() => {
    const events = [];
    quotes.forEach(q => {
      if (q.status === 'PENDING_APPROVAL') {
        events.push({
          id: `act-${q.id}-appr`,
          icon: CheckSquare,
          iconBg: 'bg-purple-50 text-purple-600',
          title: 'Submitted for Approval',
          detail: `${q.quotationNumber} submitted for manager review`,
          time: new Date(q.updatedAt || q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          link: `/sales/quotations/${q.id}`
        });
      } else if (q.status === 'APPROVED') {
        events.push({
          id: `act-${q.id}-appvd`,
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-emerald-600',
          title: 'Quotation Approved',
          detail: `Manager authorized terms for ${q.customer?.companyName || q.customer?.name || q.quotationNumber}`,
          time: new Date(q.updatedAt || q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          link: `/sales/quotations/${q.id}`
        });
      } else if (q.status === 'CONFIRMED') {
        events.push({
          id: `act-${q.id}-conf`,
          icon: Truck,
          iconBg: 'bg-cyan-50 text-cyan-600',
          title: 'Order Confirmed',
          detail: `Order confirmed & entered warehouse allocation`,
          time: new Date(q.updatedAt || q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          link: `/sales/quotations/${q.id}`
        });
      } else if (q.status === 'UNDER_NEGOTIATION' || q.status === 'NEGOTIATION') {
        events.push({
          id: `act-${q.id}-neg`,
          icon: MessageSquare,
          iconBg: 'bg-amber-50 text-amber-600',
          title: 'Customer Negotiation',
          detail: `Customer requested counter concession on ${q.quotationNumber}`,
          time: new Date(q.updatedAt || q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          link: `/sales/quotations/${q.id}`
        });
      }
    });
    return events.slice(0, 6);
  }, [quotes]);

  if (isLoading) {
    return <LoadingSkeleton type="table" rows={6} />;
  }

  const handleExportExcel = () => {
    const exportData = quotes.map(q => {
      const v = q.activeVersion || q.versions?.[0] || {};
      const amount = Number(v.totalAmount || 0);
      return {
        'Quote #': q.quotationNumber,
        'Customer': q.customer?.name || 'Account Corporation',
        'Amount': amount,
        'Discount': Number(v.totalDiscount || 0),
        'Risk': v.riskScore || 20,
        'Status': q.status
      };
    });
    exportToExcel(exportData, 'Dashboard_Quotations', 'Dashboard');
  };

  const handleExportPDF = () => {
    const headers = ['Quote #', 'Customer', 'Amount', 'Discount', 'Risk', 'Status'];
    const rows = quotes.map(q => {
      const v = q.activeVersion || q.versions?.[0] || {};
      const amount = Number(v.totalAmount || 0);
      return [
        q.quotationNumber,
        q.customer?.name || 'Account Corporation',
        amount.toLocaleString('en-IN'),
        Number(v.totalDiscount || 0).toLocaleString('en-IN'),
        v.riskScore || 20,
        q.status
      ];
    });
    exportToPDF(headers, rows, 'Dashboard_Report', 'Sales Dashboard Report');
  };

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-0">
        <div>
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
            Sales Overview
          </h1>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Pipeline performance and active quotation pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#FAF9F6] p-1 rounded-[10px] border border-[#E6E1D9] shadow-xs h-10">
            <button onClick={handleExportExcel} className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors" title="Export Excel">
               <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button onClick={handleExportPDF} className="p-2 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors" title="Export PDF">
               <FileDown className="w-4 h-4" />
            </button>
          </div>
          <Link 
            to="/sales/quotations/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-xs shrink-0 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Quotations */}
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Active Quotations</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#4A90D9]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">{quotes.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">In Draft, Negotiation, or Sent</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#8B6CC7]">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">{quotes.filter(q => q.status === 'PENDING_APPROVAL').length}</h2>
          <p className="text-[#96918A] text-xs mt-2">Awaiting management review</p>
        </div>

        {/* At-Risk Deals */}
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">At-Risk Deals</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#C95757]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#C95757] mt-2">
            {quotes.filter(q => {
              const v = q.activeVersion || (q.versions && q.versions[0]) || {};
              return (v.riskScore || 0) > 40;
            }).length}
          </h2>
          <p className="text-[#96918A] text-xs mt-2">Risk score above configured threshold</p>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Pipeline Value</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#3F8F63]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">
            ₹{pipelineValue.toLocaleString('en-IN')}
          </h2>
          <p className="text-[#96918A] text-xs mt-2">Total value of active opportunities</p>
        </div>
      </div>

      {/* Grid: Needs Attention & Real-time Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Needs Your Attention (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E6E1D9] p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E6E1D9]/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D9A654]" />
              <h2 className="text-[15px] font-semibold text-[#171717]">Needs Your Attention</h2>
            </div>
            <span className="text-xs text-[#96918A] font-medium">
              {attentionItems.length > 0 ? `${attentionItems.length} action item(s)` : 'All deals healthy'}
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#3F8F63] mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-[#171717]">No urgent risks or bottlenecks</p>
              <p className="text-xs text-[#96918A] mt-1 max-w-sm">All pending quotations and approvals are currently progressing within threshold SLA limits.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {attentionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.actionUrl)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-[10px] border border-[#E6E1D9] bg-[#FAF9F6] hover:bg-[#F5F2ED] hover:border-[#D8D1C8] transition-all cursor-pointer group gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-[8px] shrink-0 mt-0.5 flex items-center justify-center ${
                        item.color === 'purple' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        item.color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#171717] group-hover:text-[#D97757] transition-colors">{item.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-[#F5F2ED] border border-[#E6E1D9] rounded-full text-[#6F6B66]">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#96918A] mt-0.5">{item.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <RiskBadge score={item.riskScore} />
                      <div className="p-1 rounded-lg text-[#96918A] group-hover:text-[#D97757] group-hover:translate-x-0.5 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Stream */}
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E6E1D9]/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D97757]" />
              <h2 className="text-[15px] font-semibold text-[#171717]">Real-time Stream</h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#3F8F63] ring-4 ring-[#3F8F63]/15"></span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {activityStream.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#96918A] italic">
                No recent activity yet.
              </div>
            ) : (
              activityStream.map((event) => {
                const Icon = event.icon;
                return (
                  <Link
                    key={event.id}
                    to={event.link}
                    className="flex items-start gap-3 group"
                  >
                    <div className={`p-2 rounded-[10px] shrink-0 mt-0.5 ${event.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-[#171717] group-hover:text-[#D97757] transition-colors truncate">
                          {event.title}
                        </p>
                        <span className="text-[10px] text-[#96918A] shrink-0">{event.time}</span>
                      </div>
                      <p className="text-[11px] text-[#96918A] mt-0.5 leading-tight">{event.detail}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E6E1D9]/60 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#171717]">Recent Quotations</h2>
            <p className="text-xs text-[#96918A] mt-0.5">Active commercial deals across your pipeline</p>
          </div>
          <Link to="/sales/quotations" className="text-xs font-semibold text-[#D97757] hover:text-[#C96648] flex items-center gap-1 transition-colors">
            View All Quotations &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#6F6B66] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Quote</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Discount</th>
                <th className="py-3.5 px-5">Margin</th>
                <th className="py-3.5 px-5">Risk</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D9]/50 text-[#3D3A36]">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-[#96918A]">
                    No quotations generated yet. Click "+ New Quotation" to formulate a deal.
                  </td>
                </tr>
              ) : (
                quotes.slice(0, 6).map((quote) => {
                  const activeVersion = quote.versions?.find(v => v.id === quote.activeVersionId) || quote.versions?.[0];
                  const amount = Number(activeVersion?.totalAmount || 0);
                  const discount = Number(activeVersion?.totalDiscount || 0);
                  const discountPct = amount > 0 ? ((discount / amount) * 100).toFixed(0) : '0';
                  const marginPct = (100 - Number(discountPct) - 25).toFixed(0); // Estimated margin formula based on cost model

                  return (
                    <tr key={quote.id} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="py-3.5 px-5 font-semibold text-[#171717]">
                        <Link to={`/sales/quotations/${quote.id}`} className="text-[#D97757] hover:text-[#C96648] hover:underline font-mono tracking-tight">
                          {quote.quotationNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#3D3A36]">
                        {quote.customer?.name || `Customer #${quote.customerId.slice(-6)}`}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-[#171717]">
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-[#6F6B66]">
                        {discountPct}% <span className="text-[10px] text-[#96918A]">(-₹{discount.toLocaleString('en-IN')})</span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#3F8F63]">
                        {marginPct}%
                      </td>
                      <td className="py-3.5 px-5">
                        <RiskBadge score={activeVersion?.riskScore || 20} />
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/sales/quotations/${quote.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[8px] bg-[#F5F2ED] text-[#6F6B66] hover:bg-[#D97757]/10 hover:text-[#D97757] border border-[#E6E1D9] transition-colors"
                        >
                          Open &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
