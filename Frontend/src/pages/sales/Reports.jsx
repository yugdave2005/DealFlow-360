import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Download, 
  Users, 
  Percent, 
  ShieldCheck, 
  DollarSign, 
  Package,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function Reports() {
  const [period, setPeriod] = useState('QUARTER'); // 'MONTH' | 'QUARTER' | 'YEAR'
  const [repFilter, setRepFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Analytics & Governance Reports</h1>
              <p className="text-sm text-slate-500 mt-0.5">Pipeline velocity, margin realization, discount compliance & win rates</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting Sales Executive Summary CSV')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="MONTH">This Month (Sep 2026)</option>
              <option value="QUARTER">Q3 2026 (Jul - Sep)</option>
              <option value="YEAR">Fiscal Year 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Sales Rep:</span>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Representatives</option>
              <option value="SAM">Samarth Thakkar</option>
              <option value="NEEL">Neel Vora</option>
              <option value="PRIYA">Priya Sharma</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Product Types</option>
              <option value="HARDWARE">Hardware Units</option>
              <option value="SERVICES">Services & SLA</option>
              <option value="SUBSCRIPTIONS">Cloud Subscriptions</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Bookings</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹48,50,000</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last period
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Win / Close Rate</span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">68.2%</p>
          <span className="text-xs text-slate-500 mt-1 block">34 of 50 quotes confirmed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Discount</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">11.4%</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">Within 15% tier budget</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blended Gross Margin</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">29.6%</p>
          <span className="text-xs text-slate-500 mt-1 block">Target: 25.0%</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Line Performance */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Product Line Contribution</h3>
          
          <div className="space-y-3">
            {[
              { name: 'Hardware & Workstations', value: 2840000, share: 58, margin: '24%' },
              { name: 'Cloud & SaaS Subscriptions', value: 1250000, share: 26, margin: '65%' },
              { name: 'Professional Services & Setup', value: 760000, share: 16, margin: '42%' },
            ].map((prod, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{prod.name}</span>
                  <span className="text-slate-900 font-mono">₹{prod.value.toLocaleString('en-IN')} ({prod.share}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${prod.share}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Gross Margin: <strong className="text-emerald-700 font-bold">{prod.margin}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance & Discount Compliance */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Discount & Approval Governance</h3>
          
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-emerald-800">Auto-Approved (Within Threshold)</span>
                <p className="text-xs text-emerald-700 mt-0.5">82% of quotations bypassed manual escalation</p>
              </div>
              <span className="text-lg font-bold text-emerald-900">41 Quotes</span>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-purple-800">Manager Authorization Required</span>
                <p className="text-xs text-purple-700 mt-0.5">14% required single-tier review</p>
              </div>
              <span className="text-lg font-bold text-purple-900">7 Quotes</span>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-rose-800">Finance Second-Level Escalation</span>
                <p className="text-xs text-rose-700 mt-0.5">4% exceeded extreme discount limit</p>
              </div>
              <span className="text-lg font-bold text-rose-900">2 Quotes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
