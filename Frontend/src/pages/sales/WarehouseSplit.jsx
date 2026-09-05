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
  Check,
  RefreshCw
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
  const totalAvailableAcrossHubs = warehouses.reduce((sum, w) => sum + (Number(w.available) || 0), 0);
  const canConsolidateBackorder = backorderCount > 0 && totalAvailableAcrossHubs >= requiredUnits;
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

  const handleConsolidateBackorder = () => {
    let needed = requiredUnits;
    const updated = warehouses.map(w => {
      const allocate = Math.min(w.available, needed);
      needed -= allocate;
      return { ...w, allocated: allocate };
    });
    setWarehouses(updated);
    toast.success('Backorders successfully consolidated across available warehouse hubs!');
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
      toast.success('Warehouse Split Plan Confirmed & Dispatched to Logistics');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sales/fulfillment')}
            className="p-2.5 text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Back to Fulfillment List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1E1B18] font-mono tracking-tight">{orderId}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5EFEB] text-[#B85D19] border border-[#E8DFD8]">
                Multi-Hub Fulfillment
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#A8A29E]" />
              <span className="font-semibold text-[#1E1B18]">{customerName}</span>
              <span>&bull;</span>
              <span>Account Tier: {customerTier}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAlreadyShipped ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Fulfilled & Dispatched</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-4 h-4" />
              <span>Pending Allocation</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Order SKU Overview Card */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E1B18]">{productName}</h2>
            <p className="text-xs text-[#78716C] mt-0.5 font-mono">
              SKU: {productId?.slice(0, 8) || 'GEN-SKU-99'} &bull; Total Demand: <strong>{requiredUnits} Units</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-start md:self-auto text-xs">
          <div>
            <span className="text-[#A8A29E] block uppercase font-bold text-[10px]">Allocated Units</span>
            <span className={`text-base font-bold ${totalAllocated >= requiredUnits ? 'text-emerald-700' : 'text-amber-700'}`}>
              {totalAllocated} / {requiredUnits}
            </span>
          </div>
          <div className="border-l border-[#EBE8E2] pl-6">
            <span className="text-[#A8A29E] block uppercase font-bold text-[10px]">Backorder Remainder</span>
            <span className={`text-base font-bold ${backorderCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {backorderCount} units
            </span>
          </div>
        </div>
      </div>

      {/* 3. Automatic Backorder Consolidation Prompt (PDF Page 7) */}
      {canConsolidateBackorder && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">Stock Replenishment Detected: Consolidate Remaining Backorder?</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Additional stock is available across warehouses to fulfill all {backorderCount} remaining backordered units.
              </p>
            </div>
          </div>

          <button
            onClick={handleConsolidateBackorder}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Consolidate Remaining Backorder
          </button>
        </div>
      )}

      {/* 4. Split Allocation Table & Logistics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Warehouse Matrix Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E1B18]">Warehouse Allocation Matrix</h3>
                <p className="text-xs text-[#78716C]">Adjust quantities per hub or use algorithm recommended balance</p>
              </div>
              <div className="flex items-center gap-2">
                {isManualMode ? (
                  <button
                    onClick={handleResetToOptimal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#B85D19] bg-[#F5EFEB] hover:bg-[#E8DFD8] rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Recommended</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#44403C] bg-[#FAF8F5] hover:bg-[#F5EFEB] rounded-xl transition-colors border border-[#EBE8E2] cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#78716C]" />
                    <span>Manual Override</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EBE8E2] text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    <th className="py-3 px-5">Warehouse Location</th>
                    <th className="py-3 px-5">In-Stock Available</th>
                    <th className="py-3 px-5">Allocated Units</th>
                    <th className="py-3 px-5">Freight Est.</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE8E2]/60">
                  {warehouses.map(wh => {
                    const isAllocated = (Number(wh.allocated) || 0) > 0;
                    return (
                      <tr key={wh.id} className={isAllocated ? 'bg-[#FAF8F5]/60' : 'hover:bg-[#FAF8F5]/30'}>
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-[#A8A29E] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-[#1E1B18] text-sm">{wh.name}</div>
                              <div className="text-xs text-[#78716C]">{wh.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-medium text-[#44403C]">
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
                                className="w-20 px-2.5 py-1 text-sm font-bold text-[#1E1B18] bg-[#FFFFFF] border border-[#EBE8E2] rounded-xl focus:outline-none focus:border-[#B85D19]"
                              />
                              <span className="text-xs text-[#A8A29E]">/ {wh.available}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-[#1E1B18] text-sm">{wh.allocated} units</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-xs font-semibold text-[#78716C]">
                          {isAllocated ? `₹${(wh.allocated * wh.ratePerKg + 200).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isAllocated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              Allocated
                            </span>
                          ) : (
                            <span className="text-xs text-[#A8A29E] font-medium">Standby</span>
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
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B85D19]" />
              <h3 className="font-bold text-[#1E1B18] text-sm">Cost & SLA Optimization</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] space-y-1">
                <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">Estimated Freight Cost</span>
                <p className="text-3xl font-bold text-[#1E1B18]">
                  ₹{currentCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-emerald-700 font-medium mt-1">Lowest cost route across multi-warehouse fulfillment grid</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFFFFF] border border-[#EBE8E2] rounded-xl">
                  <span className="text-xs text-[#78716C] block">Hub Dispatches</span>
                  <strong className="text-sm font-bold text-[#1E1B18]">{activeShipments} Dispatches</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#EBE8E2] rounded-xl">
                  <span className="text-xs text-[#78716C] block">Delivery SLA</span>
                  <strong className="text-sm font-bold text-[#1E1B18]">2–3 Days</strong>
                </div>
              </div>
            </div>

            {isAlreadyShipped ? (
              <div className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shipment Dispatched & In Transit</span>
              </div>
            ) : (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || totalAllocated === 0}
                className="w-full py-3.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
