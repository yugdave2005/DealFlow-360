import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  ShoppingBag, 
  RefreshCw, 
  Receipt, 
  MessageSquare, 
  Plus, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';

const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/customers`;
const getToken = () => localStorage.getItem('accessToken');

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('QUOTATIONS'); // 'QUOTATIONS' | 'ORDERS' | 'SUBSCRIPTIONS' | 'INVOICES' | 'NEGOTIATIONS'

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customerDetail', id],
    queryFn: async () => {
      const res = await fetch(`${API}/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        // Fallback demo account
        return {
          id: id || 'cust-101',
          companyName: 'Acme Corporation Ltd',
          tier: 'ENTERPRISE',
          contactName: 'Vikram Mehta',
          email: 'vikram.mehta@acme.com',
          phone: '+91 98250 11223',
          address: 'Block B, Infocity Tech Park, Gandhinagar, Gujarat',
          totalRevenue: 345000,
          riskScore: 22,
          riskLevel: 'LOW',
          maxDiscountAllowed: '25%',
          approvalBypassThreshold: '15%'
        };
      }
      const json = await res.json();
      return json.data;
    }
  });

  const customer = customerData || {
    id: id || 'cust-101',
    companyName: 'Acme Corporation Ltd',
    tier: 'ENTERPRISE',
    contactName: 'Vikram Mehta',
    email: 'vikram.mehta@acme.com',
    phone: '+91 98250 11223',
    address: 'Block B, Infocity Tech Park, Gandhinagar, Gujarat',
    totalRevenue: 345000,
    riskScore: 22,
    riskLevel: 'LOW',
    maxDiscountAllowed: '25%',
    approvalBypassThreshold: '15%'
  };

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
                <h1 className="text-2xl font-bold text-slate-900">{customer.companyName}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {customer.tier} TIER
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {customer.address}
                </span>
              </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Lifetime Spend</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">₹{Number(customer.totalRevenue || 345000).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Discount Governance</span>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">{customer.maxDiscountAllowed || '25%'} Max Limit</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Auto-Approve Floor</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">&le; {customer.approvalBypassThreshold || '15%'} Disc</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Account Risk Score</span>
            <div className="mt-1">
              <RiskBadge score={customer.riskScore || 22} level={customer.riskLevel || 'LOW'} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'QUOTATIONS', label: 'Quotations (3)', icon: FileText },
          { id: 'ORDERS', label: 'Orders & Shipments (2)', icon: ShoppingBag },
          { id: 'SUBSCRIPTIONS', label: 'Active Subscriptions (1)', icon: RefreshCw },
          { id: 'INVOICES', label: 'Invoices & Payments (2)', icon: Receipt },
          { id: 'NEGOTIATIONS', label: 'Negotiation Logs', icon: MessageSquare }
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
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Margin</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">QT-1024</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹1,24,000</td>
                    <td className="py-3 px-4 text-rose-600 font-medium">18% (₹27,250)</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">24%</td>
                    <td className="py-3 px-4"><StatusBadge status="PENDING_APPROVAL" /></td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => navigate('/sales/quotations/qt-1024')} className="text-indigo-600 font-bold hover:underline">View Deal</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">QT-1018</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹85,000</td>
                    <td className="py-3 px-4 text-rose-600 font-medium">10% (₹9,444)</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">32%</td>
                    <td className="py-3 px-4"><StatusBadge status="CONFIRMED" /></td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => navigate('/sales/quotations/qt-1018')} className="text-indigo-600 font-bold hover:underline">View Deal</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Fulfillment Orders</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <strong className="text-slate-900 font-mono text-sm">ORD-1004</strong>
                <p className="text-slate-500 mt-0.5">Enterprise Rack Server Pro (100 units) · 3 Shipments Dispatched</p>
              </div>
              <button
                onClick={() => navigate('/sales/fulfillment/ORD-1004')}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg"
              >
                Track Fulfillment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'SUBSCRIPTIONS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Active Subscriptions</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <strong className="text-slate-900 font-mono text-sm">SUB-2026-01</strong>
                <p className="text-slate-500 mt-0.5">Cloud Infrastructure & Managed Security Suite (₹45,000/month)</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">ACTIVE</span>
            </div>
          </div>
        )}

        {activeTab === 'INVOICES' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Billing & Settlement Ledger</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">INV-2026-001</span> (₹1,24,000 One-Time Hardware)
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">PAID</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">INV-2026-002</span> (₹15,000 Recurring SLA)
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">PENDING</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'NEGOTIATIONS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Customer Counter-Proposals</h3>
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Requested 5% additional discount on Setup Service</span>
                <span className="text-slate-500 font-normal">2 days ago via Customer Portal</span>
              </div>
              <p className="text-amber-800">
                Proposed counter-discount increased line concession from 10% to 15%, triggering Sales Manager re-approval.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
