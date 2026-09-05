import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  Building2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Zap,
  Info 
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const APPROVER_META = {
  SALES_REP: {
    label: 'None (Self - Sales Rep)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: UserCheck,
    description: 'Instant dispatch without managerial sign-off'
  },
  SALES_MANAGER: {
    label: 'Sales Manager',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ShieldCheck,
    description: 'Team lead margin & discount review'
  },
  FINANCE: {
    label: 'Finance Controller',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Building2,
    description: 'Finance & legal payment terms audit'
  },
  ADMIN: {
    label: 'VP of Sales / Admin',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ShieldAlert,
    description: 'Executive authorization for critical exposure'
  }
};

export default function AdminApprovalRules() {
  const queryClient = useQueryClient();

  const { data: rawRules = [], isLoading } = useQuery({
    queryKey: ['adminApprovalRules'],
    queryFn: () => adminApi.getApprovalRules().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const rules = Array.isArray(rawRules) ? rawRules : (rawRules?.data || []);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      minRiskScore: 0,
      maxRiskScore: 25,
      requiredApproverLevel: 'SALES_REP'
    }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createApprovalRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApprovalRules'] });
      toast.success('Approval rule established');
      reset({
        minRiskScore: 0,
        maxRiskScore: 50,
        requiredApproverLevel: 'SALES_MANAGER'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to save approval rule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteApprovalRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApprovalRules'] });
      toast.success('Approval rule deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete rule');
    }
  });

  const onSubmit = (formData) => {
    const min = parseInt(formData.minRiskScore, 10);
    const max = parseInt(formData.maxRiskScore, 10);

    if (isNaN(min) || isNaN(max) || min < 0 || max > 100 || min >= max) {
      toast.error('Please enter a valid score range between 0 and 100 (Min < Max).');
      return;
    }

    createMutation.mutate({
      minRiskScore: min,
      maxRiskScore: max,
      requiredApproverLevel: formData.requiredApproverLevel,
      priority: 1
    });
  };

  const handleSeedDefaults = async () => {
    const defaults = [
      { minRiskScore: 0, maxRiskScore: 25, requiredApproverLevel: 'SALES_REP', priority: 1 },
      { minRiskScore: 26, maxRiskScore: 50, requiredApproverLevel: 'SALES_MANAGER', priority: 2 },
      { minRiskScore: 51, maxRiskScore: 75, requiredApproverLevel: 'FINANCE', priority: 3 },
      { minRiskScore: 76, maxRiskScore: 100, requiredApproverLevel: 'ADMIN', priority: 4 },
    ];

    try {
      for (const rule of defaults) {
        await adminApi.createApprovalRule(rule);
      }
      queryClient.invalidateQueries({ queryKey: ['adminApprovalRules'] });
      toast.success('Standard 4-Tier Matrix initialized!');
    } catch {
      toast.error('Failed to seed rules');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
      


      {/* 3. Streamlined Add Mapping Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Plus className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Risk Threshold Mapping</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* Min score */}
          <div className="flex items-center gap-2">
            <input
              {...register('minRiskScore')}
              type="number"
              min="0"
              max="99"
              placeholder="Min (0)"
              className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
            <span className="text-xs font-bold text-slate-400">to</span>
            <input
              {...register('maxRiskScore')}
              type="number"
              min="1"
              max="100"
              placeholder="Max (25)"
              className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <span className="hidden sm:inline text-slate-400 font-bold">→</span>

          {/* Approver Select */}
          <div className="flex-1 min-w-[200px]">
            <select
              {...register('requiredApproverLevel')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              required
            >
              <option value="SALES_REP">None (Self - Sales Representative)</option>
              <option value="SALES_MANAGER">Sales Manager / Team Lead</option>
              <option value="FINANCE">Finance Controller</option>
              <option value="ADMIN">VP of Sales / Platform Admin</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{createMutation.isPending ? 'Saving...' : 'Add Mapping'}</span>
          </button>
        </form>
      </div>

      {/* 4. Full Width Configured Rules Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Configured Risk Bands ({rules.length})
          </span>
          <span className="text-[11px] text-slate-500">Evaluated in real-time on every quote change</span>
        </div>

        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={4} /></div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No approval rules configured. Click "Restore Standard 4-Tier Matrix" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Risk Range</th>
                  <th className="py-3 px-4">Required Approver</th>
                  <th className="py-3 px-4">Policy Routing Rule</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => {
                  const meta = APPROVER_META[rule.requiredApproverLevel] || APPROVER_META.SALES_MANAGER;
                  const Icon = meta.icon;

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                          {rule.minRiskScore} – {rule.maxRiskScore} pts
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${meta.badge}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {meta.description}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete rule for range ${rule.minRiskScore} - ${rule.maxRiskScore}?`)) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
