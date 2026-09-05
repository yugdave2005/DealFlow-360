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
  RefreshCw,
  CreditCard,
  Zap,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/axios';
import { fulfillmentApi } from '../../features/fulfillment/fulfillment.api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SLA_TIERS = [
  { 
    id: 'SAME_DAY', 
    label: 'Same-Day / Instant', 
    days: 0, 
    ratePerKg: 120, 
    badge: 'Testing / Immediate', 
    desc: 'Instant delivery simulation — directly unblocks invoice payment & billing testing' 
  },
  { 
    id: 'EXPRESS', 
    label: 'Express Priority', 
    days: 1, 
    ratePerKg: 85, 
    badge: '1 Day SLA', 
    desc: 'Expedited air & priority road linehaul for mission-critical orders' 
  },
  { 
    id: 'STANDARD', 
    label: 'Standard Ground', 
    days: 3, 
    ratePerKg: 45, 
    badge: '2–3 Days SLA', 
    desc: 'AI balanced multi-warehouse regional surface logistics' 
  },
  { 
    id: 'ECONOMY', 
    label: 'Economy Freight', 
    days: 5, 
    ratePerKg: 25, 
    badge: '4–5 Days SLA', 
    desc: 'Consolidated bulk surface route for maximum margin optimization' 
  }
];

