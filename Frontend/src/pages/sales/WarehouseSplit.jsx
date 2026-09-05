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
  Clock, 
  Sliders, 
  RotateCcw,
  Boxes,
  MapPin,
  ChevronRight,
  Check
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
    queryFn: () => api.get(`/fulfillment/${orderId}`).then(res => res.data?.data || res.data || res).catch(() => null)
  });

  const productId = planData?.items?.[0]?.productId || planData?.items?.[0]?.product?.id;
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', productId],
    queryFn: () => api.get(`/inventory/availability/${productId}`).then(res => res.data?.data || res.data || res).catch(() => null),
    enabled: !!productId
  });

  const [warehouses, setWarehouses] = useState([]);

  const productName = planData?.items?.[0]?.product?.name || planData?.productName || 'Commercial Hardware & Systems';
  const requiredUnits = planData?.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 1;
  const customerName = planData?.customer?.companyName || planData?.customer?.name || 'Customer Organization';
  const customerTier = planData?.customer?.tier || 'GOLD';

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
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Back Button & Header (Uncarded canvas) */}
      <div>
        <button
          onClick={() => navigate('/sales/fulfillment')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Fulfillment Queue</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[34px] font-semibold text-[#171717] tracking-tight">
                Warehouse Fulfillment Split
              </h1>
              <span className="font-mono text-xs font-bold text-[#D97757] bg-[#F8E9E3] border border-[#F2D7CD] px-2.5 py-1 rounded-md">
                {orderId || 'ORD-1004'}
              </span>
              {isAlreadyShipped && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB]">
                  <Check className="w-3.5 h-3.5" />
                  Fulfilled
                </span>
              )}
            </div>
            <p className="text-[15px] text-[#6F6B66] mt-1">
              Client: <strong className="text-[#171717]">{customerName}</strong> ({customerTier}) &bull; Intelligent multi-hub inventory allocation
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAlreadyShipped ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB] text-xs font-semibold rounded-[9px]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dispatched & Delivered</span>
              </span>
            ) : (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || totalAllocated === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-[#FFFFFF] text-xs font-semibold rounded-[9px] shadow-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{acceptMutation.isPending ? 'Dispatching...' : 'Accept & Dispatch Split'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Requirement & Warehouse Split Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Requirement Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E1D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#D97757] uppercase tracking-wider block">Order Requirement</span>
                <h3 className="text-lg font-bold text-[#171717] mt-0.5">{productName}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#96918A] font-medium block">Target Quantity</span>
                <p className="text-2xl font-bold text-[#171717]">{requiredUnits} <span className="text-xs font-medium text-[#6F6B66]">units</span></p>
              </div>
            </div>

            {/* Progress allocation bar */}
            <div className="space-y-1.5 pt-3 border-t border-[#EEEAE4]">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#6F6B66]">Allocated: <strong>{totalAllocated}</strong> of {requiredUnits} units</span>
                <span className={backorderCount > 0 ? 'text-[#C98A32] font-semibold' : 'text-[#3F8F63] font-semibold'}>
                  {backorderCount > 0 ? `${backorderCount} units backordered` : '✓ 100% Stock Covered'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#E6E1D9] rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${backorderCount > 0 ? 'bg-[#C98A32]' : 'bg-[#3F8F63]'}`}
                  style={{ width: `${Math.min(100, (totalAllocated / requiredUnits) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Warehouse Allocation Table */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E1D9] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#171717] text-sm">Warehouse Inventory & Split</h3>
                <p className="text-xs text-[#6F6B66]">Adjust quantities per hub or use algorithm recommended balance</p>
              </div>
              <div className="flex items-center gap-2">
                {isManualMode ? (
                  <button
                    onClick={handleResetToOptimal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D97757] bg-[#F8E9E3] hover:bg-[#F2D7CD] rounded-[9px] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Recommended</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6F6B66] bg-[#F5F2ED] hover:bg-[#EEEAE4] rounded-[9px] transition-colors border border-[#E6E1D9]"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manual Override</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[11px] font-medium text-[#96918A] uppercase tracking-[0.05em]">
                    <th className="py-3 px-5">Warehouse Location</th>
                    <th className="py-3 px-5">In-Stock Available</th>
                    <th className="py-3 px-5">Allocated Units</th>
                    <th className="py-3 px-5">Freight Est.</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAE4]">
                  {warehouses.map(wh => {
                    const isAllocated = (Number(wh.allocated) || 0) > 0;
                    return (
                      <tr key={wh.id} className={isAllocated ? 'bg-[#FAF9F6]' : 'hover:bg-[#FBFAF8]'}>
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-[#96918A] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-[#171717] text-sm">{wh.name}</div>
                              <div className="text-xs text-[#96918A]">{wh.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-medium text-[#6F6B66]">
                          {wh.available} units
                        </td>
                        <td className="py-4 px-5">
                          {isManualMode ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={wh.available}
                                value={wh.allocated}
                                onChange={(e) => handleQuantityChange(wh.id, e.target.value)}
                                className="w-20 px-2.5 py-1 text-sm font-bold text-[#171717] bg-[#FFFFFF] border border-[#E6E1D9] rounded-[7px] focus:outline-none focus:border-[#D97757]"
                              />
                              <span className="text-xs text-[#96918A]">/ {wh.available}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-[#171717] text-sm">{wh.allocated} units</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-xs font-semibold text-[#6F6B66]">
                          {isAllocated ? `₹${(wh.allocated * wh.ratePerKg + 200).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isAllocated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB]">
                              <Check className="w-3 h-3" />
                              Allocated
                            </span>
                          ) : (
                            <span className="text-xs text-[#96918A] font-medium">Standby</span>
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
          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E1D9] shadow-xs space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97757]" />
              <h3 className="font-bold text-[#171717] text-sm">Cost & SLA Optimization</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E1D9] space-y-1">
                <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-wider block">Estimated Freight Cost</span>
                <p className="text-3xl font-bold text-[#171717]">
                  ₹{currentCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[#3F8F63] font-medium mt-1">Lowest cost route across Gujarat fulfillment grid</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFFFFF] border border-[#E6E1D9] rounded-xl">
                  <span className="text-xs text-[#96918A] block">Hub Dispatches</span>
                  <strong className="text-sm font-bold text-[#171717]">{activeShipments} Dispatches</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#E6E1D9] rounded-xl">
                  <span className="text-xs text-[#96918A] block">Delivery SLA</span>
                  <strong className="text-sm font-bold text-[#171717]">2–3 Days</strong>
                </div>
              </div>
            </div>

            {isAlreadyShipped ? (
              <div className="w-full py-3 bg-[#EAF5EE] text-[#3F8F63] border border-[#CEEADB] font-semibold text-xs rounded-[9px] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shipment Dispatched & Delivered</span>
              </div>
            ) : (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || totalAllocated === 0}
                className="w-full py-3 bg-[#D97757] hover:bg-[#C96648] text-[#FFFFFF] font-semibold text-xs rounded-[9px] transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{acceptMutation.isPending ? 'Confirming...' : 'Dispatch Shipment'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
