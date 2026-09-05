import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  ArrowRight, 
  Inbox
} from 'lucide-react';
import { quotationsApi } from '../../features/quotations/quotations.api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerQuotationsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['customerQuotationsList'],
    queryFn: async () => {
      try {
        const res = await quotationsApi.getCustomerQuotations();
        return res.data?.data || res.data || [];
      } catch (err) {
        // Fallback for demo
        const fallback = await quotationsApi.getQuotations().catch(() => ({ data: { data: [] } }));
        return fallback.data?.data || fallback.data || [];
      }
    }
  });

  const filteredQuotes = (Array.isArray(quotes) ? quotes : []).filter(q => 
    (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.customer?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Quotations</h1>
              <p className="text-sm text-slate-500 mt-0.5">Commercial proposals submitted for your review & approval</p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Quotations Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no proposals issued in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Proposal Details</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Commercial Amount</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map(q => {
                  const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                  const total = Number(v.totalAmount || q.totalAmount || 0);
                  const itemsCount = v.items?.length || 0;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                        {q.quotationNumber || `QT-${q.id.slice(0,6)}`}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {q.customer?.companyName || 'Enterprise Proposal'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium text-xs">
                        {itemsCount} line items
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 text-base">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate(`/customer/quotations/${q.id}`)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Review & Sign</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
