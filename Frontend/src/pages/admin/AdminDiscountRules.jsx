import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Percent, 
  Plus, 
  Building2, 
  Trash2, 
  Sliders, 
  Tag,
  Search,
  X
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

export default function AdminDiscountRules() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rawRules = [], isLoading: isRulesLoading } = useQuery({
    queryKey: ['adminDiscountRules'],
    queryFn: () => adminApi.getDiscountRules().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const { data: rawCustomerTiers = [], isLoading: isTiersLoading } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => adminApi.getCustomerTiers().then(res => res.data?.data || res.data || []).catch(() => [])
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
    mutationFn: adminApi.createDiscountRule,
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
    mutationFn: (id) => adminApi.deleteDiscountRule(id),
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

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const target = (r.appliedTo === 'CATEGORY' ? r.productCategory : r.targetTier?.name) || '';
      return target.toLowerCase().includes(searchTerm.toLowerCase()) || r.appliedTo.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rules, searchTerm]);

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto space-y-7 pb-28">
      {/* 1. Page Header (Flat Canvas) */}
      <div className="border-b border-[#EEEAE4] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-[34px] sm:text-[40px] font-semibold text-[#171717] tracking-tight leading-tight">
              Discount Tiers & Ceilings
            </h1>
            <p className="text-[15px] sm:text-[16px] text-[#6F6B66] mt-1.5 font-normal">
              Configure maximum allowable commercial discount ceilings before manager or finance sign-off is required.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Add New Rule Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[14px] border border-[#E6E1D9] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#171717]">Add Discount Ceiling Rule</h2>
          </div>
          <span className="text-[13px] text-[#96918A]">Rules apply automatically to quotation risk scoring</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Applied To Selection */}
            <div>
              <label className="block text-[13px] font-semibold text-[#171717] mb-2">Rule Target Type</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValue('appliedTo', 'CATEGORY')}
                  className={`h-11 px-4 rounded-[10px] text-[13px] sm:text-[14px] font-semibold transition-all cursor-pointer ${
                    appliedToValue === 'CATEGORY'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'bg-white text-[#6F6B66] border border-[#E6E1D9] hover:bg-[#F2EFEA]'
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
                  className={`h-11 px-4 rounded-[10px] text-[13px] sm:text-[14px] font-semibold transition-all cursor-pointer ${
                    appliedToValue === 'TIER'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'bg-white text-[#6F6B66] border border-[#E6E1D9] hover:bg-[#F2EFEA]'
                  }`}
                >
                  By Customer Tier
                </button>
              </div>
            </div>

            {/* Target Name Dropdown */}
            <div>
              <label className="block text-[13px] font-semibold text-[#171717] mb-2">
                {appliedToValue === 'CATEGORY' ? 'Product Category' : 'Customer Pricing Tier'}
              </label>
              {appliedToValue === 'CATEGORY' ? (
                <select 
                  {...register('productCategory')}
                  className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer"
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
                  className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer"
                >
                  {customerTiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Max Discount % */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-semibold text-[#171717]">Max Discount Ceiling (%)</label>
                <span className="text-[15px] font-bold text-[#D97757] font-mono">{maxDiscountValue || 0}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={Number(maxDiscountValue) || 0}
                  onChange={(e) => setValue('maxDiscountPercentage', Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                  className="flex-1 accent-[#D97757] cursor-pointer h-2 bg-[#EEEAE4] rounded-lg"
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
                  className="w-20 h-11 px-3 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-bold text-[#171717] text-center focus:outline-none focus:border-[#D97757] font-mono"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="text-[12px] text-[#96918A] font-medium mr-1">Presets:</span>
                {[5, 10, 15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setValue('maxDiscountPercentage', pct, { shouldValidate: true, shouldDirty: true })}
                    className={`px-3 py-1 rounded-[7px] text-[12px] font-semibold transition cursor-pointer ${
                      Number(maxDiscountValue) === pct
                        ? 'bg-[#D97757] text-white shadow-2xs'
                        : 'bg-[#F5F2ED] text-[#6F6B66] hover:bg-[#EDE8E0]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#EEEAE4]">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-[14px] font-semibold rounded-[10px] shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Saving...' : 'Save Discount Rule'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Discount Ceilings Ledger Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E6E1D9] bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-semibold text-[#171717] uppercase tracking-wider">
              Discount Ceilings Ledger
            </span>
            <span className="text-[13px] text-[#96918A]">({filteredRules.length} active rules)</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-3 text-[13px] bg-white border border-[#E6E1D9] rounded-[9px] focus:outline-none focus:border-[#D97757] text-[#171717] placeholder:text-[#96918A]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8"><LoadingSkeleton rows={4} /></div>
        ) : filteredRules.length === 0 ? (
          <div className="p-14">
            <EmptyState 
              icon={Sliders} 
              title="No discount rules configured" 
              description="Create category or customer tier discount ceilings above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-4 px-6">Applied Type</th>
                  <th className="py-4 px-5">Target (Tier / Category)</th>
                  <th className="py-4 px-5">Max Discount Ceiling</th>
                  <th className="py-4 px-5">Risk Governance Effect</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4]">
                {filteredRules.map((r) => {
                  const isTier = r.appliedTo === 'TIER';
                  const targetName = isTier ? (r.targetTier?.name || 'Customer Tier') : (r.productCategory || 'Hardware');
                  const ceiling = Number(r.maxDiscountPercentage) || 0;

                  return (
                    <tr key={r.id} className="hover:bg-[#FBFAF8] transition-colors h-[70px]">
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${
                          isTier 
                            ? 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]' 
                            : 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]'
                        }`}>
                          {isTier ? <Building2 className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                          <span>{isTier ? 'Customer Tier' : 'Category Cap'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 font-semibold text-[#171717] text-[15px]">
                        {targetName}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[#D97757] font-mono text-[14px] sm:text-[15px]">{ceiling}%</span>
                          <div className="w-24 bg-[#EEEAE4] h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#D97757] h-full rounded-full" 
                              style={{ width: `${Math.min(100, ceiling * 2.5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-[#6F6B66] text-[13px] sm:text-[14px]">
                        Discounts &gt; {ceiling}% flag deal risk & require authorization
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-[#96918A] hover:text-[#C95757] hover:bg-[#FBEAEA] rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete Rule"
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
