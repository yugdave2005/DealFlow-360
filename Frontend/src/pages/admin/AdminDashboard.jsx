import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  FileText, 
  TrendingUp, 
  Boxes, 
  Layers, 
  Sliders, 
  History, 
  Package
} from 'lucide-react';
import { productsApi } from '../../features/products/products.api';
import { pricingApi } from '../../features/pricing/pricing.api';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { api } from '../../lib/axios';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({
    queryKey: ['adminProductsList'],
    queryFn: () => productsApi.getProducts().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: customerTiers = [] } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => pricingApi.getCustomerTiers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['adminQuotations'],
    queryFn: async () => {
      try {
        const res = await quotationsApi.getQuotations();
        return res.data?.data || [];
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Failed to fetch admin quotations:', error);
        }
        return [];
      }
    }
  });

  const totalPipeline = quotations.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
  }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Administration</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Global Administrator
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Platform governance, discount matrix configurations, warehouse hubs & system audit logs</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Platform Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Products</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Configured in Master Catalog</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Tiers</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{customerTiers.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Active Pricing Tiers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Quotations</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{quotations.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">System-wide proposals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Pipeline</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹{totalPipeline.toLocaleString('en-IN')}</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">Live opportunity value</span>
        </div>
      </div>

      {/* Global Configuration Grid */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Platform Engine Configurations</h3>
        <p className="text-xs text-slate-500">Configure global business logic parameters utilized by pricing, discount, and approval engines.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div 
            onClick={() => navigate('/admin/products')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Product Catalog & Pricing</h4>
            <p className="text-xs text-slate-500">Manage hardware, recurring subscriptions, and professional services with tiered pricing.</p>
          </div>

          <div 
            onClick={() => navigate('/admin/discount-rules')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Customer Tier Discount Rules</h4>
            <p className="text-xs text-slate-500">Configure maximum discount ceilings and auto-approval floors per customer tier.</p>
          </div>

          <div 
            onClick={() => navigate('/admin/approval-rules')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Approval Chains & Governance</h4>
            <p className="text-xs text-slate-500">Set multi-tier governance escalation triggers for Sales Manager and Finance authorizations.</p>
          </div>

          <div 
            onClick={() => navigate('/sales/fulfillment')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Warehouse Depots & Routing</h4>
            <p className="text-xs text-slate-500">Configure multi-hub inventory hubs (Ahmedabad, Anand, Gandhinagar) and freight costs.</p>
          </div>

          <div 
            onClick={() => navigate('/sales/subscriptions')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Subscription Billing Plans</h4>
            <p className="text-xs text-slate-500">Configure recurring billing cycles, monthly/yearly proration models, and SLA tiers.</p>
          </div>

          <div 
            onClick={() => navigate('/sales/reports')}
            className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-purple-200 transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Audit Trails & Analytics</h4>
            <p className="text-xs text-slate-500">Review system activity logs, version historical changes, and executive sales analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
