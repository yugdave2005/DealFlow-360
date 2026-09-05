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
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/fulfillment`;
const getToken = () => localStorage.getItem('accessToken');

export default function WarehouseSplit() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isManualMode, setIsManualMode] = useState(false);

  // Sample or backend warehouse splits
  const [warehouses, setWarehouses] = useState([
    { id: 'wh-1', name: 'Ahmedabad Central Hub', location: 'Ahmedabad, GJ', available: 120, allocated: 50, ratePerKg: 45 },
    { id: 'wh-2', name: 'Anand Regional Depot', location: 'Anand, GJ', available: 40, allocated: 30, ratePerKg: 55 },
    { id: 'wh-3', name: 'Gandhinagar Express', location: 'Gandhinagar, GJ', available: 25, allocated: 20, ratePerKg: 60 },
    { id: 'wh-4', name: 'Surat Coastal Center', location: 'Surat, GJ', available: 80, allocated: 0, ratePerKg: 75 }
  ]);

  const requiredUnits = 100;
  const productName = 'Enterprise Rack Server Pro / Workstation';

  // Calculations for current allocation
  const totalAllocated = warehouses.reduce((sum, w) => sum + (Number(w.allocated) || 0), 0);
  const remainingNeeded = Math.max(0, requiredUnits - totalAllocated);
  const backorderCount = totalAllocated < requiredUnits ? requiredUnits - totalAllocated : 0;
  const activeShipments = warehouses.filter(w => (Number(w.allocated) || 0) > 0).length;
  
  // Dynamic cost calculation based on shipment overhead & weight rates
  const currentCost = warehouses.reduce((sum, w) => {
    const qty = Number(w.allocated) || 0;
    if (qty === 0) return sum;
    return sum + (qty * w.ratePerKg) + 200; // 200 base shipment dispatch fee
  }, 0);

  const recommendedCost = 2450;
  const recommendedShipments = 3;
  const isCostHigherThanRecommended = currentCost > recommendedCost;

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
    setWarehouses([
      { id: 'wh-1', name: 'Ahmedabad Central Hub', location: 'Ahmedabad, GJ', available: 120, allocated: 50, ratePerKg: 45 },
      { id: 'wh-2', name: 'Anand Regional Depot', location: 'Anand, GJ', available: 40, allocated: 30, ratePerKg: 55 },
      { id: 'wh-3', name: 'Gandhinagar Express', location: 'Gandhinagar, GJ', available: 25, allocated: 20, ratePerKg: 60 },
      { id: 'wh-4', name: 'Surat Coastal Center', location: 'Surat, GJ', available: 80, allocated: 0, ratePerKg: 75 }
    ]);
    setIsManualMode(false);
    toast.info('Reset to AI Recommended Multi-Warehouse Plan');
  };

  const handleConfirmPlan = () => {
    if (totalAllocated === 0) {
      toast.error('Cannot confirm plan with 0 units allocated');
      return;
    }
    toast.success('Warehouse Split Plan Confirmed & Dispatched to Logistics');
    navigate('/sales/fulfillment');
  };

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
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Intelligent multi-hub inventory allocation & route cost optimizer
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirmPlan}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept & Dispatch Split</span>
          </button>
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
                              Active Dispatch
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Idle</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Backorder Alert Card if shortage */}
          {backorderCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Inventory Backorder Alert ({backorderCount} units)</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Available warehouse stock is insufficient for full immediate dispatch. A backorder shipment will be queued for fulfillment from OEM manufacturing depot.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                <span className="text-amber-800 font-medium">Expected Restock: <strong>4 business days</strong></span>
                <button
                  onClick={() => toast.success('Backorder consolidated and notification sent to procurement')}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors"
                >
                  Consolidate Remaining Backorder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Optimization Summary & Comparison */}
        <div className="space-y-6">
          {/* Plan Summary Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Fulfillment Analytics</h3>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Shipment Count</span>
                <span className="text-sm font-bold text-slate-900">{activeShipments} Dispatches</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Estimated Shipping Cost</span>
                <span className="text-sm font-bold text-slate-900">₹{currentCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Delivery Estimate</span>
                <span className="text-sm font-bold text-emerald-700">2 – 4 Days SLA</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Inventory Utilization</span>
                <span className="text-sm font-bold text-slate-900">{Math.round((totalAllocated / 265) * 100)}%</span>
              </div>
            </div>

            {/* Warnings if manual override is suboptimal */}
            {isCostHigherThanRecommended && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-800">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Suboptimal Cost Warning</span>
                </div>
                <p>Manual split incurs +₹{(currentCost - recommendedCost).toLocaleString('en-IN')} additional freight cost vs AI recommendation.</p>
              </div>
            )}
          </div>

          {/* AI Strategy Comparison */}
          <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Multi-Route Engine</span>
            <h4 className="font-bold text-white text-base">Plan Comparison</h4>

            {/* Recommended Plan */}
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-emerald-300">Recommended Plan</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Optimal</span>
              </div>
              <p className="text-xs text-slate-300">3 Shipments · Est. ₹2,450 · 2–4 Days</p>
            </div>

            {/* Alternative Plan */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-200">Alternative Single-Hub</span>
                <span className="text-xs text-slate-400">4 Shipments</span>
              </div>
              <p className="text-xs text-slate-400">Cost: ₹2,780 · Savings lost: ₹330</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
