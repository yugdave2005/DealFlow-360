import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data)
  });

  const { register, handleSubmit, reset } = useForm();
  
  const createMutation = useMutation({
    mutationFn: adminApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Product created');
      reset();
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      isSubscription: data.isSubscription === 'true',
      quantityOnHand: parseInt(data.quantityOnHand, 10) || 0
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products & Catalog</h1>
      
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <input {...register('name')} placeholder="Product Name" className="border p-2 rounded" required />
          <input {...register('category')} placeholder="Category (e.g. Hardware)" className="border p-2 rounded" required />
          
          <select {...register('isSubscription')} className="border p-2 rounded">
            <option value="false">One-Time Purchase</option>
            <option value="true">Subscription</option>
          </select>
          
          <input {...register('quantityOnHand')} type="number" placeholder="Stock Qty" className="border p-2 rounded" />
          
          <button type="submit" disabled={createMutation.isPending} className="col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {createMutation.isPending ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow text-left">
        <table className="w-full">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td className="p-4">Loading...</td></tr> : null}
            {products.map(p => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.isSubscription ? 'Subscription' : 'One-Time'}</td>
                <td className="p-3">{p.quantityOnHand}</td>
              </tr>
            ))}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-slate-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
