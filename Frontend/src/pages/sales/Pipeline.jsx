import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Columns3, 
  List, 
  Search, 
  Plus, 
  Clock, 
  User as UserIcon, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  X,
  FileText
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { api } from '../../lib/axios';

// Commercial Pipeline Stages in Lifecycle Order with Clean Dot Accents
const PIPELINE_STAGES = [
  { 
    id: 'DRAFT', 
    label: 'Draft', 
    dotColor: 'bg-[#8C99A8]',
    emptyText: 'No deals in draft' 
  },
  { 
    id: 'PENDING_APPROVAL', 
    label: 'Pending Approval', 
    dotColor: 'bg-[#C98A32]',
    emptyText: 'No approvals pending' 
  },
  { 
    id: 'SENT', 
    label: 'Sent / Review', 
    dotColor: 'bg-[#6F8FB5]',
    emptyText: 'No proposals sent' 
  },
  { 
    id: 'UNDER_NEGOTIATION', 
    label: 'Under Negotiation', 
    dotColor: 'bg-[#D97757]',
    emptyText: 'No active negotiations' 
  },
  { 
    id: 'CONFIRMED', 
    label: 'Confirmed', 
    dotColor: 'bg-[#3F8F63]',
    emptyText: 'No confirmed deals' 
  },
  { 
    id: 'FULFILLMENT', 
    label: 'Fulfillment', 
    dotColor: 'bg-[#5D83A8]',
    emptyText: 'No orders in fulfillment' 
  },
];

