import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  Inbox
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_QUOTATIONS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/quotations`;
const getToken = () => localStorage.getItem('accessToken');

export default function CustomerNegotiationsList() {
  const navigate = useNavigate();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['customerNegotiationsList'],
    queryFn: async () => {
      const res = await fetch(API_QUOTATIONS, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const negotiations = quotations.filter(q => 
    ['UNDER_NEGOTIATION', 'NEGOTIATION', 'PENDING_APPROVAL'].includes(q.status)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Counter-Proposals & Negotiations</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track your submitted discount and term adjustments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiations List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton count={2} />
        ) : negotiations.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Active Negotiations</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You have no proposals currently under negotiation or counter-offer review.
            </p>
          </div>
        ) : (
          negotiations.map(q => {
            const v = q.activeVersion || (q.versions && q.versions[0]) || {};
            const total = Number(v.totalAmount || q.totalAmount || 0);
            return (
              <div key={q.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700">{q.quotationNumber || `QT-${q.id.slice(0,6)}`}</span>
                    <span className="text-xs text-slate-500">· Created {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <StatusBadge status={q.status} />
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Proposal Value: ₹{total.toLocaleString('en-IN')}</span>
                    <span className="text-amber-800">Status: {q.status}</span>
                  </div>
                  <p className="text-amber-800">
                    Proposal is currently in review between your team and sales management.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500">Awaiting commercial terms alignment</span>
                  <button
                    onClick={() => navigate(`/customer/quotations/${q.id}`)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>View Quotation Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
