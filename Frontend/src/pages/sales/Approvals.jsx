import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  CheckSquare, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  Clock, 
  User as UserIcon, 
  ShieldAlert, 
  ShieldCheck, 
  FileText,
  ChevronDown,
  ArrowRight,
  X,
  Layers,
  Send
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { api } from '../../lib/axios';

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

export default function Approvals() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING | ALL
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  
  // Selected approval for detailed Review Drawer
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVED' | 'REJECTED' | 'RETURNED'
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: approvals = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['approvalsQueue', statusFilter],
    queryFn: async () => {
      try {
        const endpoint = statusFilter === 'PENDING' ? `/approvals/pending` : `/approvals`;
        const res = await api.get(endpoint);
        const list = res.data?.data || res.data || (Array.isArray(res) ? res : []);
        return Array.isArray(list) ? list : [];
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Failed to fetch approvals queue:', error);
        }
        return [];
      }
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({ approvalId, action, comments }) => {
      const res = await api.post(`/approvals/${approvalId}/action`, {
        action,
        comments
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvalsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['pipelineQuotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      
      const actionLabels = {
        APPROVED: 'Quotation authorized and approved',
        REJECTED: 'Quotation rejected',
        RETURNED: 'Quotation returned for sales revision'
      };
      toast.success(actionLabels[variables.action] || 'Decision recorded');
      setSelectedApproval(null);
      setActionType(null);
      setCommentText('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit authorization decision');
    }
  });

  const handleOpenReviewDrawer = (approval, preselectAction = null) => {
    setSelectedApproval(approval);
    setActionType(preselectAction);
    setCommentText('');
  };

  const handleSubmitDecision = async () => {
    if ((actionType === 'REJECTED' || actionType === 'RETURNED') && !commentText.trim()) {
      toast.error('A justification comment is required for rejection or revision');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await actionMutation.mutateAsync({
        approvalId: selectedApproval.id,
        action: actionType,
        comments: commentText.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter approvals list
  const filteredApprovals = useMemo(() => {
    return (Array.isArray(approvals) ? approvals : []).filter(item => {
      const v = item.quotationVersion || {};
      const q = v.quotation || {};
      const cust = q.customer || {};

      const matchesSearch = (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust.companyName || cust.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const riskScore = v.riskScore || 0;
      let riskLevel = v.riskLevel;
      if (!riskLevel) {
        if (riskScore >= 45) riskLevel = 'HIGH';
        else if (riskScore >= 20) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';
      }
      const matchesRisk = riskFilter === 'ALL' || riskLevel === riskFilter;

      const itemRole = item.assignedRole || item.level;
      const matchesLevel = levelFilter === 'ALL' || itemRole === levelFilter;

      return matchesSearch && matchesRisk && matchesLevel;
    });
  }, [approvals, searchTerm, riskFilter, levelFilter]);

  if (isLoading) {
    return (
      <div className="w-full px-6 sm:px-8 py-6 space-y-6">
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* 1. Page Header (Clean, uncarded canvas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0">
        <div>
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
            Approval Queue
          </h1>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Review quotations requiring authorization and governance sign-off.
          </p>
        </div>

        {/* Segmented Control [ Pending Review ] [ All History ] */}
        <div className="flex items-center bg-[#F5F2ED] p-1 rounded-[10px] border border-[#E6E1D9] h-[38px] shrink-0">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`h-7 px-3.5 rounded-[8px] text-xs sm:text-sm font-medium transition-all cursor-pointer select-none active:scale-95 ${
              statusFilter === 'PENDING'
                ? 'bg-white text-[#171717] font-semibold shadow-xs border border-[#E6E1D9]'
                : 'text-[#6F6B66] hover:text-[#171717]'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`h-7 px-3.5 rounded-[8px] text-xs sm:text-sm font-medium transition-all cursor-pointer select-none active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-white text-[#171717] font-semibold shadow-xs border border-[#E6E1D9]'
                : 'text-[#6F6B66] hover:text-[#171717]'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar (Lightweight, uncarded) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#96918A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quotation # or customer name..."
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
              <option value="CRITICAL">Critical Risk (&gt;70)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#96918A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Level Filter */}
          <div className="relative">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="appearance-none h-10 pl-3.5 pr-8 bg-white border border-[#E6E1D9] rounded-[9px] text-xs sm:text-sm font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all shadow-xs cursor-pointer"
            >
              <option value="ALL">Level: All Approval Levels</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="FINANCE">Finance Review</option>
              <option value="VP_SALES">VP of Sales</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#96918A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear Filters Reset */}
          {(searchTerm || riskFilter !== 'ALL' || levelFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('ALL');
                setLevelFilter('ALL');
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#C95757] hover:text-[#A83D3D] px-2.5 py-2 transition-colors rounded-[9px] hover:bg-[#FBEAEA] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Approval Contextual Summary */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-[#6F6B66] px-0.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#171717]">
            {statusFilter === 'PENDING' ? 'Pending Review' : 'Authorization History'}
          </span>
          <span className="text-[#E6E1D9]">•</span>
          <span>
            {filteredApprovals.length === 0 
              ? "You're all caught up" 
              : `${filteredApprovals.length} quotation${filteredApprovals.length > 1 ? 's' : ''} require authorization`}
          </span>
        </div>
      </div>

      {/* 4. Error State */}
      {isError && (
        <div className="p-4 rounded-[12px] bg-[#FBEAEA] border border-[#F4C8C8] flex items-center justify-between gap-3 text-xs sm:text-sm text-[#C95757]">
          <span>Unable to load approval queue records.</span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-white border border-[#F4C8C8] text-[#C95757] font-semibold rounded-[8px] hover:bg-[#F5F2ED] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* 5. Approval List & Empty State */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[180px] max-w-xl mx-auto">
          <div className="w-10 h-10 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#3F8F63] mb-3 shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-sm sm:text-[15px] font-semibold text-[#171717]">
            {statusFilter === 'PENDING' ? 'No approvals waiting for your review' : 'No approval records found'}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#96918A] mt-1 max-w-sm">
            You're all caught up. Quotations requiring governance authorization or discount exceptions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredApprovals.map((approval) => {
            const version = approval.quotationVersion || {};
            const quote = version.quotation || {};
            const customer = quote.customer || {};
            const total = Number(version.totalAmount || quote.totalAmount || 0);
            const discount = Number(version.totalDiscount || 0);
            const grossListPrice = total + discount;
            const discountPct = grossListPrice > 0 ? ((discount / grossListPrice) * 100).toFixed(0) : '0';
            const marginPct = (100 - Number(discountPct) - 25).toFixed(0);
            const riskScore = version.riskScore || 20;
            const isPending = (approval.status || 'PENDING') === 'PENDING';

            return (
              <div 
                key={approval.id}
                className="bg-white p-5 sm:p-6 rounded-[12px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-all duration-150 space-y-4"
              >
                {/* Top Row: Quote Number, Level Badge, Risk Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/sales/quotations/${quote.id || approval.quotationId}`}
                      className="text-sm font-semibold text-[#D97757] hover:text-[#C96648] font-mono tracking-tight hover:underline"
                    >
                      {quote.quotationNumber || `QT-${(approval.id || '').slice(0, 6)}`}
                    </Link>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
                      {approval.level?.replace('_', ' ') || 'SALES MANAGER'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <RiskBadge score={riskScore} level={version.riskLevel} />
                    <StatusBadge status={approval.status || 'PENDING'} />
                  </div>
                </div>

                {/* Second Row: Customer Account */}
                <div>
                  <h3 className="text-base font-semibold text-[#171717] leading-snug">
                    {customer.companyName || customer.name || 'Corporate Client'}
                  </h3>
                  {customer.tier && (
                    <span className="text-xs text-[#96918A] capitalize">
                      {customer.tier} Tier Account
                    </span>
                  )}
                </div>

                {/* Third Row: Financial Information Group */}
                <div className="grid grid-cols-3 gap-3 bg-[#FAF9F6] p-3.5 rounded-[10px] border border-[#EEEAE4]">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                      Quote Value
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-[#171717] mt-0.5 block">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                      Discount
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-[#171717] mt-0.5 block">
                      {discountPct}% <span className="text-xs text-[#96918A] font-normal font-mono">(-₹{discount.toLocaleString('en-IN')})</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                      Gross Margin
                    </span>
                    <span className={`text-base sm:text-lg font-semibold mt-0.5 block ${
                      Number(marginPct) >= 25 ? 'text-[#3F8F63]' : Number(marginPct) >= 15 ? 'text-[#C98A32]' : 'text-[#C95757]'
                    }`}>
                      {marginPct}%
                    </span>
                  </div>
                </div>

                {/* Fourth Row: Governance Trigger Notice */}
                {riskScore >= 20 && (
                  <div className="flex items-center gap-2 text-xs text-[#C98A32] bg-[#FBF2E3]/60 px-3 py-2 rounded-[8px] border border-[#F3DFBD]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {riskScore >= 45 
                        ? 'Discount threshold exceeded — Line item discount exceeds standard tier authorization.' 
                        : 'Commercial margin trigger — Governance verification recommended before release.'}
                    </span>
                  </div>
                )}

                {/* Bottom Row: Requester, Timestamp, & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#EEEAE4]">
                  <div className="flex items-center gap-3 text-xs text-[#96918A]">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-[#96918A]" />
                      <span>{quote.salesRep?.name || 'Sales Representative'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#96918A]" />
                      <span>
                        {approval.createdAt ? new Date(approval.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/sales/quotations/${quote.id || approval.quotationId}`}
                      className="px-3.5 py-1.5 text-xs font-medium text-[#6F6B66] hover:text-[#171717] bg-white border border-[#E6E1D9] hover:bg-[#F5F2ED] rounded-[9px] transition-colors"
                    >
                      View Quote
                    </Link>

                    {isPending ? (
                      <button
                        onClick={() => handleOpenReviewDrawer(approval)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#D97757] hover:bg-[#C96648] active:scale-95 rounded-[9px] shadow-xs transition-all cursor-pointer"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReviewDrawer(approval)}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#171717] bg-[#F5F2ED] hover:bg-[#EDE8E0] rounded-[9px] transition-colors cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Detail & Authorization Review Right Drawer */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#171717]/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
            onClick={() => { setSelectedApproval(null); setActionType(null); }}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#E6E1D9] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E6E1D9] flex items-center justify-between bg-[#FAF9F6] shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-mono text-[#D97757]">
                      {selectedApproval.quotationVersion?.quotation?.quotationNumber || 'Quotation Authorization'}
                    </span>
                    <RiskBadge score={selectedApproval.quotationVersion?.riskScore || 20} level={selectedApproval.quotationVersion?.riskLevel} />
                  </div>
                  <h2 className="text-lg font-semibold text-[#171717] mt-0.5">
                    {selectedApproval.quotationVersion?.quotation?.customer?.companyName || 'Acme Corporation'}
                  </h2>
                </div>

                <button
                  onClick={() => { setSelectedApproval(null); setActionType(null); }}
                  className="p-1.5 text-[#96918A] hover:text-[#171717] hover:bg-[#F2EFEA] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                {/* Commercial Summary Banner */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#96918A] mb-2">
                    Commercial Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-3 bg-[#FAF9F6] p-4 rounded-[10px] border border-[#EEEAE4]">
                    <div>
                      <span className="text-[11px] text-[#96918A] uppercase font-semibold">Total Amount</span>
                      <p className="text-base font-semibold text-[#171717] mt-0.5">
                        ₹{Number(selectedApproval.quotationVersion?.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#96918A] uppercase font-semibold">Total Discount</span>
                      <p className="text-base font-semibold text-[#C95757] mt-0.5">
                        ₹{Number(selectedApproval.quotationVersion?.totalDiscount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#96918A] uppercase font-semibold">Risk Score</span>
                      <p className="text-base font-semibold text-[#171717] mt-0.5">
                        {selectedApproval.quotationVersion?.riskScore || 0} / 100
                      </p>
                    </div>
                  </div>
                </div>

                {/* Governance Policy Notice */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#96918A] mb-2">
                    Discount Governance
                  </h4>
                  <div className="p-4 rounded-[10px] bg-[#FBF2E3]/80 border border-[#F3DFBD] space-y-2">
                    <div className="flex items-center gap-2 text-[#C98A32] font-semibold text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Governance Approval Trigger Analysis</span>
                    </div>
                    <ul className="text-xs text-[#8F5F1B] space-y-1.5 pl-5 list-disc leading-relaxed">
                      <li>Line item commercial pricing exceeds standard role discount limit.</li>
                      <li>{
                        (() => {
                          const selVersion = selectedApproval.quotationVersion || {};
                          const selTotal = Number(selVersion.totalAmount || 0);
                          const selDiscount = Number(selVersion.totalDiscount || 0);
                          const selGross = selTotal + selDiscount;
                          const actualPct = selGross > 0 ? ((selDiscount / selGross) * 100).toFixed(0) : '0';
                          const tierMax = selVersion.quotation?.customer?.tier === 'ENTERPRISE' ? 20 : selVersion.quotation?.customer?.tier === 'GOLD' ? 15 : 10;
                          const variance = (Number(actualPct) - tierMax).toFixed(0);
                          return <>Customer tier allows max <strong>{tierMax}%</strong> discount; proposed rate is <strong>{actualPct}%</strong> ({variance > 0 ? `+${variance}` : variance}% variance).</>;
                        })()
                      }</li>
                      <li>Blended transaction margin requires authorization by {selectedApproval.level?.replace('_', ' ') || 'Sales Manager'}.</li>
                    </ul>
                  </div>
                </div>

                {/* Quotation Line Items Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#96918A] mb-2">
                    Line Items Breakdown
                  </h4>
                  <div className="border border-[#E6E1D9] rounded-[10px] overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#6F6B66] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Disc%</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEEAE4] text-[#171717]">
                        {(selectedApproval.quotationVersion?.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-[#96918A]">
                              No item details available.
                            </td>
                          </tr>
                        ) : (
                          (selectedApproval.quotationVersion?.items || []).map((it, idx) => {
                            const productName = it.product?.name || it.productName || it.name || `Product #${idx + 1}`;
                            const qty = Number(it.quantity || 1);
                            const unitPrice = Number(it.unitPrice || 0);
                            const discPct = Number(it.discountPercentage ?? it.discountPercent ?? 0);
                            const lineTotal = it.totalPrice !== undefined && !isNaN(Number(it.totalPrice))
                              ? Number(it.totalPrice)
                              : (qty * unitPrice) * (1 - discPct / 100);

                            return (
                              <tr key={idx} className="hover:bg-[#FAF9F6]">
                                <td className="py-2.5 px-3 font-medium">{productName}</td>
                                <td className="py-2.5 px-3 text-[#6F6B66]">{qty}</td>
                                <td className="py-2.5 px-3 text-[#6F6B66]">₹{unitPrice.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 px-3 font-semibold text-[#C95757]">{discPct}%</td>
                                <td className="py-2.5 px-3 text-right font-semibold">₹{Math.round(lineTotal).toLocaleString('en-IN')}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Decision Comment / Justification Field */}
                {actionType && (
                  <div className="space-y-2 border-t border-[#EEEAE4] pt-4 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider">
                      {actionType === 'APPROVED' ? 'Authorization Notes (Optional)' : 'Required Justification / Feedback:'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        actionType === 'APPROVED' 
                          ? 'Add optional instructions or conditions...'
                          : 'Explain why this discount or margin exception cannot be accepted...'
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full p-3 bg-white border border-[#E6E1D9] rounded-[10px] text-xs sm:text-sm text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Sticky Action Footer */}
              <div className="p-4 sm:p-5 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => { setSelectedApproval(null); setActionType(null); }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#6F6B66] hover:text-[#171717] hover:bg-[#F2EFEA] rounded-[9px] transition-colors cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {!actionType ? (
                    <>
                      <button
                        onClick={() => setActionType('RETURNED')}
                        className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#6F6B66] bg-white border border-[#E6E1D9] hover:bg-[#F5F2ED] hover:text-[#171717] active:scale-95 rounded-[9px] shadow-xs transition-all cursor-pointer"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => setActionType('REJECTED')}
                        className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#C95757] hover:bg-[#B34545] active:scale-95 rounded-[9px] shadow-xs transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setActionType('APPROVED')}
                        className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3F8F63] hover:bg-[#347953] active:scale-95 rounded-[9px] shadow-xs transition-all cursor-pointer"
                      >
                        Approve Deal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActionType(null)}
                        className="px-3 py-1.5 text-xs font-medium text-[#96918A] hover:text-[#171717] cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitDecision}
                        disabled={isSubmitting}
                        className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-[9px] shadow-xs transition-all cursor-pointer active:scale-95 ${
                          actionType === 'APPROVED'
                            ? 'bg-[#3F8F63] hover:bg-[#347953]'
                            : actionType === 'REJECTED'
                            ? 'bg-[#C95757] hover:bg-[#B34545]'
                            : 'bg-[#171717] hover:bg-[#2B2B2B]'
                        }`}
                      >
                        {isSubmitting ? 'Recording...' : `Confirm ${actionType}`}
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
