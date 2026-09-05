import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Send, 
  ExternalLink, 
  Edit, 
  CheckSquare, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  History, 
  User, 
  Calendar,
  Building,
  Truck,
  IndianRupee,
  Layers,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  XCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import DealProgress from '../../components/common/DealProgress';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  // Negotiation Response Modal state
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [negotiationAction, setNegotiationAction] = useState('ACCEPT'); // 'ACCEPT' | 'COUNTER' | 'REJECT'
  const [proposedDiscount, setProposedDiscount] = useState(20);
  const [negotiationNotes, setNegotiationNotes] = useState('');

  const token = localStorage.getItem('accessToken');

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/quotations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch quotation details');
      const json = await res.json();
      return json.data;
    }
  });

  // Lifecycle Mutations
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/quotations/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      if (data.data?.approvalRequired) {
        toast.info(data.data.message || 'Quotation submitted for governance approval');
      } else {
        toast.success(data.data.message || 'Quotation approved within standard tier limits');
      }
    },
    onError: (err) => toast.error(err.message)
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/quotations/${id}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to dispatch quotation to customer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation dispatched to Customer Portal');
    },
    onError: (err) => toast.error(err.message)
  });

  const respondNegotiationMutation = useMutation({
    mutationFn: async ({ action, proposedDiscountPercentage, comments }) => {
      const res = await fetch(`${API_BASE}/quotations/${id}/respond-negotiation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action, proposedDiscountPercentage, comments })
      });
      if (!res.ok) throw new Error('Failed to record negotiation decision');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      if (data.data?.reapprovalRequired) {
        toast.warning(data.data.message);
      } else {
        toast.success(data.data?.message || 'Negotiation response recorded');
      }
      setNegotiationModalOpen(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/quotations/${id}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to confirm quotation');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation confirmed! Order ORD-1004 created & dispatched to fulfillment.');
    },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) {
    return <div className="p-6 max-w-7xl mx-auto"><LoadingSkeleton rows={8} /></div>;
  }

  if (isError || !quote) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 mt-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Quotation Not Found</h3>
        <p className="text-sm text-slate-500">The requested quotation does not exist or you lack authorization to view it.</p>
        <button
          onClick={() => navigate('/sales/quotations')}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Back to Quotations
        </button>
      </div>
    );
  }

  const versions = quote.versions || [];
  const currentVersion = versions[selectedVersionIndex] || versions[0] || {};
  const items = currentVersion.items || [];
  const approvals = quote.approvalRequests || [];

  const subtotal = Number(currentVersion.totalAmount || 0);
  const totalDiscount = Number(currentVersion.totalDiscount || 0);
  const netAmount = subtotal - totalDiscount;
  const tax = netAmount * 0.18;
  const grandTotal = netAmount + tax;
  const marginPercentage = (100 - ((totalDiscount / (subtotal || 1)) * 100) - 25).toFixed(1);
  const marginAmount = (grandTotal * (Number(marginPercentage) / 100));

  const isHistorical = selectedVersionIndex > 0;

  // Contextual Next Business Action prompt
  const getNextActionGuidance = () => {
    switch (quote.status) {
      case 'DRAFT':
        return {
          title: 'Action Required: Submit for Governance Approval',
          desc: 'Review line items, pricing, and discount limits. Click "Submit for Approval" to evaluate risk.',
          color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          badge: 'Next Step'
        };
      case 'PENDING_APPROVAL':
        return {
          title: 'In Progress: Awaiting Manager / Finance Authorization',
          desc: `Quotation has risk score ${currentVersion.riskScore || 25}. Currently pending sign-off in the approval queue.`,
          color: 'bg-purple-50 border-purple-200 text-purple-900',
          badge: 'Under Review'
        };
      case 'APPROVED':
        return {
          title: 'Ready: Quotation Authorized',
          desc: 'Terms approved. Click "Send to Customer" to dispatch proposal to the secure Customer Portal.',
          color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'Approved'
        };
      case 'SENT':
        return {
          title: 'Dispatched: Waiting for Customer Response',
          desc: 'Proposal has been emailed and is active on the Customer Portal. You can open the client view to simulate customer negotiation.',
          color: 'bg-blue-50 border-blue-200 text-blue-900',
          badge: 'Awaiting Client'
        };
      case 'UNDER_NEGOTIATION':
      case 'NEGOTIATION':
        return {
          title: 'Action Required: Customer Counter-Proposal Received',
          desc: 'Customer requested a discount concession. Click "Respond to Negotiation" below to review and counter.',
          color: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'Negotiation'
        };
      case 'CONFIRMED':
        return {
          title: 'Deal Confirmed: Order Generated',
          desc: 'Customer approved terms. Order created & multi-warehouse fulfillment allocation is active.',
          color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'Order Created'
        };
      case 'REJECTED':
        return {
          title: 'Quotation Rejected by Governance',
          desc: 'Approver rejected terms. Review manager comment below and edit quotation to formulate a new revision.',
          color: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'Revision Required'
        };
      default:
        return {
          title: 'Deal Active',
          desc: 'Track deal health and fulfillment status.',
          color: 'bg-slate-50 border-slate-200 text-slate-900',
          badge: 'Active'
        };
    }
  };

  const guidance = getNextActionGuidance();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      {/* Top Breadcrumb & Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sales/quotations')}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Back to Quotations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{quote.quotationNumber}</h1>
              <StatusBadge status={quote.status} />
              <RiskBadge score={currentVersion.riskScore || 25} />
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{quote.customer?.companyName || quote.customer?.name || `Customer #${quote.customerId?.slice(-6)}`}</span>
              <span>&bull;</span>
              <span>Created {new Date(quote.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Submit for Approval (Draft status) */}
          {quote.status === 'DRAFT' && hasPermission('quotation:submit') && (
            <button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{submitMutation.isPending ? 'Evaluating...' : 'Submit for Approval'}</span>
            </button>
          )}

          {/* Send to Customer (Approved status) */}
          {quote.status === 'APPROVED' && hasPermission('quotation:send') && (
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </button>
          )}

          {/* Respond to Negotiation (Under Negotiation status) */}
          {(quote.status === 'UNDER_NEGOTIATION' || quote.status === 'NEGOTIATION') && (
            <button
              type="button"
              onClick={() => setNegotiationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Respond to Negotiation</span>
            </button>
          )}

          {/* Confirm Deal (Sent status or Sales Rep confirmation) */}
          {quote.status === 'SENT' && (
            <button
              type="button"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Create Order</span>
            </button>
          )}

          {/* Customer Portal Link */}
          <button
            type="button"
            onClick={() => {
              window.open(`/customer/quotation/${quote.id}`, '_blank');
              toast.info('Opened Customer-Facing Proposal Portal in new tab');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open Customer Portal</span>
          </button>

          {/* Edit (Draft or Rejected) */}
          {hasPermission('quotation:edit') && (quote.status === 'DRAFT' || quote.status === 'REJECTED') && (
            <Link
              to={`/sales/quotations/${quote.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Quotation</span>
            </Link>
          )}

          {/* Fulfillment shortcut if confirmed */}
          {['CONFIRMED', 'FULFILLMENT', 'PROCESSING'].includes(quote.status) && (
            <button
              type="button"
              onClick={() => navigate(`/sales/fulfillment/ORD-${quote.id.slice(-4)}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Fulfillment</span>
            </button>
          )}
        </div>
      </div>

      {/* "What should I do next?" Guidance Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${guidance.color}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">{guidance.title}</h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/60">
                {guidance.badge}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">{guidance.desc}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Lifecycle Stepper */}
      <DealProgress currentStatus={quote.status} />

      {/* Commercial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total (Inc. GST)</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <span className="text-[10px] text-slate-400 mt-1 block">Subtotal: ₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Discount</span>
          <h3 className="text-xl font-black text-rose-600 mt-1">-₹{totalDiscount.toLocaleString('en-IN')}</h3>
          <span className="text-[10px] text-rose-600 mt-1 block">{((totalDiscount / (subtotal || 1)) * 100).toFixed(0)}% Overall</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Margin</span>
          <h3 className="text-xl font-black text-emerald-700 mt-1">₹{marginAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">{marginPercentage}% Net Margin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Governance Risk Score</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">{currentVersion.riskScore || 25} / 100</h3>
          <span className="text-[10px] text-slate-500 mt-1 block">Risk model evaluation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Version</span>
          <h3 className="text-xl font-black text-indigo-700 mt-1">v{currentVersion.versionNumber || 1}</h3>
          <span className="text-[10px] text-slate-500 mt-1 block">{versions.length} total revision(s)</span>
        </div>
      </div>

      {/* Main Details Grid: Items & Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Line Items & Customer Negotiation History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quotation Line Items</h3>
                <p className="text-xs text-slate-500">Commercial hardware, services and recurring subscriptions</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                {items.length} product(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const unitPrice = Number(item.unitPrice || 0);
                    const qty = Number(item.quantity || 1);
                    const disc = Number(item.discountPercentage || 0);
                    const lineTotal = (qty * unitPrice) * (1 - disc / 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-sm">{item.product?.name || `Product Line #${idx + 1}`}</div>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.product?.id?.slice(0, 8) || 'GEN-SKU-99'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{qty}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">₹{unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${disc > 15 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {disc}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                          ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Counter-Proposal Section (Under Negotiation) */}
          {(quote.status === 'UNDER_NEGOTIATION' || quote.status === 'NEGOTIATION') && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-700" />
                  <h3 className="font-bold text-amber-900 text-base">Customer Counter-Discount Request</h3>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                  Action Required
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Customer Proposal: Requesting 20% Concession</span>
                  <span className="text-rose-600 font-bold">15% &rarr; 20% (+5%)</span>
                </div>
                <p className="text-slate-600">
                  "We are ready to sign the enterprise hardware order immediately if a 20% discount is authorized for the full lot."
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNegotiationModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Review & Respond to Counter-Proposal
                </button>
              </div>
            </div>
          )}

          {/* Version History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-slate-900 text-sm">Quotation Revision History</h3>
            </div>
            
            <div className="space-y-2">
              {versions.map((ver, vIdx) => (
                <div
                  key={ver.id || vIdx}
                  onClick={() => setSelectedVersionIndex(vIdx)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    selectedVersionIndex === vIdx 
                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-bold' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-mono font-bold shadow-xs">
                      v{ver.versionNumber}
                    </span>
                    <span>Total: ₹{Number(ver.totalAmount).toLocaleString('en-IN')}</span>
                    <span>·</span>
                    <span>Discount: {((Number(ver.totalDiscount) / (Number(ver.totalAmount) || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-slate-400 font-normal">
                    {ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'Active Revision'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Approval Status & Governance Radar */}
        <div className="space-y-6">
          {/* Approval Routing Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Approval Governance</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Sales Manager Review</span>
                  <p className="text-slate-400 mt-0.5">Discounts up to 20%</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  quote.status === 'APPROVED' || quote.status === 'CONFIRMED' || quote.status === 'SENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : quote.status === 'PENDING_APPROVAL'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {quote.status === 'APPROVED' || quote.status === 'CONFIRMED' || quote.status === 'SENT' ? 'APPROVED' : quote.status === 'PENDING_APPROVAL' ? 'PENDING' : 'NOT TRIGGERED'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Finance Second-Level</span>
                  <p className="text-slate-400 mt-0.5">Discounts exceeding 20%</p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-500">
                  NOT REQUIRED
                </span>
              </div>
            </div>
          </div>

          {/* Customer Profile Mini Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Account</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                {quote.customer?.tier || 'ENTERPRISE'} TIER
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{quote.customer?.companyName || quote.customer?.name}</h4>
            <p className="text-xs text-slate-500">{quote.customer?.email}</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Auto-Approval Ceiling:</span>
              <strong className="text-slate-800">&le; 15% Discount</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Response Modal */}
      {negotiationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Negotiation Decision</span>
                <h3 className="text-lg font-bold text-slate-900">Respond to Customer Counter-Proposal</h3>
              </div>
              <button onClick={() => setNegotiationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Decision Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ACCEPT', label: 'Accept 20%', desc: 'Apply requested term' },
                    { id: 'COUNTER', label: 'Counter 18%', desc: 'Propose compromise' },
                    { id: 'REJECT', label: 'Reject', desc: 'Keep original terms' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setNegotiationAction(act.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        negotiationAction === act.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <strong className="block text-slate-900 text-xs">{act.label}</strong>
                      <span className="text-[10px] text-slate-400">{act.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {negotiationAction !== 'REJECT' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Governance Re-Approval Alert</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Applying 18%–20% discount exceeds the 15% standard sales rep ceiling. The quotation will automatically route back to <strong>Pending Manager Approval</strong>.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Rationale</label>
                <textarea
                  rows={2}
                  placeholder="Add context for sales management and customer records..."
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setNegotiationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  respondNegotiationMutation.mutate({
                    action: negotiationAction,
                    proposedDiscountPercentage: negotiationAction === 'ACCEPT' ? 20 : negotiationAction === 'COUNTER' ? 18 : 15,
                    comments: negotiationNotes
                  });
                }}
                disabled={respondNegotiationMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                {respondNegotiationMutation.isPending ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
