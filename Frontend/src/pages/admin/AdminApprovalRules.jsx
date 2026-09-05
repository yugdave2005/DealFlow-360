import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function AdminApprovalRules() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['adminApprovalRules'],
    queryFn: () => adminApi.getApprovalRules().then(res => res.data)
  });

  const { register, handleSubmit, reset } = useForm();
  
  const createMutation = useMutation({
    mutationFn: adminApi.createApprovalRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApprovalRules'] });
      toast.success('Approval Rule created');
      reset();
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      minRiskScore: parseInt(data.minRiskScore, 10),
      maxRiskScore: parseInt(data.maxRiskScore, 10),
      requiredApproverLevel: data.requiredApproverLevel
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Approval Chain Configuration</h1>
      
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Risk Threshold mapping</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="gap-4 flex items-center">
          <input {...register('minRiskScore')} type="number" placeholder="Min Score (e.g. 0)" className="border p-2 rounded w-32" required />
          <span>to</span>
          <input {...register('maxRiskScore')} type="number" placeholder="Max Score (e.g. 50)" className="border p-2 rounded w-32" required />
          <span>→</span>
          <select {...register('requiredApproverLevel')} className="border p-2 rounded w-48" required>
            <option value="SALES_REP">None (Self)</option>
            <option value="SALES_MANAGER">Sales Manager</option>
            <option value="FINANCE">Finance</option>
          </select>
          
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-auto">
            {createMutation.isPending ? 'Saving...' : 'Add Mapping'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow text-left">
        <table className="w-full">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-3">Risk Range</th>
              <th className="p-3">Required Approver</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td className="p-4">Loading...</td></tr> : null}
            {rules.map(r => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="p-3">{r.minRiskScore} - {r.maxRiskScore}</td>
                <td className="p-3 font-semibold">{r.requiredApproverLevel}</td>
              </tr>
            ))}
            {!isLoading && rules.length === 0 && (
              <tr><td colSpan="2" className="p-4 text-center text-slate-500">No approval rules found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
