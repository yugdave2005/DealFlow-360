import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShoppingBag, 
  RefreshCw, 
  Receipt, 
  MessageSquare, 
  Plus, 
  Inbox
} from 'lucide-react';
import { customersApi } from '../../features/customers/customers.api';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { api } from '../../lib/axios';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('QUOTATIONS');

  // Fetch all customers for matching profile metadata
  const { data: customersData = [] } = useQuery({
    queryKey: ['adminCustomersList'],
    queryFn: () => customersApi.getCustomers().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const customerRecord = useMemo(() => {
    const list = Array.isArray(customersData) ? customersData : (customersData?.data || []);
    return list.find(c => c.id === id) || null;
  }, [customersData, id]);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['customerDetailQuotations', id],
    queryFn: () => quotationsApi.getQuotations().then(res => res.data?.data || res.data || []).catch(() => [])
  });

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
  const customerName = customerRecord?.companyName || customerRecord?.name || firstQuote?.customer?.companyName || firstQuote?.customer?.name || (id ? `Client Account #${id.slice(0, 8)}` : 'Client Account');
  const customerTier = customerRecord?.tier || firstQuote?.customer?.tier || 'STANDARD';
  const customerEmail = customerRecord?.email || firstQuote?.customer?.email || 'customer@company.com';

  const totalRevenue = customerQuotes
    .filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status))
    .reduce((sum, q) => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
    }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/sales/customers')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer Directory</span>
      </button>

      {/* Account Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{customerName}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {customerTier} TIER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customerEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sales/quotations/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Quotation for Client</span>
            </button>
          </div>
        </div>

        {/* Commercial & Governance Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Confirmed Spend</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Proposals</span>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">{customerQuotes.length} Quotes</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pricing Tier</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{customerTier}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'QUOTATIONS', label: `Quotations (${customerQuotes.length})`, icon: FileText },
          { id: 'ORDERS', label: 'Orders', icon: ShoppingBag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
        {activeTab === 'QUOTATIONS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 text-base">Quotation History</h3>
            </div>
            {isLoading ? (
              <LoadingSkeleton count={2} />
            ) : customerQuotes.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No quotations recorded for this client</p>
                <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;New Quotation for Client&rdquo; to create one.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerQuotes.map(q => {
                      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">{q.quotationNumber || `QT-${q.id.slice(0,6)}`}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">₹{Number(v.totalAmount || q.totalAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4"><StatusBadge status={q.status} /></td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => navigate(`/sales/quotations/${q.id}`)} className="text-indigo-600 font-bold hover:underline">View Deal</button>
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
            <h3 className="font-bold text-slate-900 text-base">Fulfillment Orders</h3>
            {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No confirmed orders</p>
                <p className="text-xs text-slate-400 mt-0.5">Orders appear here when a quotation is confirmed.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).map(q => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 font-mono text-sm">{q.quotationNumber || `ORD-${q.id.slice(0,6)}`}</strong>
                      <p className="text-slate-500 mt-0.5">Confirmed deal</p>
                    </div>
                    <button
                      onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg"
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
