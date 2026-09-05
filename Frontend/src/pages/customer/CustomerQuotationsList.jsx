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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">Your Quotations</h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">Commercial proposals submitted for your review & approval</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FBF9F7] border border-[#EBE8E2] rounded-xl text-xs font-medium text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-10 h-10 text-[#A8A29E] mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#1E1B18]">No Quotations Found</h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
              There are currently no proposals issued in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EBE8E2] text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Proposal Details</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Commercial Amount</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E2]/60">
                {filteredQuotes.map(q => {
                  const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                  const total = Number(v.totalAmount || q.totalAmount || 0);
                  const itemsCount = v.items?.length || 0;
                  return (
                    <tr key={q.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#B85D19]">
                        {q.quotationNumber || `QT-${q.id.slice(0,6)}`}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#1E1B18]">
                        {q.customer?.companyName || 'Enterprise Proposal'}
                      </td>
                      <td className="py-4 px-4 text-[#78716C] font-medium text-xs">
                        {itemsCount} line items
                      </td>
                      <td className="py-4 px-4 font-bold text-[#1E1B18] text-base">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#78716C]">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate(`/customer/quotations/${q.id}`)}
                          className="px-3.5 py-1.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
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
