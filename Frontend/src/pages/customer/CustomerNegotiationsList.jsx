import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function CustomerNegotiationsList() {
  const navigate = useNavigate();

  const negotiations = [
    {
      id: 'neg-1',
      quoteId: 'qt-1024',
      quoteNumber: 'QT-1024',
      requestedItem: 'Enterprise Setup & Commissioning Service',
      originalDiscount: '10%',
      requestedDiscount: '15%',
      notes: 'Customer requested 5% additional commercial concession for full rack installation.',
      status: 'PENDING_APPROVAL',
      submittedDate: '2 Sep 2026'
    }
  ];

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
        {negotiations.map(neg => (
          <div key={neg.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-700">{neg.quoteNumber}</span>
                <span className="text-xs text-slate-500">· Submitted on {neg.submittedDate}</span>
              </div>
              <StatusBadge status={neg.status} />
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs space-y-2">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Affected Line: {neg.requestedItem}</span>
                <span className="text-rose-700">{neg.originalDiscount} &rarr; {neg.requestedDiscount} Requested</span>
              </div>
              <p className="text-amber-800">{neg.notes}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">Currently awaiting internal sales governance decision</span>
              <button
                onClick={() => navigate(`/customer/quotation/${neg.quoteId}`)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View Quotation Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
