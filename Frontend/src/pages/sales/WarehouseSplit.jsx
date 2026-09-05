import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Package, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  Sliders, 
  RotateCcw,
  Boxes,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { api } from '../../lib/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function WarehouseSplit() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isManualMode, setIsManualMode] = useState(false);

  // Fetch live fulfillment plan
  const { data: planData, isLoading } = useQuery({
    queryKey: ['fulfillmentPlan', orderId],
    queryFn: () => api.get(`/fulfillment/${orderId}`).then(res => res.data?.data || res.data).catch(() => null)
  });

  const productId = planData?.items?.[0]?.productId || planData?.items?.[0]?.product?.id;
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', productId],
    queryFn: () => api.get(`/inventory/availability/${productId}`).then(res => res.data?.data || res.data).catch(() => null),
    enabled: !!productId
  });

  const [warehouses, setWarehouses] = useState([]);

  const productName = planData?.items?.[0]?.product?.name || planData?.productName || 'Commercial Hardware & Systems';
  const requiredUnits = planData?.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 1;
  const customerName = planData?.customer?.companyName || planData?.customer?.name || 'Customer Organization';

  const isAlreadyShipped = (planData?.items || []).some(i => i.status === 'SHIPPED') || planData?.order?.status === 'FULFILLED';

  useEffect(() => {
    if (inventoryData?.warehouses && planData) {
      const existingItems = planData.items || [];
      const hasShipped = existingItems.some(i => i.status === 'SHIPPED');

      // Map existing warehouse allocations from the fulfillment plan
      const allocationMap = new Map();
      existingItems.forEach(i => {
        if (i.warehouseId) {
          allocationMap.set(i.warehouseId, (allocationMap.get(i.warehouseId) || 0) + (i.quantity || 0));
        }
      });

      let remaining = requiredUnits;
      const mapped = inventoryData.warehouses.map(w => {
        let allocate = 0;
        if (allocationMap.has(w.warehouseId)) {
          allocate = allocationMap.get(w.warehouseId);
        } else if (!hasShipped && remaining > 0) {
          allocate = Math.min(w.available, remaining);
          remaining -= allocate;
        }

        return {
          id: w.warehouseId,
          name: w.warehouseName,
          location: w.warehouseLocation || w.location || '',
          available: w.available,
          allocated: allocate,
          ratePerKg: 45
        };
      });
      setWarehouses(mapped);
    } else if (planData?.items && planData.items.length > 0 && !inventoryData) {
       setWarehouses([]);
    }
  }, [inventoryData, planData, requiredUnits]);

  // Calculations for current allocation
  const totalAllocated = warehouses.reduce((sum, w) => sum + (Number(w.allocated) || 0), 0);
  const remainingNeeded = Math.max(0, requiredUnits - totalAllocated);
  const backorderCount = totalAllocated < requiredUnits ? requiredUnits - totalAllocated : 0;
  const activeShipments = warehouses.filter(w => (Number(w.allocated) || 0) > 0).length;
  
  const currentCost = warehouses.reduce((sum, w) => {
    const qty = Number(w.allocated) || 0;
    if (qty === 0) return sum;
    return sum + (qty * w.ratePerKg) + 200;
  }, 0);

  const recommendedCost = 1540;

  const handleQuantityChange = (whId, newQty) => {
    const qty = Math.max(0, parseInt(newQty) || 0);
    setWarehouses(warehouses.map(w => {
      if (w.id === whId) {
        return { ...w, allocated: Math.min(w.available, qty) };
      }
      return w;
    }));
  };

  const handleResetToOptimal = () => {
    if (inventoryData?.warehouses) {
      let remaining = requiredUnits;
      const mapped = inventoryData.warehouses.map(w => {
        const allocate = Math.min(w.available, remaining);
        remaining -= allocate;
        return {
          id: w.warehouseId,
          name: w.warehouseName,
          location: w.warehouseLocation || w.location || '',
          available: w.available,
          allocated: allocate,
          ratePerKg: 45
        };
      });
      setWarehouses(mapped);
    }
    setIsManualMode(false);
    toast.info('Reset to AI Recommended Multi-Warehouse Plan');
  };

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/fulfillment/${orderId}/accept`, {
      splits: warehouses.filter(w => w.allocated > 0).map(w => ({
        warehouseId: w.id,
        productId,
        quantity: w.allocated
      }))
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlan', orderId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', productId] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Warehouse Split Plan Confirmed & Dispatched to Carrier Logistics');
      navigate('/sales/fulfillment');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Dispatch failed');
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <button
            onClick={() => navigate('/sales/fulfillment')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Fulfillment Queue</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Warehouse Fulfillment Split
                </h1>
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {orderId || 'ORD-1004'}
                </span>
                {isAlreadyShipped && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fulfilled
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Client: <strong>{customerName}</strong> &bull; Intelligent multi-hub inventory allocation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAlreadyShipped ? (
            <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dispatched & Delivered</span>
            </span>
          ) : (
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || totalAllocated === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{acceptMutation.isPending ? 'Dispatching...' : 'Accept & Dispatch Split'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Requirement & Warehouse Split Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Requirement Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Order Requirement</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{productName}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Target Quantity</span>
                <p className="text-2xl font-extrabold text-slate-900">{requiredUnits} <span className="text-sm font-semibold text-slate-500">units</span></p>
              </div>
            </div>

            {/* Progress allocation bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600">Allocated: <strong>{totalAllocated}</strong> of {requiredUnits} units</span>
                <span className={backorderCount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {backorderCount > 0 ? `${backorderCount} units backordered` : '100% Stock Covered'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${backorderCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (totalAllocated / requiredUnits) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Warehouse Allocation Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Warehouse Inventory & Split</h3>
                <p className="text-xs text-slate-500">Adjust quantities per hub or use algorithm recommended balance</p>
              </div>
              <div className="flex items-center gap-2">
                {isManualMode ? (
                  <button
                    onClick={handleResetToOptimal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Recommended</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manual Override</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Warehouse Location</th>
                    <th className="py-3 px-4">In-Stock Available</th>
                    <th className="py-3 px-4">Allocated Units</th>
                    <th className="py-3 px-4">Freight Est.</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warehouses.map(wh => {
                    const isAllocated = (Number(wh.allocated) || 0) > 0;
                    return (
                      <tr key={wh.id} className={isAllocated ? 'bg-indigo-50/20' : ''}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-slate-900">{wh.name}</div>
                              <div className="text-xs text-slate-400">{wh.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {wh.available} units
                        </td>
                        <td className="py-3.5 px-4">
                          {isManualMode ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={wh.available}
                                value={wh.allocated}
                                onChange={(e) => handleQuantityChange(wh.id, e.target.value)}
                                className="w-20 px-2.5 py-1 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                              <span className="text-xs text-slate-400">/ {wh.available}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 text-base">{wh.allocated} units</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                          {isAllocated ? `₹${(wh.allocated * wh.ratePerKg + 200).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isAllocated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Allocated
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Standby</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Logistics Optimization Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Cost Optimization</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Estimated Freight Cost</span>
                <p className="text-3xl font-extrabold text-slate-900">
                  ₹{currentCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-emerald-700 font-medium">Lowest cost route across Gujarat fulfillment grid</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 block">Hub Dispatches</span>
                  <strong className="text-base text-slate-800">{activeShipments} Dispatches</strong>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 block">Delivery SLA</span>
                  <strong className="text-base text-slate-800">2-3 Days</strong>
                </div>
              </div>
            </div>

            {isAlreadyShipped ? (
              <div className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Shipment Dispatched & Delivered</span>
              </div>
            ) : (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || totalAllocated === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{acceptMutation.isPending ? 'Confirming...' : 'Dispatch Shipment'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