function formatCurrency(amount) {
  const num = Number(amount || 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

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
        const res = await api.get('/quotations');
        return res.data || [];
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
      const score = Number(v.riskScore || 0);
      let riskLevel = v.riskLevel;
      if (!riskLevel) {
        if (score >= 45) riskLevel = 'HIGH';
        else if (score >= 20) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';
      }
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

  if (isLoading) {
    return (
      <div className="w-full px-6 sm:px-8 py-6 space-y-6">
        <LoadingSkeleton type="table" rows={7} />
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* 1. Page Header (Clean, uncarded canvas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0">
        <div>
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
            Sales Pipeline
          </h1>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Visual stage-by-stage revenue flow & deal progression
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Toggle (Board / List) */}
          <div className="flex items-center bg-[#F5F2ED] p-1 rounded-[10px] border border-[#E6E1D9] h-[38px]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`h-7 px-3 rounded-[8px] text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                viewMode === 'kanban' 
                  ? 'bg-white text-[#171717] shadow-xs border border-[#E6E1D9] font-semibold' 
                  : 'text-[#6F6B66] hover:text-[#171717]'
              }`}
              title="Kanban Board View"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-7 px-3 rounded-[8px] text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                viewMode === 'table' 
                  ? 'bg-white text-[#171717] shadow-xs border border-[#E6E1D9] font-semibold' 
                  : 'text-[#6F6B66] hover:text-[#171717]'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* New Quotation Action */}
          <Link
            to="/sales/quotations/new"
            className="inline-flex items-center gap-2 h-10 px-4 sm:px-5 bg-[#D97757] hover:bg-[#C96648] active:scale-95 text-white text-sm font-semibold rounded-[9px] shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Metrics Strip (4 Compact Premium Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active Pipeline */}
        <div className="bg-white p-4 sm:p-5 rounded-[12px] border border-[#E6E1D9] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider block">
            Active Pipeline
          </span>
          <p className="text-2xl sm:text-[28px] font-semibold text-[#171717] tracking-tight">
            ₹{pipelineMetrics.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-[#6F6B66] block">
            {pipelineMetrics.activeCount} commercial opportunities
          </span>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 sm:p-5 rounded-[12px] border border-[#E6E1D9] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider block">
            Pending Approvals
          </span>
          <p className={`text-2xl sm:text-[28px] font-semibold tracking-tight ${
            pipelineMetrics.pendingApprovalValue > 0 ? 'text-[#C98A32]' : 'text-[#171717]'
          }`}>
            ₹{pipelineMetrics.pendingApprovalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-[#6F6B66] block">
            Awaiting management sign-off
          </span>
        </div>

        {/* In Negotiation */}
        <div className="bg-white p-4 sm:p-5 rounded-[12px] border border-[#E6E1D9] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider block">
            In Negotiation
          </span>
          <p className={`text-2xl sm:text-[28px] font-semibold tracking-tight ${
            pipelineMetrics.negotiationValue > 0 ? 'text-[#D97757]' : 'text-[#171717]'
          }`}>
            ₹{pipelineMetrics.negotiationValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-[#6F6B66] block">
            Customer counter-proposals
          </span>
        </div>

        {/* Confirmed & Fulfillment */}
        <div className="bg-white p-4 sm:p-5 rounded-[12px] border border-[#E6E1D9] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider block">
            Confirmed & Fulfillment
          </span>
          <p className={`text-2xl sm:text-[28px] font-semibold tracking-tight ${
            pipelineMetrics.confirmedValue > 0 ? 'text-[#3F8F63]' : 'text-[#171717]'
          }`}>
            ₹{pipelineMetrics.confirmedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-[#6F6B66] block">
            Converted to active orders
          </span>
        </div>
      </div>

      {/* 3. Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#96918A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quotation #, customer company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-8 bg-white border border-[#E6E1D9] rounded-[9px] text-xs sm:text-sm text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Stage Filter */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none h-10 pl-3.5 pr-8 bg-white border border-[#E6E1D9] rounded-[9px] text-xs sm:text-sm font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs cursor-pointer"
            >
              <option value="ALL">Stage: All Stages</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#96918A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="appearance-none h-10 pl-3.5 pr-8 bg-white border border-[#E6E1D9] rounded-[9px] text-xs sm:text-sm font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs cursor-pointer"
            >
              <option value="ALL">Risk: All Risk Levels</option>
              <option value="LOW">Low Risk (&lt;20)</option>
              <option value="MEDIUM">Medium Risk (20-45)</option>
              <option value="HIGH">High Risk (&gt;45)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#96918A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear Filters Reset */}
          {(searchTerm || riskFilter !== 'ALL' || stageFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('ALL');
                setStageFilter('ALL');
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#C95757] hover:text-[#A83D3D] px-2.5 py-2 transition-colors rounded-[9px] hover:bg-[#FBEAEA] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Pipeline View Area */}
      {viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#E6E1D9]">
          <div className="flex gap-3.5 sm:gap-4 items-start min-w-[1200px]">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = stageColumns[stage.id] || [];
              const stageValue = stageDeals.reduce((acc, q) => {
                const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                return acc + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
              }, 0);

              return (
                <div 
                  key={stage.id} 
                  className="bg-[#F7F5F1] rounded-[12px] border border-[#E6E1D9] flex flex-col min-h-[480px] max-h-[calc(100vh-280px)] flex-1 min-w-[280px] max-w-[360px] shadow-2xs"
                >
                  {/* Column Header (Subtle dot accent, clean count & total) */}
                  <div className="p-3.5 bg-white border-b border-[#E6E1D9] rounded-t-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stage.dotColor} shrink-0`} />
                      <span className="font-semibold text-[#171717] text-xs sm:text-[13px]">
                        {stage.label}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#F5F2ED] text-[#6F6B66] font-medium text-[11px] rounded-full border border-[#E6E1D9]">
                        {stageDeals.length}
                      </span>
                    </div>

                    <p className="text-xs text-[#6F6B66] font-medium">
                      {formatCurrency(stageValue)}
                    </p>
                  </div>

                  {/* Deals Card Container */}
                  <div className="p-3 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin scrollbar-thumb-[#E6E1D9]">
                    {stageDeals.length === 0 ? (
                      <div className="h-36 flex flex-col items-center justify-center text-center p-3">
                        <FileText className="w-5 h-5 text-[#96918A]/60 mb-1.5 stroke-[1.5]" />
                        <p className="text-xs text-[#96918A] font-medium">{stage.emptyText}</p>
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const v = deal.activeVersion || (deal.versions && deal.versions[0]) || {};
                        const amount = Number(v.totalAmount) || Number(deal.totalAmount) || 0;
                        const discount = Number(v.totalDiscount) || 0;
                        const marginPercent = v.marginPercent || 25;
                        const riskScore = v.riskScore || 15;
                        const daysInactive = getDaysInactive(deal.updatedAt || deal.createdAt);
                        const isStalled = daysInactive >= 7;

                        return (
                          <div
                            key={deal.id}
                            onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                            className={`p-3.5 bg-white rounded-[10px] border border-[#E6E1D9] hover:border-[#D8D1C8] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-xs transition-all duration-150 cursor-pointer space-y-2 hover:-translate-y-0.5 group ${
                              isStalled ? 'border-[#F3DFBD] bg-[#FFFDF9]' : ''
                            }`}
                          >
                            {/* Card Top Row: Quote Number & Risk Badge */}
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-xs font-semibold text-[#D97757] group-hover:text-[#C96648] font-mono tracking-tight">
                                {deal.quotationNumber || `QT-${deal.id.slice(0, 6)}`}
                              </span>
                              <RiskBadge score={riskScore} level={v.riskLevel} />
                            </div>

                            {/* Customer Name */}
                            <h4 className="font-semibold text-[#171717] text-xs sm:text-[13.5px] leading-snug line-clamp-1">
                              {deal.customer?.companyName || deal.customer?.name || 'Customer Account'}
                            </h4>

                            {/* Quote Financial Details (Strong Value + Margin) */}
                            <div className="flex items-baseline justify-between pt-0.5">
                              <span className="text-base font-semibold text-[#171717]">
                                ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-xs font-medium text-[#3F8F63]">
                                Margin {marginPercent}%
                              </span>
                            </div>

                            {/* Card Footer: Sales Rep & Time in Stage */}
                            <div className="flex items-center justify-between text-[11px] text-[#96918A] pt-2 border-t border-[#EEEAE4]">
                              <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                <UserIcon className="w-3.5 h-3.5 text-[#96918A] shrink-0" />
                                <span className="truncate">{deal.salesRep?.name || 'Representative'}</span>
                              </div>

                              <div className={`flex items-center gap-1 font-medium ${
                                isStalled ? 'text-[#C98A32]' : 'text-[#96918A]'
                              }`}>
                                <Clock className="w-3 h-3 shrink-0" />
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
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-xs font-semibold text-[#6F6B66] uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Quotation #</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Customer Account</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Stage</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Deal Amount</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap text-center">Margin</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Risk Level</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Sales Rep</th>
                  <th className="py-3.5 px-6 font-semibold text-right whitespace-nowrap min-w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4] text-[#171717]">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#96918A] text-sm">
                      No active quotations found matching your search and filter criteria.
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
                        className="bg-white hover:bg-[#FBFAF8] cursor-pointer transition-colors duration-150 group h-[68px]"
                      >
                        <td className="py-3.5 px-5 font-semibold whitespace-nowrap">
                          <span className="text-[#D97757] group-hover:text-[#C96648] font-mono tracking-tight font-semibold hover:underline">
                            {deal.quotationNumber || `QT-${deal.id.slice(0, 6)}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#171717] text-sm whitespace-nowrap">
                          {deal.customer?.companyName || deal.customer?.name || 'Customer Account'}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <StatusBadge status={deal.status} />
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#171717] text-sm whitespace-nowrap">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3.5 px-5 text-center font-semibold text-[#3F8F63] text-sm whitespace-nowrap">
                          {margin}%
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <RiskBadge score={risk} level={v.riskLevel} />
                        </td>
                        <td className="py-3.5 px-5 text-[#6F6B66] text-xs sm:text-sm whitespace-nowrap">
                          {deal.salesRep?.name || 'Representative'}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-[#D97757] group-hover:text-[#C96648] inline-flex items-center gap-1">
                            <span>View</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
