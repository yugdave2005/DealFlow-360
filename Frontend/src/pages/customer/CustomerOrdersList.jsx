import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  Inbox
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_QUOTATIONS = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/quotations`;
const getToken = () => localStorage.getItem('accessToken');

export default function CustomerOrdersList() {
  const navigate = useNavigate();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['customerConfirmedOrders'],
    queryFn: async () => {
      const res = await fetch(API_QUOTATIONS, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const orders = quotations.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Confirmed Orders & Deliveries</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track shipment dispatches and delivery timelines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton count={2} />
        ) : orders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Confirmed Orders</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Once you accept and confirm a quotation, the order fulfillment status will appear here.
            </p>
          </div>
        ) : (
          orders.map(order => {
            const v = order.activeVersion || (order.versions && order.versions[0]) || {};
            const total = Number(v.totalAmount || order.totalAmount || 0);
            return (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{order.quotationNumber || `ORD-${order.id.slice(0,6)}`}</span>
                      <span className="text-xs text-slate-500">(Order Confirmed)</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-0.5">
                      {order.customer?.companyName || 'Confirmed Equipment Package'}
                    </h4>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Total Value</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">₹{total.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Created</span>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Status</span>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{order.status}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
