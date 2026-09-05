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
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import DealProgress from '../../components/common/DealProgress';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const fetchQuotationDetail = async (id) => {
  const token = localStorage.getItem('accessToken');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
  const res = await fetch(`${API_BASE}/quotations/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch quotation details');
  return (await res.json()).data;
};

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['quotationDetail', id],
    queryFn: () => fetchQuotationDetail(id)
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton type="cards" rows={4} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">The requested quotation ID does not exist or you do not have permission to view it.</p>
        <Link to="/sales/quotations" className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
          Back to Quotations
        </Link>
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
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
              <span>{quote.customer?.name || `Customer #${quote.customerId.slice(-6)}`}</span>
              <span>&bull;</span>
              <span>Created {new Date(quote.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role-Aware Manager/Finance Approval Actions */}
          {hasPermission('approval:approve') && (quote.status === 'PENDING_APPROVAL' || quote.status === 'APPROVAL_PENDING') && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success(`Quotation ${quote.quotationNumber} approved successfully`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Quotation
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.error(`Quotation ${quote.quotationNumber} rejected`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {/* Role-Aware Fulfillment Jump */}
          {hasPermission('fulfillment:manage') && ['CONFIRMED', 'FULFILLMENT', 'PROCESSING'].includes(quote.status) && (
            <button
              type="button"
              onClick={() => navigate(`/sales/fulfillment/ORD-${quote.id.slice(-4)}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              Manage Warehouse Split
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              window.open(`/customer/quotation/${quote.id}`, '_blank');
              toast.info('Opened Customer-Facing Proposal Portal in new tab');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            Open Customer Portal
          </button>

          {hasPermission('quotation:send') && (
            <button
              type="button"
              onClick={() => toast.success(`Quotation ${quote.quotationNumber} emailed to customer`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Send to Customer
            </button>
          )}

          {hasPermission('quotation:edit') && quote.status === 'DRAFT' && (
            <Link
              to={`/sales/quotations/${quote.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Quotation
            </Link>
          )}
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
        
        {/* Left 2 Cols: Line Items & Negotiation History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Line Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Line Items (Version {currentVersion.versionNumber || 1})
              </h3>
              {isHistorical && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  Viewing Historical Version (Read Only)
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Net Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((item) => {
                    const gross = item.quantity * Number(item.unitPrice);
                    const discAmt = gross * (item.discountPercentage / 100);
                    const net = gross - discAmt;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.productId.slice(0, 12).toUpperCase()}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{item.productId}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-rose-600">{item.discountPercentage}%</span>
                          <span className="text-[10px] text-slate-400 block">-₹{discAmt.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{net.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Negotiation History Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Customer Negotiation History
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {quote.status === 'NEGOTIATION' ? 'Active Negotiation' : '0 pending requests'}
              </span>
            </div>

            {quote.status === 'NEGOTIATION' || quote.status === 'UNDER_NEGOTIATION' ? (
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900">Customer Counter-Offer Submitted</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold">Under Review</span>
                  </div>
                  <span className="text-[10px] text-amber-700">Today</span>
                </div>
                <p className="text-xs text-amber-800">
                  Customer requested: <strong>"Adjust line item terms to increase overall discount from 10% to 15% for annual commitment"</strong>
                </p>
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">Impact on Risk: Increases Risk Score to 48 (Triggers Manager Approval)</span>
                  <button
                    type="button"
                    onClick={() => navigate('/sales/approvals')}
                    className="px-3 py-1 bg-amber-700 text-white font-bold rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    Action in Approval Queue &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No active negotiation requests on this quotation.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Approval Timeline & Version History */}
        <div className="space-y-6">
          
          {/* Approval Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckSquare className="w-4 h-4 text-purple-600" />
              Approval Routing Timeline
            </h3>

            <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
              {/* Step 1: Governance Risk Check */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Discount Governance Check</p>
                  <p className="text-slate-500 text-[11px]">System automated policy check completed</p>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                    Evaluated
                  </span>
                </div>
              </div>

              {/* Step 2: Sales Manager Review */}
              <div className="relative">
                <div className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                  quote.status === 'APPROVED' ? 'bg-emerald-500' :
                  quote.status === 'PENDING_APPROVAL' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                }`}></div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Sales Manager Review</p>
                  <p className="text-slate-500 text-[11px]">
                    {quote.status === 'APPROVED' ? 'Approved by Regional Manager' :
                     quote.status === 'PENDING_APPROVAL' ? 'Awaiting Sales Manager authorization' : 'Not required for standard terms'}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded mt-1 inline-block ${
                    quote.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    quote.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {quote.status === 'APPROVED' ? 'Approved' : quote.status === 'PENDING_APPROVAL' ? 'Pending Action' : 'Bypassed'}
                  </span>
                </div>
              </div>

              {/* Step 3: Finance Controller Review (only if required) */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Finance Controller Review</p>
                  <p className="text-slate-500 text-[11px]">Required only for critical discounts (&gt;30%)</p>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1 inline-block">
                    Not Required
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-indigo-600" />
              Version History
            </h3>

            <div className="space-y-2.5">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id || idx}
                  onClick={() => setSelectedVersionIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedVersionIndex === idx 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Version {ver.versionNumber || (idx + 1)}</span>
                    <span className="text-[10px] text-slate-400">{new Date(ver.createdAt || quote.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                    <span>Total: ₹{Number(ver.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="font-bold text-rose-600">-₹{Number(ver.totalDiscount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
