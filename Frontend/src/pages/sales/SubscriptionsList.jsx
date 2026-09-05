import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/v1/subscriptions';
const getToken = () => localStorage.getItem('accessToken');

const fetchSubs = async () => {
  const res = await fetch(API, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()).data;
};

export default function SubscriptionsList() {
  const queryClient = useQueryClient();
  const { data: subs = [], isLoading } = useQuery({ queryKey: ['subscriptions'], queryFn: fetchSubs });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/${id}/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Cancel failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); toast.success('Subscription cancelled'); }
  });

  const statusBadge = (status) => {
    const map = { ACTIVE: 'bg-green-100 text-green-700', PAUSED: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700' };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage recurring billing plans</p>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-500">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
          <p className="text-slate-500 text-lg">No active subscriptions.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subs.map(sub => (
            <div key={sub.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-slate-900">Order {sub.order?.orderNumber || sub.orderId.slice(0,8)}</h3>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusBadge(sub.status)}`}>{sub.status}</span>
                </div>
                <p className="text-sm text-slate-500">
                  {sub.interval} · Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {sub.status === 'ACTIVE' && (
                  <button onClick={() => cancelMutation.mutate(sub.id)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
