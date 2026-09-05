import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/v1/fulfillment';
const getToken = () => localStorage.getItem('accessToken');

const fetchPlans = async () => {
  const res = await fetch(API, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return (await res.json()).data;
};

export default function FulfillmentList() {
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['fulfillment'], queryFn: fetchPlans });

  const acceptPlan = useMutation({
    mutationFn: async (planId) => {
      const res = await fetch(`${API}/${planId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Accept failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fulfillment'] }); toast.success('Plan accepted'); }
  });

  const statusColor = (items) => {
    if (items.some(i => i.status === 'BACKORDER')) return 'bg-amber-100 text-amber-700';
    if (items.every(i => i.status === 'SHIPPED' || i.status === 'DELIVERED')) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  const statusLabel = (items) => {
    if (items.some(i => i.status === 'BACKORDER')) return 'Partial / Backorder';
    if (items.every(i => i.status === 'SHIPPED' || i.status === 'DELIVERED')) return 'Fulfilled';
    return 'Pending Split';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Fulfillment</h1>
        <p className="text-slate-500 mt-1">Manage warehouse splits and shipments</p>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-500">Loading…</div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
          <p className="text-slate-500 text-lg">No fulfillment plans yet. Plans are generated when orders are created from confirmed quotations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Order {plan.order?.orderNumber || plan.orderId}</h3>
                    <p className="text-sm text-slate-500">{plan.shipmentCount} shipment(s) · ${parseFloat(plan.totalCost).toFixed(2)} est. cost</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider ${statusColor(plan.items)}`}>
                    {statusLabel(plan.items)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b">
                        <th className="pb-2">Warehouse</th>
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Est. Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {plan.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-2 font-medium text-slate-800">{item.warehouse?.name || <span className="text-amber-600 font-bold">BACKORDER</span>}</td>
                          <td className="py-2 text-slate-600">{item.productId.slice(0, 8)}…</td>
                          <td className="py-2 text-slate-800 font-semibold">{item.quantity}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.status === 'BACKORDER' ? 'bg-amber-100 text-amber-700' : item.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 text-slate-500">{item.estimatedDelivery ? new Date(item.estimatedDelivery).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    onClick={() => acceptPlan.mutate(plan.id)}
                    disabled={plan.items.every(i => i.status === 'SHIPPED' || i.status === 'DELIVERED')}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    Accept Suggested Split
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
