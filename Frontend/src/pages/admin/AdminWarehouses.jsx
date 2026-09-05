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
  MapPin, 
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

  const { register, handleSubmit, reset, watch } = useForm({
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
    (w.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Page Header (Flat Canvas) */}
      <div className="border-b border-[#EEEAE4] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[32px] sm:text-[38px] font-semibold text-[#171717] tracking-tight leading-tight">
              Warehouse Hubs & Depots
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#6F6B66] mt-1 font-normal">
              Manage physical fulfillment centers, regional depots, and multi-hub inventory routing.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 h-11 px-5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse Hub</span>
          </button>
        </div>
      </div>

      {/* 2. Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-[420px] md:w-[480px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
          <input
            type="text"
            placeholder="Search warehouse code, facility name, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Warehouse Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={4} /></div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              icon={Building2}
              title="No warehouses found"
              description={searchTerm ? "Try adjusting your search criteria." : "Create your first warehouse location to start tracking inventory across hubs."}
              actionLabel={!searchTerm ? "Add Warehouse Hub" : null}
              onAction={!searchTerm ? handleOpenNew : null}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-3.5 px-6">Hub Code</th>
                  <th className="py-3.5 px-6">Facility Name</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Active Inventory</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4]">
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-[#FBFAF8] transition-colors" style={{ height: '74px' }}>
                    <td className="py-4 px-6 font-mono text-[#D97757] font-semibold text-[14px] whitespace-nowrap">
                      {wh.code}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#171717] text-[15px] sm:text-[16px]">
                      {wh.name}
                    </td>
                    <td className="py-4 px-6 text-[#6F6B66] text-[14px]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#96918A]" />
                        <span>{wh.location || 'Location Not Specified'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F2ED] text-[#171717] font-semibold text-[12px] border border-[#E6E1D9]">
                        <Box className="w-3.5 h-3.5 text-[#D97757]" />
                        <span>{wh.inventory ? wh.inventory.length : 0} products stocked</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(wh)}
                          className="p-2 text-[#6F6B66] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-[8px] transition-colors cursor-pointer"
                          title="Edit Warehouse"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this warehouse hub?')) {
                              setDeletingId(wh.id);
                              deleteMutation.mutate(wh.id);
                            }
                          }}
                          disabled={deletingId === wh.id}
                          className="p-2 text-[#6F6B66] hover:text-[#C95757] hover:bg-[#FBEAEA] rounded-[8px] transition-colors cursor-pointer disabled:opacity-40"
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

      {/* 4. Add / Edit Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] w-full max-w-lg overflow-hidden shadow-2xl border border-[#E6E1D9] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E6E1D9] bg-[#FAF9F6]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-[17px] font-semibold text-[#171717]">
                  {selectedWarehouse ? 'Edit Warehouse Hub' : 'New Warehouse Hub'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#96918A] hover:text-[#171717] hover:bg-[#EDE8E0] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#171717]">
                      Warehouse Code <span className="text-[#C95757]">*</span>
                    </label>
                    <input
                      {...register('code', { required: true })}
                      disabled={!!selectedWarehouse}
                      className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[13px] font-mono font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 disabled:bg-[#FAF9F6] disabled:text-[#96918A]"
                      placeholder="e.g. WH-AHM-01"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#171717]">
                      Facility Name <span className="text-[#C95757]">*</span>
                    </label>
                    <input
                      {...register('name', { required: true })}
                      className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15"
                      placeholder="e.g. Ahmedabad Central Hub"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#171717]">
                    Location / Region
                  </label>
                  <input
                    {...register('location')}
                    className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15"
                    placeholder="e.g. Ahmedabad, Gujarat"
                  />
                </div>

                <div className="pt-4 border-t border-[#EEEAE4] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 px-5 text-sm font-semibold text-[#6F6B66] hover:text-[#171717] bg-white border border-[#E6E1D9] hover:bg-[#F2EFEA] rounded-[10px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="h-11 px-5 inline-flex items-center gap-2 bg-[#D97757] hover:bg-[#C96648] text-white rounded-[10px] text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Hub'}</span>
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
