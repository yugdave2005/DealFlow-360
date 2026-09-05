import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Building2, 
  Mail, 
  ChevronRight, 
  X,
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone
} from 'lucide-react';
import { customersApi } from '../../features/customers/customers.api';
import RiskBadge from '../../components/common/RiskBadge';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // 1. Fetch Customers
  const { 
    data: customerAccounts = [], 
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ['adminCustomersList'],
    queryFn: () => customersApi.getCustomers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  // 2. Fetch Quotations to enrich commercial profile & 360 view
  const { 
    data: quotations = [], 
    isLoading: isQuotesLoading 
  } = useQuery({
    queryKey: ['salesQuotations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const isLoading = isCustomersLoading || isQuotesLoading;

  // Process and join customer accounts with quotation statistics
  const customerList = useMemo(() => {
    const rawList = Array.isArray(customerAccounts) ? customerAccounts : (customerAccounts?.data || []);
    if (!rawList || rawList.length === 0) return [];
    
    return rawList.map(c => {
      const relatedQuotes = quotations.filter(q => 
        q.customerId === c.id || 
        q.quotationNumber?.includes(c.name) ||
        (q.customer && (q.customer.id === c.id || q.customer.email === c.email))
      );
      
      const pipelineValue = c.pipelineValue !== undefined && c.pipelineValue > 0 
        ? c.pipelineValue 
        : relatedQuotes.reduce((sum, q) => sum + Number(q.activeVersion?.totalAmount || q.totalAmount || 0), 0);
        
      const avgRisk = relatedQuotes.length > 0 
        ? Math.round(relatedQuotes.reduce((sum, q) => sum + (q.activeVersion?.riskScore || 0), 0) / relatedQuotes.length)
        : (c.riskScore || 0);

      const tier = (c.tier || 'STANDARD').toUpperCase();
      
      return {
        id: c.id,
        companyName: c.companyName || c.name || 'Commercial Account',
        name: c.name,
        tier: tier,
        tierDiscountLimit: c.tierDiscountLimit || (tier === 'ENTERPRISE' ? 15 : tier === 'GOLD' ? 12 : 10),
        contactName: c.contactName || c.contact || c.name || 'Primary Contact',
        email: c.email || 'customer@company.com',
        activeQuotesCount: relatedQuotes.length > 0 ? relatedQuotes.length : (c.activeQuotesCount || 0),
        pipelineValue: Number(pipelineValue || 0),
        lastActivity: relatedQuotes.length > 0 ? 'Active Deals' : 'Registered Account',
        riskScore: avgRisk,
        riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW',
        isActive: c.isActive !== false,
        quotes: relatedQuotes
      };
    });
  }, [customerAccounts, quotations]);

  // Search and Tier Filter
  const filteredCustomers = useMemo(() => {
    return customerList.filter(c => {
      const name = (c.companyName || '').toLowerCase();
      const contact = (c.contactName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || name.includes(term) || contact.includes(term) || email.includes(term);
      const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
      
      return matchesSearch && matchesTier;
    });
  }, [customerList, searchTerm, tierFilter]);

  // Selected customer for 360 View Drawer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerList.find(c => c.id === selectedCustomerId) || null;
  }, [customerList, selectedCustomerId]);

  // Aggregate metrics for contextual summary bar
  const summaryMetrics = useMemo(() => {
    const totalCustomers = customerList.length;
    const activeDeals = customerList.reduce((acc, c) => acc + (c.activeQuotesCount || 0), 0);
    const totalPipeline = customerList.reduce((acc, c) => acc + (c.pipelineValue || 0), 0);
    const highRiskCount = customerList.filter(c => c.riskScore > 45 || c.riskLevel === 'HIGH').length;

    return { totalCustomers, activeDeals, totalPipeline, highRiskCount };
  }, [customerList]);

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]';
      case 'GOLD':
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
      case 'STANDARD':
      default:
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header (Flat Canvas - No giant card) */}
      <div className="border-b border-[#EEEAE4] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[32px] sm:text-[38px] font-semibold text-[#171717] tracking-tight leading-tight">
              Customer Directory
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#6F6B66] mt-1 font-normal">
              Commercial accounts, tier governance limits & deal lifecycle history.
            </p>
          </div>
        </div>

        {/* Compact Summary Bar */}
        {!isLoading && customerList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-3 border-t border-[#EEEAE4]/60 text-xs sm:text-[13px]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Users className="w-3.5 h-3.5 text-[#D97757]" />
              <span className="font-semibold">{summaryMetrics.totalCustomers}</span>
              <span className="text-[#6F6B66]">Customers</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <FileText className="w-3.5 h-3.5 text-[#6F6B66]" />
              <span className="font-semibold">{summaryMetrics.activeDeals}</span>
              <span className="text-[#6F6B66]">Active Deals</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <DollarSign className="w-3.5 h-3.5 text-[#3F8F63]" />
              <span className="font-semibold">₹{summaryMetrics.totalPipeline.toLocaleString('en-IN')}</span>
              <span className="text-[#6F6B66]">Pipeline</span>
            </div>

            {summaryMetrics.highRiskCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FBEAEA] border border-[#F5C7C7] text-[#C95757] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C95757]" />
                <span className="font-semibold">{summaryMetrics.highRiskCount}</span>
                <span>High Risk</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Search + Filter Toolbar (Lightweight, No outer card) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-[420px] md:w-[480px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
          <input
            type="text"
            placeholder="Search company name, primary contact or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <label className="text-[13px] font-semibold text-[#6F6B66] whitespace-nowrap">Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="ENTERPRISE">Enterprise Tier</option>
            <option value="GOLD">Gold Tier</option>
            <option value="STANDARD">Standard Tier</option>
          </select>
        </div>
      </div>

      {/* 3. Customer Table (Single Outer Surface, No Nested Cards) */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : isCustomersError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-[#C95757]">Unable to load customer directory.</p>
            <button
              onClick={() => refetchCustomers()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[10px] bg-[#F5F2ED] hover:bg-[#EDE8E0] text-[#171717] border border-[#E6E1D9] transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Users}
              title={searchTerm || tierFilter !== 'ALL' ? 'No matching customers found' : 'No customer accounts yet'}
              description={
                searchTerm || tierFilter !== 'ALL' 
                  ? 'Try adjusting your search criteria or tier filter.' 
                  : 'Customer accounts will appear here once proposals and quotations are dispatched.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-3.5 px-6">Company</th>
                  <th className="py-3.5 px-4">Customer Tier</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Active Quotes</th>
                  <th className="py-3.5 px-4">Pipeline Value</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4">Risk Profile</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4]">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.id;

                  return (
                    <tr 
                      key={cust.id} 
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`
                        transition-colors duration-150 cursor-pointer group
                        ${isSelected ? 'bg-[#F8E9E3]/30' : 'hover:bg-[#FBFAF8]'}
                      `}
                      style={{ height: '74px' }}
                    >
                      {/* 1. Company Name & ID */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#171717] text-[15px] sm:text-[16px] group-hover:text-[#D97757] transition-colors leading-snug">
                          {cust.companyName}
                        </div>
                        <div className="text-[12px] text-[#96918A] font-mono mt-0.5 truncate max-w-[180px]">
                          ID: {cust.id}
                        </div>
                      </td>

                      {/* 2. Customer Tier Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${getTierBadgeStyle(cust.tier)}`}>
                          {cust.tier}
                        </span>
                      </td>

                      {/* 3. Primary Contact */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#171717] text-[14px]">
                          {cust.contactName}
                        </div>
                        <div className="text-[13px] text-[#96918A] truncate max-w-[200px]">
                          {cust.email}
                        </div>
                      </td>

                      {/* 4. Active Quotes */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#171717] text-[14px]">
                          {cust.activeQuotesCount} {cust.activeQuotesCount === 1 ? 'quotation' : 'quotations'}
                        </div>
                        <div className="text-[12px] text-[#96918A]">
                          active deals
                        </div>
                      </td>
                      {/* 5. Pipeline Value */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#171717] text-[15px] sm:text-[16px]">
                          ₹{Number(cust.pipelineValue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 6. Last Activity */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-[13px] text-[#6F6B66]">
                          {cust.lastActivity || 'Registered'}
                        </span>
                      </td>

                      {/* 7. Risk Profile */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <RiskBadge score={cust.riskScore || 0} level={cust.riskLevel} />
                      </td>

                      {/* 8. Actions (360° View) */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedCustomerId(cust.id); 
                          }}
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold bg-white hover:bg-[#F8E9E3] text-[#6F6B66] hover:text-[#C96648] border border-[#E6E1D9] hover:border-[#E9B8A7] rounded-[9px] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        >
                          <span>360Â° View</span>
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

      {/* 4. Customer 360 Slide-over Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#171717]/30 backdrop-blur-[2px] transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-[540px] bg-white border-l border-[#E6E1D9] shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E6E1D9] bg-[#FAF9F6] shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadgeStyle(selectedCustomer.tier)}`}>
                        {selectedCustomer.tier} TIER
                      </span>
                      <RiskBadge score={selectedCustomer.riskScore || 0} level={selectedCustomer.riskLevel} />
                    </div>
                    <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#171717] tracking-tight">
                      {selectedCustomer.companyName}
                    </h2>
                    <p className="text-[12px] font-mono text-[#96918A] mt-0.5">
                      ID: {selectedCustomer.id}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="p-1.5 text-[#6F6B66] hover:text-[#171717] hover:bg-[#EDE8E0] rounded-[8px] transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Commercial Profile */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Commercial Profile
                  </h3>
                  <div className="bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4] p-4 space-y-2.5 text-xs sm:text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Customer Tier</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.tier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Governance Discount Limit</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.tierDiscountLimit}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Active Quotations</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.activeQuotesCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Pipeline Value</span>
                      <span className="font-semibold text-[#171717]">
                        ₹{Number(selectedCustomer.pipelineValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Commercial Risk Score</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.riskScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* 2. Primary Contact Details */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Primary Contact
                  </h3>
                  <div className="bg-white rounded-[10px] border border-[#E6E1D9] p-4 space-y-2 text-xs sm:text-[13px]">
                    <div className="flex items-center gap-2 text-[#171717] font-medium">
                      <Users className="w-4 h-4 text-[#D97757]" />
                      <span>{selectedCustomer.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6F6B66]">
                      <Mail className="w-4 h-4 text-[#96918A]" />
                      <a href={`mailto:${selectedCustomer.email}`} className="hover:text-[#D97757] transition-colors">
                        {selectedCustomer.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. Quotation History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                      Quotation History ({selectedCustomer.quotes?.length || 0})
                    </h3>
                  </div>

                  {(!selectedCustomer.quotes || selectedCustomer.quotes.length === 0) ? (
                    <div className="p-4 rounded-[10px] border border-[#EEEAE4] bg-[#FAF9F6] text-center text-xs text-[#6F6B66]">
                      No recorded quotations found for this account.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.quotes.map((q) => {
                        const amount = Number(q.activeVersion?.totalAmount || q.totalAmount || 0);
                        const itemsCount = q.activeVersion?.items?.length || 0;

                        return (
                          <div 
                            key={q.id}
                            onClick={() => navigate(`/sales/quotations/${q.id}`)}
                            className="p-3.5 rounded-[10px] border border-[#E6E1D9] bg-white hover:bg-[#FBFAF8] hover:border-[#D97757]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-[13px] text-[#171717] group-hover:text-[#D97757] transition-colors">
                                  {q.quotationNumber || `QT-${q.id.slice(0, 8)}`}
                                </span>
                                <StatusBadge status={q.status} />
                              </div>
                              <div className="text-[11px] text-[#96918A]">
                                {itemsCount > 0 ? `${itemsCount} line items` : 'Commercial quotation'} • {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-xs sm:text-[13px] text-[#171717]">
                                ₹{amount.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[11px] text-[#D97757] font-medium flex items-center justify-end gap-0.5 mt-0.5">
                                View <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Negotiation & Risk Insights */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Governance & Risk Notes
                  </h3>
                  <div className="p-4 rounded-[10px] bg-[#FAF9F6] border border-[#EEEAE4] text-xs text-[#6F6B66] space-y-2 leading-relaxed">
                    <p>
                      • Standard tier pricing policy applies. Commercial requests exceeding {selectedCustomer.tierDiscountLimit}% discount trigger automated multi-tier approval routing.
                    </p>
                    {selectedCustomer.riskScore > 45 ? (
                      <p className="text-[#C95757] font-medium">
                        • Warning: Elevated deal margin or terms risk detected. Review payment schedules and margin floors prior to contract dispatch.
                      </p>
                    ) : (
                      <p className="text-[#3F8F63] font-medium">
                        • Account maintains healthy margin thresholds and standard governance metrics.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer CTA */}
              <div className="p-4 sm:p-5 border-t border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] bg-white border border-[#E6E1D9] rounded-[9px] transition-all cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate(`/sales/customers/${selectedCustomer.id}`);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[9px] transition-all flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                  <span>Full Customer 360° Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}