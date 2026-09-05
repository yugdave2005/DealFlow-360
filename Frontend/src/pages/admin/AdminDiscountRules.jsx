import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountsApi } from '../../features/discounts/discounts.api';
import { pricingApi } from '../../features/pricing/pricing.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Percent, 
  Plus, 
  Layers, 
  Building, 
  ShieldCheck, 
  Trash2, 
  Sliders, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Tag 
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function AdminDiscountRules() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rawRules = [], isLoading: isRulesLoading } = useQuery({
    queryKey: ['adminDiscountRules'],
    queryFn: () => discountsApi.getDiscountRules().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const { data: rawCustomerTiers = [], isLoading: isTiersLoading } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => pricingApi.getCustomerTiers().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const rules = Array.isArray(rawRules) ? rawRules : (rawRules?.data || []);
  const customerTiers = Array.isArray(rawCustomerTiers) ? rawCustomerTiers : (rawCustomerTiers?.data || []);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { 
      appliedTo: 'CATEGORY',
      productCategory: 'Hardware',
      targetTierId: '',
      maxDiscountPercentage: 15
    }
  });

  const appliedToValue = watch('appliedTo');
  const maxDiscountValue = watch('maxDiscountPercentage');

  const createMutation = useMutation({
    mutationFn: discountsApi.createDiscountRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscountRules'] });
      toast.success('Discount ceiling rule created successfully');
      reset({
        appliedTo: 'CATEGORY',
        productCategory: 'Hardware',
        targetTierId: customerTiers[0]?.id || '',
        maxDiscountPercentage: 15
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create discount rule')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => discountsApi.deleteDiscountRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscountRules'] });
      toast.success('Discount rule removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to remove discount rule')
  });

  const onSubmit = (data) => {
    let targetTierId = null;
    if (data.appliedTo === 'TIER') {
      targetTierId = data.targetTierId || customerTiers[0]?.id;
    }

    createMutation.mutate({
      appliedTo: data.appliedTo,
      targetTierId: targetTierId,
      productCategory: data.appliedTo === 'CATEGORY' ? data.productCategory : null,
      maxDiscountPercentage: parseFloat(data.maxDiscountPercentage) || 0
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this discount ceiling rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const isLoading = isRulesLoading || isTiersLoading;

  // KPIs
  const totalRules = rules.length;
  const tierRulesCount = rules.filter(r => r.appliedTo === 'TIER').length;
  const categoryRulesCount = rules.filter(r => r.appliedTo === 'CATEGORY').length;
  const maxCeiling = rules.length > 0 ? Math.max(...rules.map(r => Number(r.maxDiscountPercentage) || 0)) : 15;

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const target = (r.appliedTo === 'CATEGORY' ? r.productCategory : r.targetTier?.name) || '';
      return target.toLowerCase().includes(searchTerm.toLowerCase()) || r.appliedTo.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rules, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discount Ceilings Configuration</h1>
            <p className="text-sm text-slate-500 mt-0.5">Define automated governance caps by Customer Tier and Product Category to protect profit margins.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Ceilings</span>
            <Sliders className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalRules}</p>
          <span className="text-xs text-slate-400 mt-1 block">Configured policy rules</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tier-Based Rules</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{tierRulesCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Customer tier limits</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Category Rules</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{categoryRulesCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Hardware/Services limits</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Max Allowed Cap</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{maxCeiling}%</p>
          <span className="text-xs text-slate-400 mt-1 block">Highest ceiling in matrix</span>
        </div>
      </div>

      {/* Add New Rule Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Add Discount Ceiling Rule</h2>
          </div>
          <span className="text-xs text-slate-400">Rules apply automatically to quote risk scoring</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Applied To Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Rule Target Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('appliedTo', 'CATEGORY')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    appliedToValue === 'CATEGORY'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  By Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('appliedTo', 'TIER');
                    if (customerTiers.length > 0 && !watch('targetTierId')) {
                      setValue('targetTierId', customerTiers[0].id);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    appliedToValue === 'TIER'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  By Customer Tier
                </button>
              </div>
            </div>

            {/* Target Name Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {appliedToValue === 'CATEGORY' ? 'Product Category' : 'Customer Pricing Tier'}
              </label>
              {appliedToValue === 'CATEGORY' ? (
                <select 
                  {...register('productCategory')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
                >
                  <option value="Hardware">Hardware & Devices</option>
                  <option value="Services">Professional Services</option>
                  <option value="Subscriptions">Software & Subscriptions</option>
                  <option value="Cloud">Cloud & Infrastructure</option>
                  <option value="Peripherals">Peripherals & Accessories</option>
                </select>
              ) : (
                <select 
                  {...register('targetTierId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
                >
                  {customerTiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Max Discount % */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Max Discount Ceiling (%)</label>
                <span className="text-xs font-bold text-indigo-700 font-mono">{maxDiscountValue || 0}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={Number(maxDiscountValue) || 0}
                  onChange={(e) => setValue('maxDiscountPercentage', Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                  className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={maxDiscountValue ?? 15}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                    setValue('maxDiscountPercentage', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
                {[5, 10, 15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setValue('maxDiscountPercentage', pct, { shouldValidate: true, shouldDirty: true })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      Number(maxDiscountValue) === pct
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Saving...' : 'Save Discount Rule'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wider border border-indigo-200 uppercase">
              Discount Ceilings Ledger
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Discounts exceeding these thresholds automatically trigger Manager / Finance approval</span>
        </div>

        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={4} /></div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No discount rules found. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Applied Type</th>
                  <th className="py-3.5 px-4">Target (Tier / Category)</th>
                  <th className="py-3.5 px-4">Max Discount Ceiling</th>
                  <th className="py-3.5 px-4">Risk Governance Effect</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((r) => {
                  const targetName = r.appliedTo === 'CATEGORY' ? r.productCategory : (r.targetTier?.name || 'Customer Tier');
                  const maxDisc = Number(r.maxDiscountPercentage) || 0;

                  return (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                          r.appliedTo === 'CATEGORY' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {r.appliedTo === 'CATEGORY' ? <Layers className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
                          {r.appliedTo === 'CATEGORY' ? 'Category Cap' : 'Customer Tier'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                        {targetName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-indigo-700 text-sm font-mono">
                            {maxDisc}%
                          </span>
                          <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${Math.min(100, (maxDisc / 50) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        Discounts &gt; {maxDisc}% flag deal risk & require approval
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
