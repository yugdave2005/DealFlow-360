import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckSquare, 
  Clock, 
  FileText, 
  Users, 
  Percent, 
  DollarSign, 
  ShieldAlert, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  Sliders,
  Filter
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_QUOTES = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/quotations`;
const API_APPROVALS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/approvals`;
const getToken = () => localStorage.getItem('accessToken');

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [repFilter, setRepFilter] = useState('ALL');

  const { data: quotations = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['managerQuotes'],
    queryFn: async () => {
      const res = await fetch(API_QUOTES, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch quotations');
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['managerPendingApprovals'],
    queryFn: async () => {
      const res = await fetch(`${API_APPROVALS}/pending`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const teamPipelineValue = quotations.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
  }, 0);

  const activeQuotesCount = quotations.filter(q => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(q.status)).length;
  
  const atRiskCount = quotations.filter(q => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return (v.riskScore || 0) > 40;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Overview</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Sales Manager
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Team pipeline performance, governance authorizations & deal velocity</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales/approvals')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Approvals ({approvals.length})</span>
          </button>
        </div>
      </div>

      {/* 6 Manager KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Pipeline</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">₹{teamPipelineValue.toLocaleString('en-IN')}</p>
          <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">+14% MoM</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Deals</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{activeQuotesCount}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Across all reps</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
          <p className="text-xl font-extrabold text-purple-700 mt-1">{approvals.length}</p>
          <span className="text-xs text-purple-600 font-semibold mt-0.5 block">Awaiting sign-off</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">At-Risk Deals</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{atRiskCount}</p>
          <span className="text-xs text-rose-600 font-semibold mt-0.5 block">Risk score &gt; 40</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Discount</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">11.8%</p>
          <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">Floor: 15.0%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approval Delays</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">2</p>
          <span className="text-xs text-amber-600 font-semibold mt-0.5 block">&gt; 24h pending</span>
        </div>
      </div>

      {/* Manager Attention Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Manager Attention Required</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer" onClick={() => navigate('/sales/deal-health')}>
            View Deal Health Radar &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/sales/approvals')}
            className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 hover:bg-purple-50 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-purple-900 uppercase">Pending Approvals</span>
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            </div>
            <p className="text-xs text-purple-800">
              <strong>{approvals.length || 2} quotations</strong> exceed sales rep discount limits requiring manager sign-off.
            </p>
            <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
              <span>Review queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/deal-health')}
            className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 hover:bg-rose-50 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-rose-900 uppercase">Discount Anomalies</span>
              <Percent className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-xs text-rose-800">
              <strong>Beta Industries (19% disc)</strong> exceeds typical rep baseline by 11%.
            </p>
            <div className="text-xs font-bold text-rose-700 flex items-center gap-1 pt-1">
              <span>Inspect anomaly</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/deal-health')}
            className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 hover:bg-amber-50 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-amber-900 uppercase">Stalled Negotiations</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800">
              <strong>QT-1024</strong> inactive for 8 days in customer negotiation.
            </p>
            <div className="text-xs font-bold text-amber-700 flex items-center gap-1 pt-1">
              <span>Unblock deal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/fulfillment')}
            className="p-4 bg-cyan-50/50 rounded-xl border border-cyan-200/80 hover:bg-cyan-50 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-cyan-900 uppercase">Delivery Risks</span>
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <p className="text-xs text-cyan-800">
              <strong>ORD-1003</strong> has 3-day SLA delivery delay due to hub shortage.
            </p>
            <div className="text-xs font-bold text-cyan-700 flex items-center gap-1 pt-1">
              <span>View fulfillment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Pipeline & Recent Team Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Rep Performance */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Sales Rep Velocity</h3>
            <span className="text-xs text-slate-400">Current Q3</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Samarth Thakkar', pipeline: '₹24,50,000', closed: '₹14,00,000', winRate: '72%' },
              { name: 'Neel Vora', pipeline: '₹16,80,000', closed: '₹9,50,000', winRate: '65%' },
              { name: 'Priya Sharma', pipeline: '₹12,40,000', closed: '₹8,20,000', winRate: '68%' },
            ].map((rep, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{rep.name}</span>
                  <div className="text-slate-500 mt-0.5">Pipeline: {rep.pipeline}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">{rep.closed}</span>
                  <div className="text-slate-400 mt-0.5">Win: {rep.winRate}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/sales/pipeline')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center"
            >
              Open Full Kanban Pipeline &rarr;
            </button>
          </div>
        </div>

        {/* Recent Quotations requiring management eye */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">High-Impact Team Deals</h3>
            <button
              onClick={() => navigate('/sales/quotations')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View All Quotations
            </button>
          </div>

          {loadingQuotes ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Quote #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Rep</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.slice(0, 5).map(q => {
                    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{q.quotationNumber || `QT-${q.id.slice(0,6)}`}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{q.customer?.companyName || 'Enterprise Client'}</td>
                        <td className="py-3 px-3 text-slate-600">{q.salesRep?.name || 'Sales Rep'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">₹{Number(v.totalAmount || q.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3"><RiskBadge score={v.riskScore || 25} level={v.riskLevel} /></td>
                        <td className="py-3 px-3"><StatusBadge status={q.status} /></td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => navigate(`/sales/quotations/${q.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Inspect
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
    </div>
  );
}
