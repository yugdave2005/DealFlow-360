import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  Clock, 
  Building, 
  ShieldAlert, 
  FileText,
  MessageSquare,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

import { api } from '../../lib/axios';

export default function Approvals() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING | ALL | APPROVED | REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  
  // Selected approval for detailed modal/drawer
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVED' | 'REJECTED' | 'RETURNED'
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: approvals = [], isLoading, refetch } = useQuery({
    queryKey: ['approvalsQueue', statusFilter],
    queryFn: async () => {
      try {
        const endpoint = statusFilter === 'PENDING' ? `/approvals/pending` : `/approvals`;
        const res = await api.get(endpoint);
        return res.data?.data || [];
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
        APPROVED: 'Quotation approved successfully',
        REJECTED: 'Quotation rejected',
        RETURNED: 'Quotation returned for revision'
      };
      toast.success(actionLabels[variables.action] || 'Decision recorded');
      setSelectedApproval(null);
      setActionType(null);
      setCommentText('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit decision');
    }
  });

  const handleOpenActionModal = (approval, type) => {
    setSelectedApproval(approval);
    setActionType(type);
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

  // Filter list
  const filteredApprovals = useMemo(() => {
    return approvals.filter(item => {
      const v = item.quotationVersion || {};
      const q = v.quotation || {};
      const cust = q.customer || {};

      const matchesSearch = (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const riskScore = v.riskScore || 0;
      const riskLevel = v.riskLevel || (riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW');
      const matchesRisk = riskFilter === 'ALL' || riskLevel === riskFilter;

      const matchesLevel = levelFilter === 'ALL' || item.level === levelFilter;

      return matchesSearch && matchesRisk && matchesLevel;
    });
  }, [approvals, searchTerm, riskFilter, levelFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approval Queue</h1>
              <p className="text-sm text-slate-500 mt-0.5">Review quotations requiring authorization and governance sign-off</p>
            </div>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotation # or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Levels</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="FINANCE">Finance</option>
              <option value="VP_SALES">VP of Sales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={CheckSquare}
              title={statusFilter === 'PENDING' ? 'No approvals waiting for your review.' : 'No approval records found.'}
              description="Quotations with discount limits exceeded or high margin risk will appear here for governance authorization."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quote #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Sales Rep</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Risk</th>
                  <th className="py-3.5 px-4">Approval Level</th>
                  <th className="py-3.5 px-4">Requested At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApprovals.map((approval) => {
                  const version = approval.quotationVersion || {};
                  const quote = version.quotation || {};
                  const customer = quote.customer || {};
                  const amount = Number(version.totalAmount || quote.totalAmount || 0);
                  const discount = Number(version.totalDiscount || 0);
                  const riskScore = version.riskScore || 20;

                  return (
                    <tr key={approval.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                        <button
                          onClick={() => navigate(`/sales/quotations/${quote.id || approval.quotationId}`)}
                          className="hover:underline flex items-center gap-1"
                        >
                          {quote.quotationNumber || `QT-${(approval.id || '').slice(0, 6)}`}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{customer.companyName || 'Corporate Client'}</div>
                        <div className="text-xs text-slate-500">{customer.tier || 'STANDARD'} Tier</div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs font-medium">
                        {quote.salesRep?.name || 'Sales Rep'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 font-medium text-rose-600">
                        ₹{discount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        <RiskBadge score={riskScore} level={version.riskLevel} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {approval.level?.replace('_', ' ') || 'SALES MANAGER'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {approval.createdAt ? new Date(approval.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={approval.status || 'PENDING'} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedApproval(approval)}
                            title="Inspect details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {approval.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(approval, 'APPROVED')}
                                title="Quick Approve"
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(approval, 'REJECTED')}
                                title="Reject"
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Decision Drawer / Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Approval Review</span>
                <h3 className="text-lg font-bold">
                  {selectedApproval.quotationVersion?.quotation?.quotationNumber || 'Quotation Authorization'}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedApproval(null); setActionType(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Commercial Summary Banner */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Customer</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedApproval.quotationVersion?.quotation?.customer?.companyName || 'Acme Corp'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Amount</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    ₹{Number(selectedApproval.quotationVersion?.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Risk Level</span>
                  <div className="mt-0.5">
                    <RiskBadge score={selectedApproval.quotationVersion?.riskScore || 25} level={selectedApproval.quotationVersion?.riskLevel} />
                  </div>
                </div>
              </div>

              {/* Policy Breach / Reason */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Why Governance Approval is Required:</span>
                </div>
                <ul className="text-xs text-amber-800 space-y-1 pl-6 list-disc">
                  <li>Applied line item discount exceeds standard tier authorization.</li>
                  <li>Customer Tier limit: <strong>10%</strong> · Applied: <strong>18%</strong> (Exceeded by <strong>+8%</strong>).</li>
                  <li>Blended gross margin is below baseline threshold (Required: 25%, Proposed: 19%).</li>
                </ul>
              </div>

              {/* Quotation Line Items Breakdown */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Line Items Breakdown</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3">Discount</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedApproval.quotationVersion?.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{it.product?.name || `Product #${idx + 1}`}</td>
                          <td className="py-2.5 px-3 text-slate-600">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-slate-600">₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 font-semibold text-rose-600">{it.discountPercent}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{Number(it.totalPrice).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decision Comment Field if action selected */}
              {actionType && (
                <div className="space-y-2 border-t border-slate-200 pt-4 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {actionType === 'APPROVED' ? 'Approval Notes (Optional)' : 'Required Reason / Feedback:'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      actionType === 'APPROVED' 
                        ? 'Add optional instructions or conditions...'
                        : 'Explain why this discount or margin cannot be accepted...'
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => { setSelectedApproval(null); setActionType(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!actionType ? (
                  <>
                    <button
                      onClick={() => setActionType('RETURNED')}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
                    >
                      Return for Revision
                    </button>
                    <button
                      onClick={() => setActionType('REJECTED')}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      Reject Quotation
                    </button>
                    <button
                      onClick={() => setActionType('APPROVED')}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                    >
                      Approve Deal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActionType(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Change Decision
                    </button>
                    <button
                      onClick={handleSubmitDecision}
                      disabled={isSubmitting}
                      className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                        actionType === 'APPROVED'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : actionType === 'REJECTED'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-slate-800 hover:bg-slate-900'
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
      )}
    </div>
  );
}
