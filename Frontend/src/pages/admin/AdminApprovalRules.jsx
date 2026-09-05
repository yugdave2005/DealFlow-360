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
  Trash2
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

const APPROVER_META = {
  SALES_REP: {
    label: 'None (Self - Sales Rep)',
    badge: 'bg-[#EAF5EE] text-[#3F8F63] border-[#C2E2CE]',
    icon: UserCheck,
    description: 'Instant dispatch without managerial sign-off'
  },
  SALES_MANAGER: {
    label: 'Sales Manager',
    badge: 'bg-[#FBF2E3] text-[#C98A32] border-[#F3DFC1]',
    icon: ShieldCheck,
    description: 'Team lead margin & discount review'
  },
  FINANCE: {
    label: 'Finance Controller',
    badge: 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]',
    icon: Building2,
    description: 'Finance & legal payment terms audit'
  },
  ADMIN: {
    label: 'VP of Sales / Admin',
    badge: 'bg-[#FBEAEA] text-[#C95757] border-[#F5D5D5]',
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
      requiredApproverLevel: formData.requiredApproverLevel
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this approval rule?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto space-y-7 pb-28">
      {/* 1. Page Header (Flat Canvas) */}
      <div className="border-b border-[#EEEAE4] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-[34px] sm:text-[40px] font-semibold text-[#171717] tracking-tight leading-tight">
              Approval Rules & Governance
            </h1>
            <p className="text-[15px] sm:text-[16px] text-[#6F6B66] mt-1.5 font-normal">
              Configure risk scoring thresholds to automatically assign required authorization levels for deal proposals.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Add Risk Threshold Mapping Form */}
      <div className="bg-white p-6 sm:p-7 rounded-[14px] border border-[#E6E1D9] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#171717]">Add Risk Threshold Mapping</h2>
          </div>
          <span className="text-[13px] text-[#96918A]">Evaluated dynamically on every quotation change</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pt-1">
          <div className="flex items-center gap-3 flex-1">
            <input 
              type="number" 
              min="0" 
              max="100" 
              placeholder="0" 
              {...register('minRiskScore', { required: true })} 
              className="w-24 h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-semibold text-center text-[#171717] focus:outline-none focus:border-[#D97757] font-mono"
            />
            <span className="text-[13px] font-semibold text-[#6F6B66]">to</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              placeholder="50" 
              {...register('maxRiskScore', { required: true })} 
              className="w-24 h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-semibold text-center text-[#171717] focus:outline-none focus:border-[#D97757] font-mono"
            />
            <span className="text-[14px] font-semibold text-[#6F6B66] mx-1">→</span>
            
            <select 
              {...register('requiredApproverLevel')}
              className="flex-1 h-11 px-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] cursor-pointer"
            >
              <option value="SALES_REP">None (Self - Sales Representative)</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="FINANCE">Finance Controller</option>
              <option value="ADMIN">VP of Sales / Platform Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-11 px-5 bg-[#D97757] hover:bg-[#C96648] text-white text-[14px] font-semibold rounded-[10px] shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{createMutation.isPending ? 'Saving...' : 'Add Mapping'}</span>
          </button>
        </form>
      </div>

      {/* 3. Configured Risk Bands Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-semibold text-[#171717] uppercase tracking-wider">
              Configured Risk Bands ({rules.length})
            </span>
          </div>
          <span className="text-[13px] text-[#96918A]">Evaluated in real-time on every quote change</span>
        </div>

        {isLoading ? (
          <div className="p-8"><LoadingSkeleton rows={4} /></div>
        ) : rules.length === 0 ? (
          <div className="p-14">
            <EmptyState 
              icon={ShieldCheck} 
              title="No approval rules configured" 
              description="Add risk score bands above to automate manager & finance approvals."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-4 px-6">Risk Range</th>
                  <th className="py-4 px-5">Required Approver</th>
                  <th className="py-4 px-5">Policy Routing Rule</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4]">
                {rules.map((rule) => {
                  const meta = APPROVER_META[rule.requiredApproverLevel] || APPROVER_META.SALES_REP;
                  const Icon = meta.icon;

                  return (
                    <tr key={rule.id} className="hover:bg-[#FBFAF8] transition-colors h-[70px]">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-[8px] font-mono text-[13px] font-semibold bg-[#FAF9F6] border border-[#E6E1D9] text-[#171717]">
                          {rule.minRiskScore} – {rule.maxRiskScore} pts
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border ${meta.badge}`}>
                          <Icon className="w-4 h-4" />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-[#6F6B66] text-[14px]">
                        {meta.description}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
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
