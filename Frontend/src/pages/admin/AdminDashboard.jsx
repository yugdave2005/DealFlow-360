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
import { adminApi } from '../../features/admin/admin.api';
import { api } from '../../lib/axios';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({
    queryKey: ['adminProductsList'],
    queryFn: () => adminApi.getProducts().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: customerTiers = [] } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => adminApi.getCustomerTiers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['adminQuotations'],
    queryFn: async () => {
      try {
        const res = await api.get('/quotations');
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

  const configCards = [
    {
      route: '/admin/products',
      icon: Package,
      iconColor: 'text-[#D97757]',
      title: 'Product Catalog & Pricing',
      desc: 'Manage hardware, recurring subscriptions, and professional services with tiered pricing.'
    },
    {
      route: '/admin/discount-rules',
      icon: Sliders,
      iconColor: 'text-[#8B6CC7]',
      title: 'Customer Tier Discount Rules',
      desc: 'Configure maximum discount ceilings and auto-approval floors per customer tier.'
    },
    {
      route: '/admin/approval-rules',
      icon: ShieldCheck,
      iconColor: 'text-[#3F8F63]',
      title: 'Approval Chains & Governance',
      desc: 'Set multi-tier governance escalation triggers for Sales Manager and Finance authorizations.'
    },
    {
      route: '/admin/warehouses',
      icon: Boxes,
      iconColor: 'text-[#4A90D9]',
      title: 'Warehouse Depots & Routing',
      desc: 'Configure multi-hub inventory hubs (Ahmedabad, Anand, Gandhinagar) and freight costs.'
    },
    {
      route: '/sales/subscriptions',
      icon: Layers,
      iconColor: 'text-[#5B8FD9]',
      title: 'Subscription Billing Plans',
      desc: 'Configure recurring billing cycles, monthly/yearly proration models, and SLA tiers.'
    },
    {
      route: '/sales/reports',
      icon: History,
      iconColor: 'text-[#D9A654]',
      title: 'Audit Trails & Analytics',
      desc: 'Review system activity logs, version historical changes, and executive sales analytics.'
    }
  ];

  return (
    <div className="w-full px-6 sm:px-8 pt-0 pb-8 space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
              Platform Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
              Global Administrator
            </span>
          </div>
          <p className="text-sm sm:text-[14.5px] text-[#6F6B66] mt-1">
            Platform governance, discount matrix configurations, warehouse hubs & system audit logs
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Catalog Products</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#D97757]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">{products.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">Configured in Master Catalog</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Customer Tiers</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#4A90D9]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">{customerTiers.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">Active Pricing Tiers</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Total Quotations</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#8B6CC7]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">{quotations.length}</h2>
          <p className="text-[#96918A] text-xs mt-2">System-wide proposals</p>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#E6E1D9] shadow-xs hover:border-[#D8D1C8] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#96918A] uppercase tracking-wider">Platform Pipeline</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#3F8F63]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#171717] mt-2">₹{totalPipeline.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-[#3F8F63] font-semibold mt-2">Live opportunity value</p>
        </div>
      </div>

      {/* Config Grid */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#171717]">Platform Engine Configurations</h3>
          <p className="text-xs text-[#96918A] mt-0.5">Configure global business logic parameters utilized by pricing, discount, and approval engines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {configCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.route}
                onClick={() => navigate(card.route)}
                className="p-5 bg-[#FAF9F6] rounded-[12px] border border-[#E6E1D9] hover:bg-[#F5F2ED] hover:border-[#D8D1C8] transition-all cursor-pointer space-y-2 group"
              >
                <div className={`w-10 h-10 rounded-[10px] bg-white border border-[#E6E1D9] flex items-center justify-center ${card.iconColor} shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-[#171717] text-sm group-hover:text-[#D97757] transition-colors">{card.title}</h4>
                <p className="text-xs text-[#96918A] leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
