import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Receipt, 
  RefreshCw, 
  AlertTriangle, 
  Boxes, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShieldAlert,
  Inbox
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_FULFILLMENT = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/fulfillment`;
const API_INVOICES = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/invoices`;
const API_APPROVALS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/approvals`;
const API_SUBSCRIPTIONS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/subscriptions`;
const getToken = () => localStorage.getItem('accessToken');

export default function OperationsDashboard() {
  const navigate = useNavigate();

  const { data: fulfillmentPlans = [], isLoading: loadingFulfillment } = useQuery({
    queryKey: ['opsFulfillment'],
    queryFn: async () => {
      const res = await fetch(API_FULFILLMENT, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['opsInvoices'],
    queryFn: async () => {
      const res = await fetch(API_INVOICES, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['opsApprovals'],
    queryFn: async () => {
      const res = await fetch(`${API_APPROVALS}/pending`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['opsSubscriptions'],
    queryFn: async () => {
      const res = await fetch(API_SUBSCRIPTIONS, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID');
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
  const totalOutstandingAR = unpaidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Overview</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Finance / Operations
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Multi-hub warehouse allocations, 2nd-level authorizations & billing reconciliations</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales/fulfillment')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Split Queue</span>
          </button>
        </div>
      </div>

      {/* 6 Operations KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier-2 Approvals</span>
          <p className="text-xl font-extrabold text-purple-700 mt-1">{approvals.length}</p>
          <span className="text-xs text-purple-600 font-semibold mt-0.5 block">High discount review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fulfillmentPlans.length}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Awaiting dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoices</span>
          <p className="text-xl font-extrabold text-indigo-700 mt-1">{invoices.length}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Generated bills</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding AR</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">â‚¹{totalOutstandingAR.toLocaleString('en-IN')}</p>
          <span className="text-xs text-rose-600 font-semibold mt-0.5 block">{unpaidInvoices.length} unpaid</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscriptions</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{subscriptions.length}</p>
          <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">Active recurring</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing Alerts</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{overdueInvoices.length}</p>
          <span className="text-xs text-rose-600 font-semibold mt-0.5 block">Overdue invoices</span>
        </div>
      </div>

      {/* Operations Attention Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Operations Attention Required</h3>
          </div>
        </div>

        {approvals.length === 0 && overdueInvoices.length === 0 && fulfillmentPlans.length === 0 ? (
          <div className="py-6 text-center bg-slate-50 rounded-xl border border-slate-100">
            <Inbox className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-500">No pending operational alerts or escalations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvals.length > 0 && (
              <div 
                onClick={() => navigate('/sales/approvals')}
                className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 hover:bg-purple-50 transition-colors cursor-pointer space-y-2"
              >
                <span className="text-xs font-bold text-purple-900 uppercase">High-Risk Finance Approvals</span>
                <p className="text-xs text-purple-800">
                  <strong>{approvals.length} Quotation(s)</strong> require finance escalation authorization.
                </p>
                <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                  <span>Review finance approval &rarr;</span>
                </div>
              </div>
            )}

            {overdueInvoices.length > 0 && (
              <div 
                onClick={() => navigate('/sales/invoices')}
                className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 hover:bg-rose-50 transition-colors cursor-pointer space-y-2"
              >
                <span className="text-xs font-bold text-rose-900 uppercase">Overdue Receivables</span>
                <p className="text-xs text-rose-800">
                  <strong>{overdueInvoices.length} invoice(s)</strong> have passed their payment due date.
                </p>
                <div className="text-xs font-bold text-rose-700 flex items-center gap-1 pt-1">
                  <span>Record payment &rarr;</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Operational Dispatch & Invoicing Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fulfillment Orders Queue */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Fulfillment Orders</h3>
            <button onClick={() => navigate('/sales/fulfillment')} className="text-xs font-bold text-emerald-700 hover:underline">
              View All
            </button>
          </div>

          {loadingFulfillment ? (
            <LoadingSkeleton count={2} />
          ) : fulfillmentPlans.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <Boxes className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No fulfillment orders queued</p>
              <p className="text-xs text-slate-400 mt-0.5">When orders are confirmed, warehouse allocations appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {fulfillmentPlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{plan.orderNumber || plan.id}</span>
                    <div className="text-slate-500 mt-0.5">Status: {plan.status}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/sales/fulfillment/${plan.id}`)}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-xs"
                  >
                    View Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid / Pending Invoices Ledger */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Unsettled Invoices (AR)</h3>
            <button onClick={() => navigate('/sales/invoices')} className="text-xs font-bold text-emerald-700 hover:underline">
              View Invoices
            </button>
          </div>

          {loadingInvoices ? (
            <LoadingSkeleton count={2} />
          ) : unpaidInvoices.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <Receipt className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">All invoices settled</p>
              <p className="text-xs text-slate-400 mt-0.5">No outstanding receivables pending payment.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {unpaidInvoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber || inv.id}</span>
                    <div className="text-slate-500 mt-0.5">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">â‚¹{Number(inv.amount || 0).toLocaleString('en-IN')}</span>
                    <span className="block text-amber-600 font-medium">{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}