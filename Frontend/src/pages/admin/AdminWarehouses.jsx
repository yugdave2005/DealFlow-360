import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '../../features/warehouses/warehouses.api';
import { api } from '../../lib/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Building2, 
  Search, 
  Plus, 
  Settings2, 
  MapPin, 
  Info, 
  X, 
  Save, 
  Trash2, 
  Edit3, 
  Box
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

export default function AdminWarehouses() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['adminWarehouses'],
    queryFn: () => warehousesApi.getWarehouses().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      code: '',
      name: '',
      location: ''
    }
  });

  // Mutation: Create Warehouse
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWarehouses'] });
      toast.success('Warehouse created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create warehouse')
  });

  // Mutation: Update Warehouse
  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/warehouses/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWarehouses'] });
      toast.success('Warehouse updated successfully');
      setIsModalOpen(false);
      setSelectedWarehouse(null);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update warehouse')
  });

  // Mutation: Delete Warehouse
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWarehouses'] });
      toast.success('Warehouse deleted successfully');
      setDeletingId(null);
      if (selectedWarehouse) {
        setIsModalOpen(false);
        setSelectedWarehouse(null);
      }
    },
    onError: (err) => {
      setDeletingId(null);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete warehouse');
    }
  });

  const onSubmit = (data) => {
    const payload = {
      code: data.code?.trim(),
      name: data.name?.trim(),
      location: data.location?.trim()
    };

    if (selectedWarehouse && selectedWarehouse.id) {
      updateMutation.mutate({ id: selectedWarehouse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenNew = () => {
    setSelectedWarehouse(null);
    reset({
      code: '',
      name: '',
      location: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    reset({
      code: warehouse.code || '',
      name: warehouse.name || '',
      location: warehouse.location || ''
    });
    setIsModalOpen(true);
  };

  const filteredWarehouses = warehouses.filter(w => 
    (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Warehouse Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage physical storage locations and inventory capacities</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Warehouse
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSkeleton type="table" rows={6} />
        ) : filteredWarehouses.length === 0 ? (
          <EmptyState 
            icon={Building2}
            title="No warehouses found"
            description={searchTerm ? "Try adjusting your search terms." : "Create your first warehouse location to start tracking inventory."}
            actionLabel={!searchTerm ? "Add Warehouse" : null}
            onAction={!searchTerm ? handleOpenNew : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Total Inventory Items</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-5 font-mono text-indigo-700 font-semibold text-xs">
                      {wh.code}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {wh.name}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {wh.location || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-100">
                        <Box className="w-3.5 h-3.5" />
                        {wh.inventory ? wh.inventory.length : 0} Products
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(wh)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Warehouse"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this warehouse? All associated inventory records might be affected.')) {
                              setDeletingId(wh.id);
                              deleteMutation.mutate(wh.id);
                            }
                          }}
                          disabled={deletingId === wh.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Warehouse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {selectedWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Warehouse Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('code', { required: true })}
                      disabled={!!selectedWarehouse}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="e.g. WH-AHM-01"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('name', { required: true })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                      placeholder="e.g. Central Hub"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Location
                  </label>
                  <input
                    {...register('location')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    placeholder="e.g. Ahmedabad, Gujarat"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Warehouse'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
