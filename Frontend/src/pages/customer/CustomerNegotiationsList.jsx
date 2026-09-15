import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  Inbox,
  User,
  CheckCircle2,
  TrendingDown,
  FileText,
  Building
} from 'lucide-react';
import { api } from '../../lib/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerNegotiationsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | ACTIVE | CONFIRMED

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['customerNegotiationsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/customer-portal/quotations');
        const list = res.data?.data || res.data || (Array.isArray(res) ? res : []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
  });

  const filteredNegotiations = useMemo(() => {
    return (Array.isArray(quotations) ? quotations : []).filter(q => {
      const allMessages = (q.versions || []).flatMap(v => v.messages || []);
      const isNegotiating = ['UNDER_NEGOTIATION', 'NEGOTIATION', 'PENDING_APPROVAL', 'SENT'].includes(q.status) || allMessages.length > 0;

      if (activeTab === 'ACTIVE') {
        return ['UNDER_NEGOTIATION', 'NEGOTIATION', 'PENDING_APPROVAL', 'SENT'].includes(q.status);
      }
      if (activeTab === 'CONFIRMED') {
        return ['CONFIRMED', 'APPROVED'].includes(q.status);
      }
      return isNegotiating || true; // Show all relevant proposals in ALL
    });
  }, [quotations, activeTab]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">Counter-Proposals & Negotiations</h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">Track your submitted discount and term adjustments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#F5EFEB] p-1 rounded-xl border border-[#E8DFD8]">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#FFFFFF] text-[#1E1B18] shadow-xs'
                : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            All Proposals ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-[#FFFFFF] text-[#1E1B18] shadow-xs'
                : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            In Review
          </button>
          <button
            onClick={() => setActiveTab('CONFIRMED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'CONFIRMED'
                ? 'bg-[#FFFFFF] text-[#1E1B18] shadow-xs'
                : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            Finalized Deals
          </button>
        </div>
      </div>

      {/* Negotiations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={2} />
          </div>
        ) : filteredNegotiations.length === 0 ? (
          <div className="py-16 text-center bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <Inbox className="w-10 h-10 text-[#A8A29E] mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#1E1B18]">No Active Negotiations</h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
              You have no proposals currently under negotiation or counter-offer review.
            </p>
          </div>
        ) : (
          filteredNegotiations.map(q => {
            const v = q.activeVersion || (q.versions && q.versions[0]) || {};
            const total = Number(v.totalAmount || q.totalAmount || 0);
            const discount = Number(v.totalDiscount || 0);

            // Extract all negotiation messages from versions
            const allMessages = (q.versions || [])
              .flatMap(ver => (ver.messages || []).map(m => ({ ...m, versionNumber: ver.versionNumber })))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const latestMessage = allMessages[0];
            const messagesCount = allMessages.length;

            return (
              <div key={q.id} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2] space-y-4 hover:border-[#B85D19]/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EBE8E2]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-[#B85D19] text-sm">
                      {q.quotationNumber || `QT-${q.id.slice(0, 6)}`}
                    </span>
                    <span className="text-xs text-[#A8A29E]">·</span>
                    <span className="text-xs text-[#78716C] font-medium">
                      Created {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    {q.versions && q.versions.length > 1 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5EFEB] text-[#44403C] border border-[#E8DFD8]">
                        Rev v{q.versions.length}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={q.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF8F5] p-4 rounded-xl border border-[#EBE8E2]">
                  <div>
                    <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">Commercial Proposal Value</span>
                    <span className="text-lg font-extrabold text-[#1E1B18] font-mono">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">Total Applied Discount</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      -₹{discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">Negotiation Status</span>
                    <span className="text-xs font-semibold text-[#44403C] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {q.status === 'CONFIRMED' ? 'Terms finalized & accepted' :
                       q.status === 'PENDING_APPROVAL' ? 'Counter-offer in governance review' :
                       q.status === 'NEGOTIATION' ? 'Active negotiation thread' : 'Commercial proposal active'}
                    </span>
                  </div>
                </div>

                {/* Latest Negotiation Thread Message */}
                {latestMessage ? (
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>
                          {latestMessage.senderRole === 'CUSTOMER' ? 'Your Latest Counter-Offer' : 'Sales Representative Message'}
                        </span>
                        {latestMessage.proposedDiscount && (
                          <span className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-mono font-bold">
                            {latestMessage.proposedDiscount}% Discount
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-700 font-normal">
                        {new Date(latestMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-amber-800 text-xs pl-4 border-l-2 border-amber-300">
                      "{latestMessage.content}"
                    </p>
                    {messagesCount > 1 && (
                      <div className="text-[11px] text-amber-700/80 font-medium pl-4 pt-1">
                        + {messagesCount - 1} earlier exchange{messagesCount > 2 ? 's' : ''} in negotiation history
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] text-xs text-[#78716C] flex items-center justify-between">
                    <span>No counter-proposals submitted yet. You can propose revised discounts or commercial terms.</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <span className="text-xs text-[#78716C]">
                    {q.status === 'CONFIRMED' ? 'Agreement reached. View proposal specifications anytime.' : 'Click to inspect detailed terms, submit counter-discounts, or sign.'}
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(`/customer/quotations/${q.id}`)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{q.status === 'CONFIRMED' ? 'View Proposal Details' : 'Review & Negotiate Terms'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