export default function WarehouseSplit() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedSla, setSelectedSla] = useState('SAME_DAY'); // Default to Same-Day so testing billing is seamless

  // Fetch live fulfillment plan
  const { data: planData, isLoading } = useQuery({
    queryKey: ['fulfillmentPlan', orderId],
    queryFn: () => fulfillmentApi.getPlanById(orderId).then(res => res.data?.data || res.data).catch(() => null)
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

  const isAlreadyDelivered = (planData?.items || []).length > 0 && (planData?.items || []).every(i => i.status === 'DELIVERED');
  const isAlreadyShipped = !isAlreadyDelivered && ((planData?.items || []).some(i => i.status === 'SHIPPED') || planData?.order?.status === 'FULFILLED');

  const currentSlaObj = SLA_TIERS.find(s => s.id === selectedSla) || SLA_TIERS[0];

  useEffect(() => {
    if (planData) {
      const existingItems = planData.items || [];

      // Map existing warehouse allocations from the fulfillment plan
      const allocationMap = new Map();
      let hasExplicitAllocations = false;
      existingItems.forEach(i => {
        if (i.warehouseId && i.quantity > 0) {
          allocationMap.set(i.warehouseId, (allocationMap.get(i.warehouseId) || 0) + Number(i.quantity));
          hasExplicitAllocations = true;
        }
      });

      const sourceList = (inventoryData?.warehouses && inventoryData.warehouses.length > 0)
        ? inventoryData.warehouses
        : (planData.availableWarehouses || []).map(w => ({
            warehouseId: w.id,
            warehouseName: w.name,
            warehouseLocation: w.location || '',
            available: 30
          }));

      let remaining = requiredUnits;
      const ratePerKg = currentSlaObj.ratePerKg;

      const mapped = sourceList.map(w => {
        let allocate = 0;
        if (hasExplicitAllocations) {
          allocate = allocationMap.get(w.warehouseId) || 0;
        } else if (remaining > 0) {
          allocate = Math.min(Number(w.available) || 0, remaining);
          remaining -= allocate;
        }

        return {
          id: w.warehouseId,
          name: w.warehouseName,
          location: w.warehouseLocation || w.location || '',
          available: Number(w.available) || 0,
          allocated: allocate,
          ratePerKg
        };
      });
      setWarehouses(mapped);
    }
  }, [inventoryData, planData, requiredUnits, selectedSla]);

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
    return sum + (qty * currentSlaObj.ratePerKg) + 200;
  }, 0);

  const handleQuantityChange = (whId, newQty) => {
    const qty = Math.max(0, parseInt(newQty, 10) || 0);
    setWarehouses(warehouses.map(w => {
      if (w.id === whId) {
        return { ...w, allocated: Math.min(w.available, qty) };
      }
      return w;
    }));
  };

  const handleResetToOptimal = () => {
    const sourceList = (inventoryData?.warehouses && inventoryData.warehouses.length > 0)
      ? inventoryData.warehouses
      : warehouses;
    let remaining = requiredUnits;
    const mapped = sourceList.map(w => {
      const allocate = Math.min(Number(w.available) || 0, remaining);
      remaining -= allocate;
      return {
        id: w.warehouseId || w.id,
        name: w.warehouseName || w.name,
        location: w.warehouseLocation || w.location || '',
        available: Number(w.available) || 0,
        allocated: allocate,
        ratePerKg: currentSlaObj.ratePerKg
      };
    });
    setWarehouses(mapped);
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
<<<<<<< HEAD
    mutationFn: () => fulfillmentApi.acceptPlan(orderId, {
      splits: warehouses.filter(w => w.allocated > 0).map(w => ({
=======
    mutationFn: () => {
      if (!productId) {
        throw new Error('Product ID is not available — plan data may not be loaded yet');
      }
      const targetId = planData?.id || planData?.orderId || orderId;
      const splits = warehouses.filter(w => w.allocated > 0 && w.id).map(w => ({
>>>>>>> origin/main
        warehouseId: w.id,
        productId,
        quantity: Number(w.allocated)
      }));
      console.log('[WarehouseSplit] Dispatching accept with splits:', JSON.stringify(splits));
      if (splits.length === 0) {
        throw new Error('No warehouses have allocations — please assign quantities before dispatching');
      }
      return api.post(`/fulfillment/${targetId}/accept`, {
        splits,
        deliveryDays: currentSlaObj.days
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlan', orderId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', productId] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      toast.success('Warehouse Split Plan Confirmed & Dispatched to Logistics');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  });

  const deliverMutation = useMutation({
    mutationFn: () => {
      const targetId = planData?.id || planData?.orderId || orderId;
      return api.post(`/fulfillment/${targetId}/deliver`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlan', orderId] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Shipment marked as DELIVERED! Invoices are now active for billing.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update delivery status');
    }
  });

  const quickPayOrderMutation = useMutation({
    mutationFn: async () => {
      const invoicesRes = await api.get('/invoices').then(r => r.data?.data || r.data || []);
      const matchInv = (Array.isArray(invoicesRes) ? invoicesRes : []).find(
        inv => inv.orderId === planData?.orderId || inv.order?.id === planData?.orderId || inv.orderNumber === planData?.order?.orderNumber
      );
      if (!matchInv) {
        throw new Error('No active invoice found for this order. Use View Invoices to review all billing.');
      }
      const autoRef = `UPI-SPLIT-${Date.now().toString().slice(-6)}`;
      return api.post(`/invoices/${matchInv.id}/pay`, {
        paymentMethod: 'UPI',
        paymentReference: autoRef
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentPlan', orderId] });
      toast.success('⚡ Quick Payment Recorded! Order invoice marked as PAID.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Payment recording failed');
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton className="h-24 w-full rounded-2xl" />
        <LoadingSkeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

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
          {isAlreadyDelivered ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivered & Completed</span>
            </span>
          ) : isAlreadyShipped ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Dispatched & In Transit</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
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
            <span className={`text-base font-bold ${totalAllocated === requiredUnits ? 'text-emerald-700' : totalAllocated > requiredUnits ? 'text-amber-700' : 'text-rose-600'}`}>
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

      {/* 3. Automatic Backorder Consolidation Prompt */}
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
                          {isAllocated ? `₹${(wh.allocated * currentSlaObj.ratePerKg + 200).toLocaleString('en-IN')}` : '—'}
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

        {/* Right Col: Logistics Optimization & SLA Speed Card */}
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#EBE8E2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B85D19]" />
              <h3 className="font-bold text-[#1E1B18] text-sm">Cost & SLA Optimization</h3>
            </div>

            {/* SLA Delivery Speed Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                Select Delivery SLA Speed
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SLA_TIERS.map(tier => {
                  const isSelected = selectedSla === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedSla(tier.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#B85D19] bg-[#FDF9F6] ring-1 ring-[#B85D19]'
                          : 'border-[#EBE8E2] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#B85D19]' : 'bg-[#D6D3D1]'}`} />
                          <span className="text-xs font-bold text-[#1E1B18]">{tier.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tier.id === 'SAME_DAY'
                            ? 'bg-amber-100 text-amber-800'
                            : isSelected
                            ? 'bg-[#F5EFEB] text-[#B85D19]'
                            : 'bg-[#F5F2ED] text-[#78716C]'
                        }`}>
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-1 pl-4">{tier.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cost & Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] space-y-1">
                <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">Estimated Freight Cost</span>
                <p className="text-3xl font-bold text-[#1E1B18]">
                  ₹{currentCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-emerald-700 font-medium mt-1">Calculated based on {currentSlaObj.label} rate</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFFFFF] border border-[#EBE8E2] rounded-xl">
                  <span className="text-xs text-[#78716C] block">Hub Dispatches</span>
                  <strong className="text-sm font-bold text-[#1E1B18]">{activeShipments} Dispatches</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#EBE8E2] rounded-xl">
                  <span className="text-xs text-[#78716C] block">Transit SLA</span>
                  <strong className="text-sm font-bold text-[#1E1B18]">{currentSlaObj.badge}</strong>
                </div>
              </div>
            </div>

            {/* Actions: Dispatch / Simulate Delivery / Go to Invoices */}
            <div className="space-y-3 pt-2">
              {isAlreadyDelivered ? (
                <div className="space-y-2.5">
                  <div className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Delivered & Billing Active</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => quickPayOrderMutation.mutate()}
                    disabled={quickPayOrderMutation.isPending}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#B85D19] hover:from-amber-600 hover:to-[#9E4E13] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{quickPayOrderMutation.isPending ? 'Settling Payment...' : 'Quick Pay Invoice (1-Click Test)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/sales/invoices')}
                    className="w-full py-3.5 bg-white hover:bg-[#FAF8F5] text-[#1E1B18] border border-[#EBE8E2] font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#B85D19]" />
                    <span>Proceed to Payment & Invoices</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              ) : isAlreadyShipped ? (
                <div className="space-y-2.5">
                  <div className="w-full py-2.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Shipment Dispatched & In Transit</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deliverMutation.mutate()}
                    disabled={deliverMutation.isPending}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{deliverMutation.isPending ? 'Updating...' : 'Simulate Instant Delivery (Test Mode)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickPayOrderMutation.mutate()}
                    disabled={quickPayOrderMutation.isPending}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#B85D19] hover:from-amber-600 hover:to-[#9E4E13] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{quickPayOrderMutation.isPending ? 'Settling Payment...' : 'Quick Pay Invoice (1-Click Test)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/sales/invoices')}
                    className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] text-[#1E1B18] border border-[#EBE8E2] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#B85D19]" />
                    <span>View Invoices & Billing</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending || totalAllocated === 0}
                    className="w-full py-3.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{acceptMutation.isPending ? 'Confirming...' : 'Dispatch Shipment'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/sales/invoices')}
                    className="w-full py-2.5 text-[#78716C] hover:text-[#1E1B18] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Skip to Invoices & Billing</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
