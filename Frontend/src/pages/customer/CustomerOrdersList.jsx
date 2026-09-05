import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Boxes,
  MapPin,
  FileText
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function CustomerOrdersList() {
  const orders = [
    {
      id: 'ord-1004',
      orderNumber: 'ORD-1004',
      quoteNumber: 'QT-1018',
      description: 'Enterprise Rack Server Pro & Hardware Package',
      quantity: 100,
      totalAmount: 124000,
      status: 'CONFIRMED',
      estimatedDelivery: '2-4 business days',
      shipmentsCount: 3,
      destination: 'Infocity Tech Park, Gandhinagar'
    }
  ];

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
        {orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700">{order.orderNumber}</span>
                  <span className="text-xs text-slate-500">(Ref: {order.quoteNumber})</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base mt-0.5">{order.description}</h4>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase">Total Value</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">₹{order.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Delivery SLA</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{order.estimatedDelivery}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Logistics Status</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{order.shipmentsCount} Hub Shipments Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Delivering to: {order.destination}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
