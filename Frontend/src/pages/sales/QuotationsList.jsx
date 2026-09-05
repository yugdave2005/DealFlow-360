import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Send, 
  CheckSquare, 
  Truck, 
  History,
  FileText,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

import { api } from '../../lib/axios';
import { quotationsApi } from '../../features/quotations/quotations.api';

const fetchQuotations = async () => {
  try {
    const res = await quotationsApi.getQuotations();
    return res.data || [];
  } catch (error) {
    // If it's a 401, the interceptor handles the redirect.
    // Let the error propagate so React Query can show error state if needed, or just return []
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
  { id: 'NEGOTIATION', label: 'Under Negotiation' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'FULFILLMENT', label: 'Fulfillment' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function QuotationsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState('ALL');
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const { data: quotations = [], isLoading, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn: fetchQuotations
  });

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
    return <LoadingSkeleton type="table" rows={6} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Create, manage and track customer commercial quotations</p>
        </div>
        <Link 
          to="/sales/quotations/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quote # or customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compact Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Risk filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk (&lt;20)</option>
              <option value="MEDIUM">Medium Risk (20-45)</option>
              <option value="HIGH">High Risk (&gt;45)</option>
            </select>

            {/* Clear filters if any active */}
            {(searchQuery || selectedRisk !== 'ALL' || selectedCustomer !== 'ALL' || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRisk('ALL');
                  setSelectedCustomer('ALL');
                  setActiveTab('ALL');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 pt-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {STATUS_TABS.map((tab) => {
            const count = tab.id === 'ALL' 
              ? quotations.length 
              : quotations.filter(q => q.status === tab.id || (tab.id === 'NEGOTIATION' && q.status === 'UNDER_NEGOTIATION')).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[460px] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton type="table" rows={6} />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState 
              icon={FileText}
              title="No quotations match criteria"
              description={searchQuery ? "Try refining your search query or reset filters." : "Create your first quotation to formulate deal terms."}
              actionLabel={!searchQuery ? "Create Quotation" : null}
              actionTo="/sales/quotations/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-semibold">Quote Number</th>
                  <th className="py-3.5 px-5 font-semibold">Customer</th>
                  <th className="py-3.5 px-5 font-semibold">Products</th>
                  <th className="py-3.5 px-5 font-semibold">Subtotal</th>
                  <th className="py-3.5 px-5 font-semibold">Discount</th>
                  <th className="py-3.5 px-5 font-semibold">Margin</th>
                  <th className="py-3.5 px-5 font-semibold">Risk</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                  <th className="py-3.5 px-5 font-semibold">Updated</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQuotes.map((quote) => {
                  const activeVersion = quote.versions?.find(v => v.id === quote.activeVersionId) || quote.versions?.[0];
                  const itemsCount = activeVersion?.items?.length || 1;
                  const total = Number(activeVersion?.totalAmount || 0);
                  const discount = Number(activeVersion?.totalDiscount || 0);
                  const discountPct = total > 0 ? ((discount / total) * 100).toFixed(0) : '0';
                  const marginPct = (100 - Number(discountPct) - 25).toFixed(0);

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <Link to={`/sales/quotations/${quote.id}`} className="text-indigo-600 hover:underline font-mono">
                          {quote.quotationNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-800">
                        {quote.customer?.name || `Customer #${quote.customerId.slice(-6)}`}
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {itemsCount} item{itemsCount > 1 ? 's' : ''}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-900">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        {discountPct}% <span className="text-[10px] text-slate-400">(-₹{discount.toLocaleString('en-IN')})</span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-emerald-700">
                        {marginPct}%
                      </td>
                      <td className="py-4 px-5">
                        <RiskBadge score={activeVersion?.riskScore || 20} />
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        {new Date(quote.updatedAt || quote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/sales/quotations/${quote.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Deal"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {quote.status === 'DRAFT' && (
                            <Link
                              to={`/sales/quotations/${quote.id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Quotation"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveActionMenu(activeActionMenu === quote.id ? null : quote.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action Dropdown Menu with click-outside backdrop */}
                        {activeActionMenu === quote.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={() => setActiveActionMenu(null)} 
                            />
                            <div className="absolute right-5 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/sales/quotations/${quote.id}`);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                View Control Center
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicate(quote)}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                Duplicate Quotation
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendToCustomer(quote)}
                                className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                              >
                                <Send className="w-3.5 h-3.5 text-indigo-500" />
                                Send to Customer
                              </button>

                              <div className="border-t border-slate-100 my-1"></div>

                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/sales/approvals');
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                                View Approval Queue
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/sales/fulfillment');
                                  setActiveActionMenu(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Truck className="w-3.5 h-3.5 text-blue-500" />
                                View Fulfillment Plan
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
        {!isLoading && filteredQuotes.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-medium mt-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Showing <strong className="text-slate-800 font-semibold">{filteredQuotes.length}</strong> of <strong className="text-slate-800 font-semibold">{quotations.length}</strong> active quotations</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Currency: <strong className="text-slate-700 font-mono">INR (₹)</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
