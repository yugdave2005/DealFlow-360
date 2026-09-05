import { useState, useMemo } from 'react';
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
  ShieldAlert, 
  ChevronRight,
  Inbox
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_QUOTES = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/quotations`;
const API_APPROVALS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/approvals`;
const getToken = () => localStorage.getItem('accessToken');

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const { data: quotations = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['managerQuotes'],
    queryFn: async () => {
      const res = await fetch(API_QUOTES, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
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

  const totalDiscountSum = quotations.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    const amt = Number(v.totalAmount) || 0;
    const disc = Number(v.totalDiscount) || 0;
    return sum + (amt > 0 ? (disc / amt) * 100 : 0);
  }, 0);
  const avgDiscount = quotations.length > 0 ? (totalDiscountSum / quotations.length).toFixed(1) : '0.0';

  // Group by real sales rep from database
  const repStats = useMemo(() => {
    const map = {};
    quotations.forEach(q => {
      const repName = q.salesRep?.name || q.salesRep?.email || 'Unassigned Rep';
      if (!map[repName]) {
        map[repName] = { name: repName, pipeline: 0, closed: 0, totalQuotes: 0, confirmedQuotes: 0 };
      }
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      const amt = Number(v.totalAmount) || Number(q.totalAmount) || 0;
      map[repName].pipeline += amt;
      map[repName].totalQuotes += 1;
      if (['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)) {
        map[repName].closed += amt;
        map[repName].confirmedQuotes += 1;
      }
    });

    return Object.values(map);
  }, [quotations]);

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
              Sales Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
              Sales Manager
            </span>
          </div>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Team pipeline performance, governance authorizations & deal velocity
          </p>
        </div>

        <button
          onClick={() => navigate('/sales/approvals')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-xs shrink-0 active:scale-[0.97] cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Review Approvals ({approvals.length})</span>
        </button>
      </div>

      {/* 6 Manager KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Team Pipeline</span>
          <p className="text-xl font-bold text-[#171717] mt-1">₹{teamPipelineValue.toLocaleString('en-IN')}</p>
          <span className="text-xs text-[#96918A] mt-0.5 block">{quotations.length} total deals</span>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Active Deals</span>
          <p className="text-xl font-bold text-[#171717] mt-1">{activeQuotesCount}</p>
          <span className="text-xs text-[#96918A] mt-0.5 block">Across all reps</span>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Pending Approvals</span>
          <p className="text-xl font-bold text-[#8B6CC7] mt-1">{approvals.length}</p>
          <span className="text-xs text-[#8B6CC7] font-semibold mt-0.5 block">Awaiting sign-off</span>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">At-Risk Deals</span>
          <p className="text-xl font-bold text-[#C95757] mt-1">{atRiskCount}</p>
          <span className="text-xs text-[#C95757] font-semibold mt-0.5 block">Risk score &gt; 40</span>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Avg Discount</span>
          <p className="text-xl font-bold text-[#171717] mt-1">{avgDiscount}%</p>
          <span className="text-xs text-[#3F8F63] font-semibold mt-0.5 block">Portfolio average</span>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Confirmed</span>
          <p className="text-xl font-bold text-[#3F8F63] mt-1">
            {quotations.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).length}
          </p>
          <span className="text-xs text-[#3F8F63] font-semibold mt-0.5 block">Won deals</span>
        </div>
      </div>

      {/* Manager Attention Section */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D9A654]" />
            <h3 className="text-[15px] font-semibold text-[#171717]">Manager Attention Required</h3>
          </div>
          <span className="text-xs font-semibold text-[#D97757] hover:underline cursor-pointer" onClick={() => navigate('/sales/deal-health')}>
            View Deal Health Radar &rarr;
          </span>
        </div>

        {approvals.length === 0 && atRiskCount === 0 ? (
          <div className="py-6 text-center bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9]">
            <div className="w-10 h-10 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#96918A] mx-auto mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[#6F6B66]">No active escalations or pending approvals requiring attention.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvals.length > 0 && (
              <div 
                onClick={() => navigate('/sales/approvals')}
                className="p-4 bg-purple-50/50 rounded-[12px] border border-purple-200/80 hover:bg-purple-50 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">Pending Approvals</span>
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                </div>
                <p className="text-xs text-purple-800">
                  <strong>{approvals.length} quotation(s)</strong> require manager sign-off on pricing/discounts.
                </p>
                <div className="text-xs font-semibold text-purple-700 flex items-center gap-1 pt-1">
                  <span>Review queue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {atRiskCount > 0 && (
              <div 
                onClick={() => navigate('/sales/deal-health')}
                className="p-4 bg-rose-50/50 rounded-[12px] border border-rose-200/80 hover:bg-rose-50 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">High-Risk Deals</span>
                  <Percent className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-xs text-rose-800">
                  <strong>{atRiskCount} deal(s)</strong> exhibit high discount or anomaly risk score.
                </p>
                <div className="text-xs font-semibold text-rose-700 flex items-center gap-1 pt-1">
                  <span>Inspect health</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Pipeline & Recent Team Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Team Rep Performance */}
        <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-[#171717]">Sales Rep Velocity</h3>

          {repStats.length === 0 ? (
            <div className="py-8 text-center bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9]">
              <div className="w-10 h-10 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#96918A] mx-auto mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-[#6F6B66]">No representative deal data found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {repStats.map((rep, idx) => (
                <div key={idx} className="p-3 bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9] flex items-center justify-between text-xs hover:border-[#D8D1C8] transition-colors">
                  <div>
                    <span className="font-semibold text-[#171717]">{rep.name}</span>
                    <div className="text-[#96918A] mt-0.5">Pipeline: ₹{rep.pipeline.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#3F8F63]">₹{rep.closed.toLocaleString('en-IN')}</span>
                    <div className="text-[#96918A] mt-0.5">{rep.confirmedQuotes}/{rep.totalQuotes} won</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[#E6E1D9]/60">
            <button
              onClick={() => navigate('/sales/pipeline')}
              className="w-full py-2.5 bg-[#F5F2ED] hover:bg-[#EDE9E2] text-[#6F6B66] hover:text-[#171717] text-xs font-semibold rounded-[10px] transition-colors text-center border border-[#E6E1D9] cursor-pointer"
            >
              Open Full Kanban Pipeline &rarr;
            </button>
          </div>
        </div>

        {/* Recent Quotations requiring management eye */}
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold text-[#171717]">Team Deals Queue</h3>
            <button
              onClick={() => navigate('/sales/quotations')}
              className="text-xs font-semibold text-[#D97757] hover:text-[#C96648] hover:underline cursor-pointer transition-colors"
            >
              View All Quotations
            </button>
          </div>

          {loadingQuotes ? (
            <LoadingSkeleton count={3} />
          ) : quotations.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF9F6] rounded-[10px] border border-[#E6E1D9]">
              <div className="w-10 h-10 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#96918A] mx-auto mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#171717]">No quotations recorded in database</p>
              <p className="text-xs text-[#96918A] mt-0.5">When sales reps create proposals, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#6F6B66] font-semibold uppercase tracking-wider text-[11px]">
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
                <tbody className="divide-y divide-[#E6E1D9]/50">
                  {quotations.slice(0, 5).map(q => {
                    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                    return (
                      <tr key={q.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-[#D97757]">{q.quotationNumber || `QT-${q.id.slice(0,6)}`}</td>
                        <td className="py-3 px-3 font-semibold text-[#171717]">{q.customer?.companyName || 'Client'}</td>
                        <td className="py-3 px-3 text-[#6F6B66]">{q.salesRep?.name || 'Sales Rep'}</td>
                        <td className="py-3 px-3 font-bold text-[#171717]">₹{Number(v.totalAmount || q.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3"><RiskBadge score={v.riskScore || 25} level={v.riskLevel} /></td>
                        <td className="py-3 px-3"><StatusBadge status={q.status} /></td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => navigate(`/sales/quotations/${q.id}`)}
                            className="text-xs font-semibold text-[#D97757] hover:text-[#C96648] cursor-pointer transition-colors"
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