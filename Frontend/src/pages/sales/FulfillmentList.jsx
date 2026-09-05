import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Truck, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Boxes, 
  Clock, 
  ExternalLink,
  ChevronRight,
  PackageCheck,
  Building
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/fulfillment`;
const getToken = () => localStorage.getItem('accessToken');

export default function FulfillmentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['fulfillmentPlans'],
    queryFn: async () => {
      const res = await fetch(API, { 
        headers: { 'Authorization': `Bearer ${getToken()}` } 
      });
      if (!res.ok) throw new Error('Failed to fetch fulfillment orders');
      const json = await res.json();
      return json.data || [];
    }
  });

  const acceptPlanMutation = useMutation({
    mutationFn: async (planId) => {
      const res = await fetch(`${API}/${planId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to accept fulfillment split');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      toast.success('Warehouse split accepted & dispatched for fulfillment');
    },
    onError: (err) => {
      toast.error(err.message || 'Acceptance failed');
    }
  });

  const filteredPlans = (plans || []).filter(p => {
    const orderNum = p.order?.orderNumber || p.orderId || '';
    const custName = p.order?.customer?.companyName || '';
    const matchesSearch = orderNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Fulfillment</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage multi-warehouse inventory allocations and shipment dispatching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Fulfillment Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Truck}
              title="No orders are waiting for fulfillment."
              description="Orders requiring warehouse splits and inventory allocation will appear here once customer quotations are confirmed."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Required Qty</th>
                  <th className="py-3.5 px-4">Available Stock</th>
                  <th className="py-3.5 px-4">Warehouses</th>
                  <th className="py-3.5 px-4">Delivery SLA</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => {
                  const orderNum = plan.order?.orderNumber || plan.orderId || 'ORD-1001';
                  const customer = plan.order?.customer || {};
                  const isBackorder = (plan.items || []).some(i => i.status === 'BACKORDER') || plan.status === 'BACKORDER';

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                        {orderNum}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{customer.companyName || 'Enterprise Client'}</div>
                        <div className="text-xs text-slate-400">{customer.tier || 'ENTERPRISE'}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium text-xs max-w-[200px] truncate">
                        {plan.productName || 'Hardware & Networking Rack'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {plan.requiredQty || 100} units
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {plan.availableStock || 265} units
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Boxes className="w-3.5 h-3.5" />
                          {plan.warehouseCount || (plan.items ? plan.items.length : 3)} Hubs
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-600">
                        {plan.estimatedDelivery || '2–4 Days'}
                      </td>
                      <td className="py-4 px-4">
                        {isBackorder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Backorder Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Stock Allocated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate(`/sales/fulfillment/${orderNum}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors"
                        >
                          <span>Manage Split</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
