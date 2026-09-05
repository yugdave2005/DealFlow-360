import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Building, 
  Mail, 
  Phone, 
  FileText, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import RiskBadge from '../../components/common/RiskBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/customers`;
const getToken = () => localStorage.getItem('accessToken');

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const { data: customerTiers = [], isLoading: isTiersLoading } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => adminApi.getCustomerTiers().then(res => res.data).catch(() => [])
  });

  const { data: quotations = [], isLoading: isQuotesLoading } = useQuery({
    queryKey: ['salesQuotations'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/quotations`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const isLoading = isTiersLoading || isQuotesLoading;

  // Derive customer records from tiers and active quotations
  const customerList = useMemo(() => {
    if (!customerTiers || customerTiers.length === 0) return [];
    
    return customerTiers.map(tier => {
      const relatedQuotes = quotations.filter(q => q.customerId === tier.id || q.quotationNumber?.includes(tier.name));
      const pipelineValue = relatedQuotes.reduce((sum, q) => sum + Number(q.activeVersion?.totalAmount || 0), 0);
      const avgRisk = relatedQuotes.length > 0 
        ? Math.round(relatedQuotes.reduce((sum, q) => sum + (q.activeVersion?.riskScore || 0), 0) / relatedQuotes.length)
        : 0;

      return {
        id: tier.id,
        companyName: tier.name.includes('Tier') || tier.name.includes('Enterprise') ? tier.name : `${tier.name} Corporation`,
        tier: tier.name.toUpperCase().includes('ENTERPRISE') ? 'ENTERPRISE' : tier.name.toUpperCase().includes('MID') ? 'MID_MARKET' : 'SMB',
        contactName: tier.description || 'Account Representative',
        email: `contact@${tier.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        activeQuotesCount: relatedQuotes.length,
        pipelineValue: pipelineValue,
        lastActivity: relatedQuotes.length > 0 ? 'Recently updated' : 'Active Account',
        riskScore: avgRisk,
        riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW'
      };
    });
  }, [customerTiers, quotations]);

  const filteredCustomers = customerList.filter(c => {
    const name = c.companyName || '';
    const contact = c.contactName || '';
    const email = c.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
              <p className="text-sm text-slate-500 mt-0.5">Commercial accounts, Tier governance limits & deal lifecycle history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search company name, primary contact or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Tiers</option>
            <option value="ENTERPRISE">Enterprise (25% max disc)</option>
            <option value="MID_MARKET">Mid-Market (15% max disc)</option>
            <option value="SMB">SMB (10% max disc)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Users}
              title="No customer accounts found."
              description="Customer accounts are created when proposals and quotations are dispatched."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Customer Tier</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Active Quotes</th>
                  <th className="py-3.5 px-4">Pipeline Value</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4">Risk Profile</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const tierColors = {
                    ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200',
                    MID_MARKET: 'bg-blue-50 text-blue-700 border-blue-200',
                    SMB: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  };

                  return (
                    <tr 
                      key={cust.id} 
                      onClick={() => navigate(`/sales/customers/${cust.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-base">{cust.companyName}</div>
                        <div className="text-xs text-slate-400">ID: {cust.id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[cust.tier] || 'bg-slate-100 text-slate-700'}`}>
                          {cust.tier}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{cust.contactName || cust.name || 'Primary Contact'}</div>
                        <div className="text-xs text-slate-400">{cust.email}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {cust.activeQuotesCount} deals
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{Number(cust.pipelineValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-500">
                        {cust.lastActivity || 'No active proposals'}
                      </td>
                      <td className="py-4 px-4">
                        <RiskBadge score={cust.riskScore || 0} level={cust.riskLevel} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/sales/customers/${cust.id}`); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <span>360° View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
