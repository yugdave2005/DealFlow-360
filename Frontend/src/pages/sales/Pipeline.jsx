import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Columns3, 
  List, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  TrendingUp, 
  Building,
  ShieldAlert,
  Send,
  MessageSquare,
  Package,
  Layers,
  FileText,
  IndianRupee,
  X,
  Download,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { exportToExcel, exportToPDF } from '../../lib/exportUtils';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

// 6 Core Commercial Pipeline Stages in Lifecycle Order
const PIPELINE_STAGES = [
  { 
    id: 'DRAFT', 
    label: 'Draft', 
    dotColor: 'bg-slate-400',
    borderColor: 'border-t-slate-400', 
    bgColor: 'bg-slate-50/50',
    emptyText: 'No deals in draft' 
  },
  { 
    id: 'PENDING_APPROVAL', 
    label: 'Pending Approval', 
    dotColor: 'bg-purple-500',
    borderColor: 'border-t-purple-500', 
    bgColor: 'bg-purple-50/30',
    emptyText: 'No approvals pending' 
  },
  { 
    id: 'SENT', 
    label: 'Sent / Review', 
    dotColor: 'bg-blue-500',
    borderColor: 'border-t-blue-500', 
    bgColor: 'bg-blue-50/30',
    emptyText: 'No proposals sent' 
  },
  { 
    id: 'UNDER_NEGOTIATION', 
    label: 'Under Negotiation', 
    dotColor: 'bg-amber-500',
    borderColor: 'border-t-amber-500', 
    bgColor: 'bg-amber-50/30',
    emptyText: 'No active negotiations' 
  },
  { 
    id: 'CONFIRMED', 
    label: 'Confirmed', 
    dotColor: 'bg-emerald-500',
    borderColor: 'border-t-emerald-500', 
    bgColor: 'bg-emerald-50/30',
    emptyText: 'No confirmed orders' 
  },
  { 
    id: 'FULFILLMENT', 
    label: 'Fulfillment', 
    dotColor: 'bg-cyan-500',
    borderColor: 'border-t-cyan-500', 
    bgColor: 'bg-cyan-50/30',
    emptyText: 'No orders in fulfillment' 
  },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['pipelineQuotations'],
    queryFn: async () => {
      try {
        const res = await quotationsApi.getQuotations();
        return res.data?.data || res.data || [];
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Failed to fetch pipeline:', error);
        }
        return [];
      }
    }
  });

  const getDaysInactive = (dateStr) => {
    if (!dateStr) return 0;
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Filter deals
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customer?.companyName || q.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      const riskLevel = v.riskLevel || (v.riskScore > 60 ? 'HIGH' : v.riskScore > 30 ? 'MEDIUM' : 'LOW');
      const matchRisk = riskFilter === 'ALL' || riskLevel === riskFilter;

      let stageKey = q.status;
      if (stageKey === 'APPROVAL_PENDING') stageKey = 'PENDING_APPROVAL';
      if (stageKey === 'NEGOTIATION' || stageKey === 'CUSTOMER_NEGOTIATION') stageKey = 'UNDER_NEGOTIATION';
      if (stageKey === 'PROCESSING' || stageKey === 'PAID') stageKey = 'FULFILLMENT';
      if (stageKey === 'APPROVED') stageKey = 'CONFIRMED';
      
      const matchStage = stageFilter === 'ALL' || stageKey === stageFilter;

      return matchSearch && matchRisk && matchStage;
    });
  }, [quotations, searchTerm, riskFilter, stageFilter]);

  // Group by pipeline stage
  const stageColumns = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.id] = [];
    });

    filteredQuotations.forEach(q => {
      let stageKey = q.status;
      if (stageKey === 'APPROVAL_PENDING') stageKey = 'PENDING_APPROVAL';
      if (stageKey === 'NEGOTIATION' || stageKey === 'CUSTOMER_NEGOTIATION') stageKey = 'UNDER_NEGOTIATION';
      if (stageKey === 'PROCESSING' || stageKey === 'PAID') stageKey = 'FULFILLMENT';
      if (stageKey === 'APPROVED') stageKey = 'CONFIRMED';

      if (grouped[stageKey]) {
        grouped[stageKey].push(q);
      } else {
        if (grouped['DRAFT']) grouped['DRAFT'].push(q);
      }
    });

    return grouped;
  }, [filteredQuotations]);

  // High-Level Pipeline KPI Metrics
  const pipelineMetrics = useMemo(() => {
    let totalValue = 0;
    let pendingApprovalValue = 0;
    let negotiationValue = 0;
    let confirmedValue = 0;

    quotations.forEach(q => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      const val = Number(v.totalAmount || q.totalAmount || 0) - Number(v.totalDiscount || 0);

      totalValue += val;
      if (q.status === 'PENDING_APPROVAL' || q.status === 'APPROVAL_PENDING') {
        pendingApprovalValue += val;
      }
      if (q.status === 'UNDER_NEGOTIATION' || q.status === 'NEGOTIATION') {
        negotiationValue += val;
      }
      if (q.status === 'CONFIRMED' || q.status === 'APPROVED') {
        confirmedValue += val;
      }
    });

    return {
      totalValue,
      activeCount: quotations.length,
      pendingApprovalValue,
      negotiationValue,
      confirmedValue
    };
  }, [quotations]);

  const handleExportExcel = () => {
    const exportData = filteredQuotations.map(q => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return {
        'Quote #': q.quotationNumber || `QT-${q.id.slice(0,6)}`,
        'Customer': q.customer?.companyName || q.customer?.name || 'Account Corporation',
        'Stage': q.status,
        'Amount': Number(v.totalAmount) || Number(q.totalAmount) || 0,
        'Discount': Number(v.totalDiscount) || 0,
        'Margin (%)': v.marginPercent || 25,
        'Risk Score': v.riskScore || 15,
        'Sales Rep': q.salesRep?.name || 'Representative'
      };
    });
    exportToExcel(exportData, 'Pipeline_Export', 'Pipeline');
  };

  const handleExportPDF = () => {
    const headers = ['Quote #', 'Customer', 'Stage', 'Amount', 'Margin', 'Risk', 'Rep'];
    const rows = filteredQuotations.map(q => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return [
        q.quotationNumber || `QT-${q.id.slice(0,6)}`,
        q.customer?.companyName || q.customer?.name || 'Account Corporation',
        q.status,
        (Number(v.totalAmount) || Number(q.totalAmount) || 0).toLocaleString('en-IN'),
        `${v.marginPercent || 25}%`,
        v.riskScore || 15,
        q.salesRep?.name || 'Representative'
      ];
    });
    exportToPDF(headers, rows, 'Pipeline_Report', 'Sales Pipeline Report');
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Visual stage-by-stage revenue flow & deal progression</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
               onClick={handleExportExcel}
               className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
               title="Export Excel"
            >
               <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
               onClick={handleExportPDF}
               className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
               title="Export PDF"
            >
               <FileDown className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/sales/quotations/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Pipeline</span>
          <p className="text-lg sm:text-xl font-black text-slate-900">
            ₹{pipelineMetrics.totalValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 font-medium block">
            {pipelineMetrics.activeCount} commercial opportunities
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
          <p className="text-lg sm:text-xl font-black text-purple-700">
            ₹{pipelineMetrics.pendingApprovalValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 font-medium block">
            Awaiting management sign-off
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Negotiation</span>
          <p className="text-lg sm:text-xl font-black text-amber-600">
            ₹{pipelineMetrics.negotiationValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 font-medium block">
            Customer counter-proposals
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed & Fulfillment</span>
          <p className="text-lg sm:text-xl font-black text-emerald-700">
            ₹{pipelineMetrics.confirmedValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 font-medium block">
            Converted to active orders
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation #, customer company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-semibold text-slate-400">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-semibold text-slate-400">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Pipeline View Area */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="grid grid-flow-col auto-cols-[280px] lg:auto-cols-[minmax(240px,1fr)] gap-4 items-start min-w-[1200px]">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = stageColumns[stage.id] || [];
              const stageValue = stageDeals.reduce((acc, q) => {
                const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                return acc + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
              }, 0);

              return (
                <div 
                  key={stage.id} 
                  className={`rounded-xl border border-slate-200/90 flex flex-col min-h-[440px] max-h-[calc(100vh-320px)] border-t-4 ${stage.borderColor} bg-slate-50/40 shadow-2xs`}
                >
                  {/* Column Header */}
                  <div className="p-3 bg-white border-b border-slate-200/80 rounded-t-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                        <span className="font-bold text-slate-900 text-xs">{stage.label}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md">
                          {stageDeals.length}
                        </span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-800 mt-1">
                        ₹{stageValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Deals Card Container */}
                  <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {stageDeals.length === 0 ? (
                      <div className="h-44 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200/80 rounded-lg bg-white/60">
                        <p className="text-xs font-semibold text-slate-400">{stage.emptyText}</p>
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const v = deal.activeVersion || (deal.versions && deal.versions[0]) || {};
                        const amount = Number(v.totalAmount) || Number(deal.totalAmount) || 0;
                        const discount = Number(v.totalDiscount) || 0;
                        const marginPercent = v.marginPercent || 25;
                        const riskScore = v.riskScore || 15;
                        const daysInactive = getDaysInactive(deal.updatedAt);
                        const isStalled = daysInactive >= 7;

                        return (
                          <div
                            key={deal.id}
                            onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                            className={`p-3 bg-white rounded-xl border transition-all duration-150 hover:shadow-md hover:border-indigo-300 cursor-pointer space-y-2 ${
                              isStalled ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90 shadow-2xs'
                            }`}
                          >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  {deal.quotationNumber || `QT-${deal.id.slice(0, 6)}`}
                                </span>
                                <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-1">
                                  {deal.customer?.companyName || deal.customer?.name || 'Account Corporation'}
                                </h4>
                              </div>
                              <RiskBadge score={riskScore} level={v.riskLevel} />
                            </div>

                            {/* Card Financial Details */}
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-slate-500 font-medium">Value</span>
                                <span className="font-black text-slate-900">₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
                                <span>Margin: <strong className="text-emerald-700 font-bold">{marginPercent}%</strong></span>
                                {discount > 0 && (
                                  <span className="text-rose-600 font-semibold">Disc: ₹{discount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                )}
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[80px]">{deal.salesRep?.name || 'Representative'}</span>
                              </div>

                              <div className={`flex items-center gap-1 font-semibold ${isStalled ? 'text-amber-700' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{daysInactive}d in stage</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* TABLE LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Deal Amount</th>
                  <th className="py-3 px-4 text-center">Margin</th>
                  <th className="py-3 px-4 text-center">Risk Level</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No active quotations found in this filter view.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((deal) => {
                    const v = deal.activeVersion || (deal.versions && deal.versions[0]) || {};
                    const amount = Number(v.totalAmount) || Number(deal.totalAmount) || 0;
                    const margin = v.marginPercent || 25;
                    const risk = v.riskScore || 15;

                    return (
                      <tr 
                        key={deal.id}
                        onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {deal.quotationNumber || `QT-${deal.id.slice(0, 6)}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {deal.customer?.companyName || deal.customer?.name || 'Account Corporation'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={deal.status} />
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">
                          {margin}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <RiskBadge score={risk} level={v.riskLevel} />
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {deal.salesRep?.name || 'Representative'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                            View Deal &rarr;
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      )}

    </div>
  );
}
