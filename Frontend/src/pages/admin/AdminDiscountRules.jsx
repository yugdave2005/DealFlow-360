import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function AdminDiscountRules() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['adminDiscountRules'],
    queryFn: () => adminApi.getDiscountRules().then(res => res.data)
  });

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { appliedTo: 'CATEGORY' }
  });
  const appliedToValue = watch('appliedTo');
  
  const createMutation = useMutation({
    mutationFn: adminApi.createDiscountRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscountRules'] });
      toast.success('Discount Rule created');
      reset();
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      targetTierId: data.appliedTo === 'TIER' ? data.targetTierId || null : null,
      productCategory: data.appliedTo === 'CATEGORY' ? data.productCategory || null : null,
      maxDiscountPercentage: parseFloat(data.maxDiscountPercentage) || 0
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Discount Ceilings Configuration</h1>
      
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Discount Rule</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="gap-4 flex flex-col max-w-md">
          <select {...register('appliedTo')} className="border p-2 rounded w-full">
            <option value="CATEGORY">By Product Category</option>
            <option value="TIER">By Customer Tier</option>
          </select>
          
          {appliedToValue === 'CATEGORY' && (
            <input {...register('productCategory')} placeholder="Category Name (e.g. Hardware)" className="border p-2 rounded" />
          )}

          <input {...register('maxDiscountPercentage')} type="number" step="0.1" placeholder="Max Discount % (e.g. 15)" className="border p-2 rounded" required />
          
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {createMutation.isPending ? 'Saving...' : 'Save Rule'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow text-left">
        <table className="w-full">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-3">Applied To</th>
              <th className="p-3">Target</th>
              <th className="p-3">Max Discount %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td className="p-4">Loading...</td></tr> : null}
            {rules.map(r => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="p-3">{r.appliedTo}</td>
                <td className="p-3">{r.appliedTo === 'CATEGORY' ? r.productCategory : r.targetTier?.name || '-'}</td>
                <td className="p-3 font-semibold text-red-600">{r.maxDiscountPercentage}%</td>
              </tr>
            ))}
            {!isLoading && rules.length === 0 && (
              <tr><td colSpan="3" className="p-4 text-center text-slate-500">No rules found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
