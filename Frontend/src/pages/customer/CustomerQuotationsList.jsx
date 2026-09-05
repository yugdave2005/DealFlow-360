import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Building,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function CustomerQuotationsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const quotes = [
    {
      id: 'qt-1024',
      quoteNumber: 'QT-1024',
      title: 'Enterprise Rack Servers & Managed Cloud Suite',
      totalAmount: 124000,
      discount: '18% Discount Applied',
      status: 'UNDER_NEGOTIATION',
      validUntil: '30 Sep 2026',
      itemsCount: 3,
      createdAt: '2026-08-25'
    },
    {
      id: 'qt-1018',
      quoteNumber: 'QT-1018',
      title: 'Annual SLA Dedicated Infrastructure Support',
      totalAmount: 85000,
      discount: '10% Discount Applied',
      status: 'CONFIRMED',
      validUntil: '15 Oct 2026',
      itemsCount: 1,
      createdAt: '2026-08-10'
    }
  ];

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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Proposal Description</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Commercial Amount</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                    {q.quoteNumber}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {q.title}
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium text-xs">
                    {q.itemsCount} products
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 text-base">
                    ₹{q.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    Valid until {q.validUntil}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => navigate(`/customer/quotation/${q.id}`)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                    >
                      <span>Review & Sign</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
