import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  FileText, 
  ShoppingBag, 
  Plus, 
  Inbox,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Shield,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { adminApi } from '../../features/admin/admin.api';
import { api } from '../../lib/axios';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('QUOTATIONS');

  // Fetch all customers for matching profile metadata
  const { data: customersData = [], isLoading: isCustomersLoading } = useQuery({
    queryKey: ['adminCustomersList'],
    queryFn: () => adminApi.getCustomers().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const customerRecord = useMemo(() => {
    const list = Array.isArray(customersData) ? customersData : (customersData?.data || []);
    return list.find(c => c.id === id) || null;
  }, [customersData, id]);

  const { data: quotations = [], isLoading: isQuotesLoading } = useQuery({
    queryKey: ['customerDetailQuotations', id],
    queryFn: () => api.get('/quotations').then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const isLoading = isCustomersLoading || isQuotesLoading;

  const customerQuotes = useMemo(() => {
    if (!Array.isArray(quotations)) return [];
    return quotations.filter(q => 
      q.customerId === id || 
      q.customer?.id === id || 
      (customerRecord?.email && q.customer?.email === customerRecord.email) ||
      (customerRecord?.name && q.customer?.name === customerRecord.name) ||
      q.id === id
    );
  }, [quotations, id, customerRecord]);

  const firstQuote = customerQuotes[0];
  const customerName = customerRecord?.companyName || customerRecord?.name || firstQuote?.customer?.companyName || firstQuote?.customer?.name || (id ? `Account #${id.slice(0, 8)}` : 'Client Account');
  const customerTier = (customerRecord?.tier || firstQuote?.customer?.tier || 'STANDARD').toUpperCase();
  const customerEmail = customerRecord?.email || firstQuote?.customer?.email || 'customer@company.com';
  const contactName = customerRecord?.contactName || customerRecord?.name || 'Primary Contact';

  const totalRevenue = customerQuotes
    .filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status))
    .reduce((sum, q) => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
    }, 0);

  const totalPipeline = customerQuotes.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
  }, 0);

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]';
      case 'GOLD':
      case 'STANDARD':
      default:
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/sales/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6B66] hover:text-[#D97757] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </button>
      </div>

      {/* Account Overview Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E6E1D9] shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757] shadow-xs shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#171717] tracking-tight">
                  {customerName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadgeStyle(customerTier)}`}>
                  {customerTier} TIER
                </span>
                {customerRecord?.riskScore !== undefined && (
                  <RiskBadge score={customerRecord.riskScore} level={customerRecord.riskLevel} />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6F6B66] mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#96918A]" />
                  <span>{customerEmail}</span>
                </span>
                <span>•</span>
                <span>Contact: <strong className="text-[#171717] font-medium">{contactName}</strong></span>
                <span>•</span>
                <span className="font-mono text-[#96918A]">ID: {id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => navigate('/sales/quotations/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D97757] hover:bg-[#C96648] text-white text-xs font-semibold rounded-[9px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </button>
          </div>
        </div>

        {/* Commercial & Governance Parameters Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EEEAE4]">
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Confirmed Revenue</span>
            <p className="text-[18px] font-semibold text-[#171717] mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Total Pipeline</span>
            <p className="text-[18px] font-semibold text-[#D97757] mt-0.5">₹{totalPipeline.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Discount Governance Limit</span>
            <p className="text-[18px] font-semibold text-[#171717] mt-0.5">{customerRecord?.tierDiscountLimit || 15}% max</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EEEAE4]">
        {[
          { id: 'QUOTATIONS', label: `Quotations (${customerQuotes.length})`, icon: FileText },
          { id: 'ORDERS', label: 'Orders & Fulfillment', icon: ShoppingBag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#D97757] text-[#D97757]'
                  : 'border-transparent text-[#6F6B66] hover:text-[#171717]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm p-5 sm:p-6">
        {activeTab === 'QUOTATIONS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[15px] font-semibold text-[#171717]">Quotation History</h3>
            </div>

            {isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : customerQuotes.length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="w-8 h-8 text-[#96918A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#171717]">No quotations recorded for this client</p>
                <p className="text-xs text-[#6F6B66] mt-0.5">Click &ldquo;New Quotation&rdquo; to build and dispatch one.</p>
              </div>
            ) : (
              <div className="border border-[#E6E1D9] rounded-[10px] overflow-hidden">
                <table className="w-full text-left text-xs sm:text-[13px]">
                  <thead className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#96918A] font-semibold uppercase tracking-[0.05em] text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {customerQuotes.map(q => {
                      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                      return (
                        <tr key={q.id} className="hover:bg-[#FBFAF8] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#171717]">
                            {q.quotationNumber || `QT-${q.id.slice(0, 6)}`}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#171717]">
                            ₹{Number(v.totalAmount || q.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={q.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => navigate(`/sales/quotations/${q.id}`)} 
                              className="text-xs font-semibold text-[#D97757] hover:text-[#C96648] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>View Deal</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
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
        )}

        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold text-[#171717]">Fulfillment Orders</h3>
            {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="w-8 h-8 text-[#96918A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#171717]">No confirmed orders yet</p>
                <p className="text-xs text-[#6F6B66] mt-0.5">Orders appear here once a quotation is approved and confirmed.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).map(q => (
                  <div key={q.id} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4] text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-[#171717] font-mono text-[13px]">{q.quotationNumber || `ORD-${q.id.slice(0, 6)}`}</strong>
                      <p className="text-[#6F6B66] mt-0.5">Confirmed commercial order</p>
                    </div>
                    <button
                      onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F8E9E3] text-[#6F6B66] hover:text-[#C96648] border border-[#E6E1D9] hover:border-[#E9B8A7] font-semibold rounded-[8px] transition-all cursor-pointer"
                    >
                      View Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
