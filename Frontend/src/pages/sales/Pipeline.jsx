import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Columns3, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  AlertTriangle, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/quotations`;
const getToken = () => localStorage.getItem('accessToken');

const PIPELINE_STAGES = [
  { id: 'DRAFT', label: 'Draft', color: 'border-t-slate-400 bg-slate-50/50' },
  { id: 'SENT', label: 'Sent', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'UNDER_NEGOTIATION', label: 'Under Negotiation', color: 'border-t-amber-500 bg-amber-50/30' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'border-t-purple-500 bg-purple-50/30' },
  { id: 'APPROVED', label: 'Approved', color: 'border-t-indigo-500 bg-indigo-50/30' },
  { id: 'CONFIRMED', label: 'Confirmed', color: 'border-t-emerald-500 bg-emerald-50/30' },
  { id: 'FULFILLMENT', label: 'Fulfillment', color: 'border-t-cyan-500 bg-cyan-50/30' },
  { id: 'COMPLETED', label: 'Completed', color: 'border-t-emerald-600 bg-emerald-50/40' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [repFilter, setRepFilter] = useState('ALL');

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['pipelineQuotations'],
    queryFn: async () => {
      try {
        const token = getToken();
        if (!token) return [];
        const res = await fetch(API_BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    }
  });

  // Calculate days inactive from updatedAt
  const getDaysInactive = (dateStr) => {
    if (!dateStr) return 0;
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Filter deals
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customer?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      const riskLevel = v.riskLevel || (v.riskScore > 60 ? 'HIGH' : v.riskScore > 30 ? 'MEDIUM' : 'LOW');
      const matchRisk = riskFilter === 'ALL' || riskLevel === riskFilter;

      return matchSearch && matchRisk;
    });
  }, [quotations, searchTerm, riskFilter]);

  // Group by stage
  const stageColumns = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.id] = [];
    });

    filteredQuotations.forEach(q => {
      let stageKey = q.status;
      if (stageKey === 'PENDING_APPROVAL' || stageKey === 'APPROVAL_PENDING') stageKey = 'PENDING_APPROVAL';
      if (stageKey === 'NEGOTIATION' || stageKey === 'CUSTOMER_NEGOTIATION') stageKey = 'UNDER_NEGOTIATION';
      if (stageKey === 'PROCESSING') stageKey = 'FULFILLMENT';
      if (stageKey === 'PAID') stageKey = 'COMPLETED';

      if (grouped[stageKey]) {
        grouped[stageKey].push(q);
      } else {
        // Fallback for draft or others
        if (grouped['DRAFT']) grouped['DRAFT'].push(q);
      }
    });

    return grouped;
  }, [filteredQuotations]);

  // Total Pipeline metrics
  const totalPipelineValue = useMemo(() => {
    return quotations.reduce((acc, q) => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return acc + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
    }, 0);
  }, [quotations]);

  const activeDealsCount = useMemo(() => {
    return quotations.filter(q => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(q.status)).length;
  }, [quotations]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Columns3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
              <p className="text-sm text-slate-500 mt-0.5">Visual stage-by-stage revenue flow & deal progression</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block pr-4 border-r border-slate-200">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Pipeline</span>
            <p className="text-lg font-bold text-slate-900">₹{totalPipelineValue.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => navigate('/sales/quotations/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotation #, customer company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1400px]">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = stageColumns[stage.id] || [];
              const stageValue = stageDeals.reduce((acc, q) => {
                const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                return acc + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
              }, 0);

              return (
                <div 
                  key={stage.id} 
                  className={`flex-1 min-w-[280px] rounded-xl border border-slate-200/90 flex flex-col max-h-[calc(100vh-280px)] border-t-4 ${stage.color} bg-white shadow-xs`}
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{stage.label}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
                          {stageDeals.length}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        ₹{stageValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Deals Container */}
                  <div className="p-3 overflow-y-auto space-y-3 flex-1">
                    {stageDeals.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        No deals in {stage.label.toLowerCase()}
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const v = deal.activeVersion || (deal.versions && deal.versions[0]) || {};
                        const amount = Number(v.totalAmount) || Number(deal.totalAmount) || 0;
                        const discount = Number(v.totalDiscount) || 0;
                        const marginPercent = v.marginPercent || 25;
                        const riskScore = v.riskScore || 15;
                        const daysInactive = getDaysInactive(deal.updatedAt);
                        const isStalled = daysInactive >= 7;

                        return (
                          <div
                            key={deal.id}
                            onClick={() => navigate(`/sales/quotations/${deal.id}`)}
                            className={`p-3.5 bg-white rounded-xl border transition-all duration-150 hover:shadow-md hover:border-indigo-200 cursor-pointer ${
                              isStalled ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90'
                            }`}
                          >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  {deal.quotationNumber || `QT-${deal.id.slice(0, 6)}`}
                                </span>
                                <h4 className="font-semibold text-slate-900 text-sm mt-1.5 line-clamp-1">
                                  {deal.customer?.companyName || 'Enterprise Client'}
                                </h4>
                              </div>
                              <RiskBadge score={riskScore} level={v.riskLevel} />
                            </div>

                            {/* Card Financials */}
                            <div className="bg-slate-50/80 rounded-lg p-2.5 my-2.5 border border-slate-100">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs text-slate-500 font-medium">Deal Amount</span>
                                <span className="text-sm font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-500">
                                <span>Margin: <strong className="text-emerald-700 font-semibold">{marginPercent}%</strong></span>
                                {discount > 0 && (
                                  <span className="text-rose-600 font-medium">Disc: ₹{discount.toLocaleString('en-IN')}</span>
                                )}
                              </div>
                            </div>

                            {/* Card Footer Indicators */}
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[90px]">{deal.salesRep?.name || 'Sales Rep'}</span>
                              </div>

                              <div className={`flex items-center gap-1 font-medium ${isStalled ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{daysInactive}d</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
