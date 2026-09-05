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
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';

const API_FULFILLMENT = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/fulfillment`;
const API_INVOICES = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/invoices`;
const API_APPROVALS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/approvals`;
const getToken = () => localStorage.getItem('accessToken');

export default function OperationsDashboard() {
  const navigate = useNavigate();

  const { data: fulfillmentPlans = [] } = useQuery({
    queryKey: ['opsFulfillment'],
    queryFn: async () => {
      const res = await fetch(API_FULFILLMENT, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: invoices = [] } = useQuery({
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

  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID');
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
          <p className="text-xl font-extrabold text-purple-700 mt-1">{approvals.length || 1}</p>
          <span className="text-xs text-purple-600 font-semibold mt-0.5 block">High discount review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fulfillmentPlans.length || 2}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Awaiting dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backorders</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">1</p>
          <span className="text-xs text-amber-600 font-semibold mt-0.5 block">Depot shortage</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding AR</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">₹{(totalOutstandingAR || 100000).toLocaleString('en-IN')}</p>
          <span className="text-xs text-rose-600 font-semibold mt-0.5 block">Unsettled invoices</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">3</p>
          <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">₹1.8L /mo MRR</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing Alerts</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">1</p>
          <span className="text-xs text-rose-600 font-semibold mt-0.5 block">Overdue &gt; 15d</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/sales/approvals')}
            className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 hover:bg-purple-50 transition-colors cursor-pointer space-y-2"
          >
            <span className="text-xs font-bold text-purple-900 uppercase">High-Risk Finance Approvals</span>
            <p className="text-xs text-purple-800">
              <strong>1 Quotation</strong> has exceeded 20% max margin discount threshold requiring finance authorization.
            </p>
            <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
              <span>Review finance approval &rarr;</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/fulfillment/ORD-1004')}
            className="p-4 bg-cyan-50/50 rounded-xl border border-cyan-200/80 hover:bg-cyan-50 transition-colors cursor-pointer space-y-2"
          >
            <span className="text-xs font-bold text-cyan-900 uppercase">Warehouse Split Plan</span>
            <p className="text-xs text-cyan-800">
              <strong>ORD-1004 (100 units)</strong> optimal 3-hub dispatch ready for logistics acceptance.
            </p>
            <div className="text-xs font-bold text-cyan-700 flex items-center gap-1 pt-1">
              <span>Dispatch allocation &rarr;</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/invoices')}
            className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 hover:bg-rose-50 transition-colors cursor-pointer space-y-2"
          >
            <span className="text-xs font-bold text-rose-900 uppercase">Overdue Receivables</span>
            <p className="text-xs text-rose-800">
              <strong>INV-2026-003 (₹85,000)</strong> past due date for Gujarat Infotech Solutions.
            </p>
            <div className="text-xs font-bold text-rose-700 flex items-center gap-1 pt-1">
              <span>Record payment &rarr;</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/sales/subscriptions')}
            className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 hover:bg-emerald-50 transition-colors cursor-pointer space-y-2"
          >
            <span className="text-xs font-bold text-emerald-900 uppercase">Subscription Cycle Proration</span>
            <p className="text-xs text-emerald-800">
              <strong>SUB-2026-01</strong> renewal billing scheduled for Oct 1, 2026.
            </p>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
              <span>View schedules &rarr;</span>
            </div>
          </div>
        </div>
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

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">ORD-1004</span> · Acme Corp (100 units)
                <div className="text-slate-500 mt-0.5">3 Hubs (Ahmedabad, Anand, Gandhinagar) · Est. ₹2,450</div>
              </div>
              <button 
                onClick={() => navigate('/sales/fulfillment/ORD-1004')}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-xs"
              >
                Split Plan
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">ORD-1005</span> · Gujarat Infotech (40 units)
                <div className="text-amber-800 font-medium mt-0.5">35 In Stock · 5 Units Backordered</div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full">
                BACKORDER
              </span>
            </div>
          </div>
        </div>

        {/* Unpaid / Pending Invoices Ledger */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Unsettled Invoices (AR)</h3>
            <button onClick={() => navigate('/sales/invoices')} className="text-xs font-bold text-emerald-700 hover:underline">
              View Invoices
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">INV-2026-002</span> · Acme Corp
                <div className="text-slate-500 mt-0.5">Recurring SLA · Due Oct 10, 2026</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 text-sm">₹15,000</span>
                <span className="block text-amber-600 font-medium">Pending</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">INV-2026-003</span> · Gujarat Infotech
                <div className="text-rose-800 mt-0.5">One-Time Hardware · Due Sep 15, 2026</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-rose-700 text-sm">₹85,000</span>
                <span className="block text-rose-700 font-bold">OVERDUE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
