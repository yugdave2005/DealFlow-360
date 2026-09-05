import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Copy, 
  Send, 
  CheckSquare, 
  Truck, 
  FileText,
  X,
  MoreHorizontal,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { api } from '../../lib/axios';
import { quotationsApi } from '../../features/quotations/quotations.api';

const fetchQuotations = async () => {
  try {
    const res = await quotationsApi.getQuotations();
    return res.data || [];
  } catch (error) {
    if (error.response?.status !== 401) {
      console.error('Failed to fetch quotations:', error);
    }
    return [];
  }
};

const STATUS_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SENT', label: 'Sent' },
  { id: 'NEGOTIATION', label: 'Negotiation' },
  { id: 'PENDING_APPROVAL', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'FULFILLMENT', label: 'Fulfillment' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

function formatCurrency(amount) {
  const num = Number(amount || 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

function RiskIndicator({ score, version }) {
  const numScore = typeof score === 'number' ? score : parseInt(score, 10) || 0;
  
  let label = 'Low Risk';
  let dotColor = 'bg-[#3F8F63]';
  let textColor = 'text-[#3F8F63]';
  let bgColor = 'bg-[#EAF5EE]';
  let borderColor = 'border-[#D1EADB]';

  if (numScore >= 70) {
    label = 'Critical Risk';
    dotColor = 'bg-[#C95757]';
    textColor = 'text-[#C95757]';
    bgColor = 'bg-[#FBEAEA]';
    borderColor = 'border-[#F4C8C8]';
  } else if (numScore >= 45) {
    label = 'High Risk';
    dotColor = 'bg-[#C95757]';
    textColor = 'text-[#C95757]';
    bgColor = 'bg-[#FBEAEA]';
    borderColor = 'border-[#F4C8C8]';
  } else if (numScore >= 20) {
    label = 'Medium Risk';
    dotColor = 'bg-[#C98A32]';
    textColor = 'text-[#C98A32]';
    bgColor = 'bg-[#FBF2E3]';
    borderColor = 'border-[#F3DFBD]';
  }

  const total = Number(version?.totalAmount || 0);
  const discount = Number(version?.totalDiscount || 0);
  const discountPct = total > 0 ? ((discount / total) * 100).toFixed(1) : '0';

  return (
    <div className="relative group/risk inline-block whitespace-nowrap">
      <div className="flex flex-col items-start cursor-default">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-[13px] font-medium ${bgColor} ${textColor} border ${borderColor} transition-colors`}>
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="leading-none">{label}</span>
        </div>
        <span className="text-xs text-[#96918A] font-mono mt-1 pl-1">
          Score {numScore}
        </span>
      </div>

      {/* Interactive Tooltip Popover on Hover */}
      <div className="absolute left-0 top-full mt-2 w-72 p-3.5 bg-white rounded-xl border border-[#E6E1D9] shadow-lg text-left opacity-0 pointer-events-none group-hover/risk:opacity-100 group-hover/risk:pointer-events-auto transition-opacity duration-150 z-40">
        <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            {numScore >= 45 ? (
              <ShieldAlert className="w-4 h-4 text-[#C95757]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#3F8F63]" />
            )}
            <span className="text-sm font-semibold text-[#171717]">Risk Assessment</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${bgColor} ${textColor}`}>
            Score: {numScore}
          </span>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-[#6F6B66]">
          <div className="flex items-center justify-between">
            <span>Discount Applied:</span>
            <span className="font-semibold text-[#171717]">{discountPct}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount Amount:</span>
            <span className="font-semibold text-[#171717]">₹{discount.toLocaleString('en-IN')}</span>
          </div>
          {numScore >= 45 ? (
            <div className="pt-2 mt-1 border-t border-[#EEEAE4] text-xs text-[#C95757] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C95757] shrink-0" />
              <span>Manager approval required</span>
            </div>
          ) : numScore >= 20 ? (
            <div className="pt-2 mt-1 border-t border-[#EEEAE4] text-xs text-[#C98A32] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C98A32] shrink-0" />
              <span>Review recommended before dispatch</span>
            </div>
          ) : (
            <div className="pt-2 mt-1 border-t border-[#EEEAE4] text-xs text-[#3F8F63] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F63] shrink-0" />
              <span>Within safe commercial thresholds</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuotationsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState('ALL');
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: fetchQuotations
  });

  // Calculate high-level pipeline stats
  const { totalPipeline, highRiskCount, confirmedCount, activeCount } = useMemo(() => {
    let pipeline = 0;
    let highRisk = 0;
    let confirmed = 0;
    let active = 0;

    quotations.forEach(q => {
      const version = q.versions?.find(v => v.id === q.activeVersionId) || q.versions?.[0];
      const amount = Number(version?.totalAmount || 0);
      const score = Number(version?.riskScore || 0);

      pipeline += amount;
      if (score >= 45) highRisk += 1;
      if (q.status === 'CONFIRMED' || q.status === 'APPROVED') confirmed += 1;
      if (q.status !== 'CANCELLED' && q.status !== 'REJECTED') active += 1;
    });

    return {
      totalPipeline: formatCurrency(pipeline),
      highRiskCount: highRisk,
      confirmedCount: confirmed,
      activeCount: active || quotations.length
    };
  }, [quotations]);

  // Filter logic
  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      // Status Tab filter
      if (activeTab !== 'ALL') {
        if (activeTab === 'NEGOTIATION' && q.status !== 'NEGOTIATION' && q.status !== 'UNDER_NEGOTIATION') return false;
        else if (activeTab !== 'NEGOTIATION' && q.status !== activeTab) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const quoteNum = q.quotationNumber?.toLowerCase() || '';
        const custName = q.customer?.name?.toLowerCase() || q.customerId?.toLowerCase() || '';
        if (!quoteNum.includes(query) && !custName.includes(query)) return false;
      }

      // Risk filter
      if (selectedRisk !== 'ALL') {
        const version = q.versions?.find(v => v.id === q.activeVersionId) || q.versions?.[0];
        const score = version?.riskScore || 0;
        if (selectedRisk === 'HIGH' && score < 45) return false;
        if (selectedRisk === 'MEDIUM' && (score < 20 || score >= 45)) return false;
        if (selectedRisk === 'LOW' && score >= 20) return false;
      }

      // Customer filter
      if (selectedCustomer !== 'ALL' && q.customerId !== selectedCustomer) {
        return false;
      }

      return true;
    });
  }, [quotations, activeTab, searchQuery, selectedRisk, selectedCustomer]);

  const handleDuplicate = (quote) => {
    toast.success(`Created duplicate draft for ${quote.quotationNumber}`);
    setActiveActionMenu(null);
  };

  const handleSendToCustomer = (quote) => {
    toast.success(`Quotation ${quote.quotationNumber} dispatched to customer email!`);
    setActiveActionMenu(null);
  };

  if (isLoading) {
    return (
      <div className="w-full px-6 sm:px-8 py-6 space-y-6">
        <LoadingSkeleton type="table" rows={7} />
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-4 font-sans">
      {/* 1. Page Heading (Upward & Large) */}
      <div className="pt-0">
        <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
          Quotations
        </h1>
        <p className="text-sm sm:text-[15px] text-[#6F6B66] mt-1">
          Create, manage and track customer commercial quotations.
        </p>
      </div>

      {/* 2. Filter Bar & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#96918A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotes or customers..."
              className="w-full pl-10 pr-9 py-2.5 rounded-[10px] bg-white border border-[#E6E1D9] text-sm text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-1.5"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls: Risk Filter + Reset + Simple '+' Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Risk filter */}
            <div className="relative">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-[10px] bg-white border border-[#E6E1D9] text-xs sm:text-sm font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs cursor-pointer"
              >
                <option value="ALL">All risks</option>
                <option value="LOW">Low Risk (&lt;20)</option>
                <option value="MEDIUM">Medium Risk (20-45)</option>
                <option value="HIGH">High Risk (&gt;45)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#96918A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear filters trigger */}
            {(searchQuery || selectedRisk !== 'ALL' || selectedCustomer !== 'ALL' || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRisk('ALL');
                  setSelectedCustomer('ALL');
                  setActiveTab('ALL');
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#C95757] hover:text-[#A83D3D] px-2.5 py-2 transition-colors rounded-[9px] hover:bg-[#FBEAEA]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Simple '+' Button */}
            <Link 
              to="/sales/quotations/new"
              className="inline-flex items-center justify-center w-10 h-10 bg-[#D97757] hover:bg-[#C96648] active:scale-95 text-white rounded-[10px] transition-all shadow-xs shrink-0 cursor-pointer"
              title="New Quotation"
              aria-label="New Quotation"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* Status Filter Chips (Capsule Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = tab.id === 'ALL' 
              ? quotations.length 
              : quotations.filter(q => q.status === tab.id || (tab.id === 'NEGOTIATION' && q.status === 'UNDER_NEGOTIATION')).length;

            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                    : 'bg-white text-[#6F6B66] border-[#E6E1D9] hover:bg-[#F5F2ED] hover:text-[#171717] hover:border-[#D8D2C7]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F5F2ED] text-[#96918A]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Compact Summary Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#6F6B66] px-0.5">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-semibold text-[#171717]">{activeCount} active quotations</span>
          <span className="text-[#E6E1D9]">•</span>
          <span><strong className="text-[#171717] font-semibold">{totalPipeline}</strong> pipeline</span>
          <span className="text-[#E6E1D9]">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C95757]" />
            <span><strong className="text-[#171717] font-semibold">{highRiskCount}</strong> high risk</span>
          </span>
          <span className="text-[#E6E1D9]">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3F8F63]" />
            <span><strong className="text-[#171717] font-semibold">{confirmedCount}</strong> confirmed</span>
          </span>
        </div>

        {filteredQuotes.length !== quotations.length && (
          <div className="text-xs text-[#96918A]">
            Showing {filteredQuotes.length} of {quotations.length} records
          </div>
        )}
      </div>

      {/* 4. Quotations Table Surface (Full width, no horizontal scrollbar) */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs flex flex-col min-h-[460px] overflow-hidden w-full">
        {filteredQuotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState 
              icon={FileText}
              title="No quotations match criteria"
              description={searchQuery ? "Try refining your search query or reset filters." : "Create your first quotation to formulate commercial terms."}
              actionLabel={!searchQuery ? "Create Quotation" : null}
              actionTo="/sales/quotations/new"
            />
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-xs sm:text-[13px] font-semibold text-[#6F6B66] uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Quote Number</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Customer</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Products</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Subtotal</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Discount</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Margin</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Risk</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Updated</th>
                  <th className="py-3.5 px-6 font-semibold text-right whitespace-nowrap min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4] text-[#171717]">
                {filteredQuotes.map((quote) => {
                  const activeVersion = quote.versions?.find(v => v.id === quote.activeVersionId) || quote.versions?.[0];
                  const itemsCount = activeVersion?.items?.length || 1;
                  const total = Number(activeVersion?.totalAmount || 0);
                  const discount = Number(activeVersion?.totalDiscount || 0);
                  const discountPct = total > 0 ? ((discount / total) * 100).toFixed(0) : '0';
                  const marginPct = (100 - Number(discountPct) - 25).toFixed(0);
                  const isRowActionOpen = activeActionMenu === quote.id;

                  return (
                    <tr 
                      key={quote.id} 
                      className="bg-white hover:bg-[#FBFAF8] transition-colors duration-150 group h-[72px]"
                    >
                      {/* Quote Number */}
                      <td className="py-4 px-5 font-semibold whitespace-nowrap">
                        <Link 
                          to={`/sales/quotations/${quote.id}`} 
                          className="text-[#D97757] hover:text-[#C96648] font-mono tracking-tight font-semibold hover:underline inline-flex items-center gap-1 text-[15px] whitespace-nowrap"
                        >
                          {quote.quotationNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#171717] text-[15px] leading-snug">
                            {quote.customer?.name || `Customer #${quote.customerId.slice(-6)}`}
                          </span>
                          {quote.customer?.tier && (
                            <span className="text-xs text-[#96918A] capitalize mt-0.5">
                              {quote.customer.tier} tier
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-4 px-5 text-[#6F6B66] text-sm font-medium whitespace-nowrap">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-5 font-semibold text-[#171717] text-[15px] whitespace-nowrap">
                        ₹{total.toLocaleString('en-IN')}
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-medium text-[#171717]">
                            {discountPct}%
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-[#96918A] font-mono">
                              -₹{discount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`text-[15px] font-semibold ${
                          Number(marginPct) >= 25 
                            ? 'text-[#3F8F63]' 
                            : Number(marginPct) >= 15 
                            ? 'text-[#C98A32]' 
                            : 'text-[#C95757]'
                        }`}>
                          {marginPct}%
                        </span>
                      </td>

                      {/* Intelligent Risk Component */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <RiskIndicator 
                          score={activeVersion?.riskScore || 0} 
                          version={activeVersion}
                        />
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={quote.status} />
                      </td>

                      {/* Updated Date */}
                      <td className="py-4 px-5 text-[#96918A] text-xs sm:text-[13px] whitespace-nowrap">
                        {new Date(quote.updatedAt || quote.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 min-w-[88px]">
                          {/* Secondary Actions (Reveal on hover to the left of the Eye button) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1">
                            {quote.status === 'DRAFT' && (
                              <Link
                                to={`/sales/quotations/${quote.id}/edit`}
                                className="p-2 text-[#6F6B66] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-lg transition-colors"
                                title="Edit Quotation"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveActionMenu(isRowActionOpen ? null : quote.id)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isRowActionOpen 
                                  ? 'bg-[#F5F2ED] text-[#171717]' 
                                  : 'text-[#6F6B66] hover:text-[#171717] hover:bg-[#F5F2ED]'
                              }`}
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Primary Action (Always visible & perfectly aligned with Actions header) */}
                          <Link
                            to={`/sales/quotations/${quote.id}`}
                            className="p-2 text-[#6F6B66] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-lg transition-colors inline-flex items-center justify-center"
                            title="View Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>

                        {/* Action Dropdown Menu */}
                        {isRowActionOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setActiveActionMenu(null)} 
                            />
                            <div className="absolute right-5 top-12 w-56 bg-white rounded-xl shadow-lg border border-[#E6E1D9] py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/sales/quotations/${quote.id}`);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#171717] hover:bg-[#F5F2ED] flex items-center gap-2.5 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-[#96918A]" />
                                <span>View Control Center</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicate(quote)}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#171717] hover:bg-[#F5F2ED] flex items-center gap-2.5 transition-colors"
                              >
                                <Copy className="w-4 h-4 text-[#96918A]" />
                                <span>Duplicate Quotation</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendToCustomer(quote)}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#D97757] hover:bg-[#F8E9E3] flex items-center gap-2.5 transition-colors"
                              >
                                <Send className="w-4 h-4 text-[#D97757]" />
                                <span>Send to Customer</span>
                              </button>

                              <div className="border-t border-[#EEEAE4] my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/sales/approvals');
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#171717] hover:bg-[#F5F2ED] flex items-center gap-2.5 transition-colors"
                              >
                                <CheckSquare className="w-4 h-4 text-[#96918A]" />
                                <span>View Approval Queue</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/sales/fulfillment');
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#171717] hover:bg-[#F5F2ED] flex items-center gap-2.5 transition-colors"
                              >
                                <Truck className="w-4 h-4 text-[#96918A]" />
                                <span>View Fulfillment Plan</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {filteredQuotes.length > 0 && (
          <div className="px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E6E1D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-[#6F6B66] font-medium mt-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3F8F63] inline-block" />
              <span>
                Showing <strong className="text-[#171717] font-semibold">{filteredQuotes.length}</strong> of <strong className="text-[#171717] font-semibold">{quotations.length}</strong> quotations
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-[#96918A]">
              <span>Currency: <strong className="text-[#171717] font-mono">INR (₹)</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
