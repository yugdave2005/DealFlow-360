import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Package, 
  Wrench, 
  Layers, 
  Save, 
  Send, 
  CheckCircle,
  Building,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import RiskBadge from '../../components/common/RiskBadge';
import { adminApi } from '../../features/admin/admin.api';

export default function QuotationBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dismissedUpsells, setDismissedUpsells] = useState([]);

  // Fetch backend customer tiers
  const { data: customerTiers = [] } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => adminApi.getCustomerTiers().then(res => res.data).catch(() => [])
  });

  // Fetch backend products
  const { data: backendProducts = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data).catch(() => [])
  });

  const customers = useMemo(() => {
    if (!customerTiers || customerTiers.length === 0) return [];
    return customerTiers.map(t => ({
      id: t.id,
      name: t.name,
      tier: t.name,
      tierDiscountLimit: t.name.toLowerCase().includes('enterprise') ? 25 : t.name.toLowerCase().includes('gold') ? 20 : 15,
      contact: t.description || 'Account Rep',
      email: `billing@${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    }));
  }, [customerTiers]);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      setValue('customerId', customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const products = useMemo(() => {
    if (backendProducts && backendProducts.length > 0) {
      return backendProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
        category: p.category || 'HARDWARE',
        basePrice: Number(p.pricing?.[0]?.price || p.price || 0),
        cost: Number(p.pricing?.[0]?.price || p.price || 0) * 0.65,
        stock: p.quantityOnHand ?? p.stock ?? 0,
        allowedDiscount: 15,
        isSubscription: p.isSubscription || p.type === 'SUBSCRIPTION',
        interval: p.recurringInterval || 'Monthly'
      }));
    }
    return [];
  }, [backendProducts]);

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      customerId: '',
      lineItems: []
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const watchLineItems = watch('lineItems') || [];
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || {
    id: 'default',
    name: 'Select Customer Tier',
    tier: 'Standard',
    tierDiscountLimit: 15,
    contact: '',
    email: ''
  };

  // Dynamic calculations with Hybrid Billing
  const calculations = useMemo(() => {
    if (watchLineItems.length === 0) {
      return {
        subtotal: 0,
        oneTimeSubtotal: 0,
        recurringSubtotal: 0,
        totalDiscount: 0,
        tax: 0,
        grandTotal: 0,
        grandTotalWithTax: 0,
        margin: 0,
        marginPercentage: '0.0',
        riskScore: 0,
        riskLevel: 'LOW',
        problematicLines: [],
        approvalRequirement: 'NONE'
      };
    }

    let subtotal = 0;
    let oneTimeSubtotal = 0;
    let recurringSubtotal = 0;
    let totalDiscount = 0;
    let totalCost = 0;
    const problematicLines = [];

    watchLineItems.forEach((item, index) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPrice || 0);
      const disc = Number(item.discountPercentage || 0);
      const cost = Number(item.unitCost || unit * 0.65);
      const allowed = Number(item.allowedDiscount || currentCustomer.tierDiscountLimit || 15);

      const lineGross = qty * unit;
      const lineDiscountAmt = lineGross * (disc / 100);
      const lineNet = lineGross - lineDiscountAmt;
      const lineTotalCost = qty * cost;

      subtotal += lineGross;
      totalDiscount += lineDiscountAmt;
      totalCost += lineTotalCost;

      if (item.isSubscription || item.category === 'SUBSCRIPTIONS') {
        recurringSubtotal += lineNet;
      } else {
        oneTimeSubtotal += lineNet;
      }

      if (disc > allowed) {
        problematicLines.push({
          index,
          name: item.productName || `Line Item ${index + 1}`,
          allowed,
          applied: disc,
          exceeded: (disc - allowed).toFixed(1)
        });
      }
    });

    const grandTotal = subtotal - totalDiscount;
    const tax = grandTotal * 0.18; // 18% GST standard in India
    const grandTotalWithTax = grandTotal + tax;
    const margin = grandTotal - totalCost;
    const marginPercentage = grandTotal > 0 ? ((margin / grandTotal) * 100) : 0;

    // Risk calculation model
    let calculatedRisk = 10;
    if (problematicLines.length > 0) {
      const maxExceeded = Math.max(...problematicLines.map(p => Number(p.exceeded)));
      calculatedRisk += problematicLines.length * 15 + maxExceeded * 2;
    }
    if (marginPercentage < 20) calculatedRisk += 30;
    else if (marginPercentage < 30) calculatedRisk += 15;

    const riskScore = Math.min(Math.round(calculatedRisk), 95);
    const riskLevel = riskScore >= 70 ? 'CRITICAL' : riskScore >= 45 ? 'HIGH' : riskScore >= 20 ? 'MEDIUM' : 'LOW';

    // Approval requirement
    let approvalRequirement = 'NONE';
    if (riskScore >= 45 || problematicLines.length > 0) {
      approvalRequirement = riskScore >= 70 ? 'FINANCE_AND_MANAGER' : 'MANAGER';
    }

    return {
      subtotal,
      oneTimeSubtotal,
      recurringSubtotal,
      totalDiscount,
      tax,
      grandTotal,
      grandTotalWithTax,
      margin,
      marginPercentage: marginPercentage.toFixed(1),
      riskScore,
      riskLevel,
      problematicLines,
      approvalRequirement
    };
  }, [watchLineItems, currentCustomer]);

  // Ranked Upsell & Cross-Sell Suggestions from actual catalog
  const upsellSuggestions = useMemo(() => {
    if (!products || products.length === 0) return [];
    const existingIds = new Set(watchLineItems.map(i => i.productId));
    const suggestions = [];

    const hasHardware = watchLineItems.some(i => i.category === 'HARDWARE');
    const hasServices = watchLineItems.some(i => i.category === 'SERVICES');
    const hasSub = watchLineItems.some(i => i.isSubscription || i.category === 'SUBSCRIPTIONS');

    // If Hardware added without Service, suggest a Service
    if (hasHardware && !hasServices) {
      const serviceProd = products.find(p => p.category === 'SERVICES' && !existingIds.has(p.id) && !dismissedUpsells.includes(p.id));
      if (serviceProd) {
        suggestions.push({
          product: serviceProd,
          reason: 'Frequently paired with hardware: Add implementation & installation service',
          marginImpact: '+35% Margin Boost'
        });
      }
    }

    // If no Subscription added, suggest recurring maintenance / support
    if (!hasSub) {
      const subProd = products.find(p => p.isSubscription && !existingIds.has(p.id) && !dismissedUpsells.includes(p.id));
      if (subProd) {
        suggestions.push({
          product: subProd,
          reason: 'Recurring ARR driver: Attach 12-month SLA & cloud license',
          marginImpact: `+₹${subProd.basePrice.toLocaleString('en-IN')}/mo ARR`
        });
      }
    }

    // Additional cross-sell
    const remainingProd = products.find(p => !existingIds.has(p.id) && !dismissedUpsells.includes(p.id) && !suggestions.some(s => s.product.id === p.id));
    if (remainingProd && suggestions.length < 3) {
      suggestions.push({
        product: remainingProd,
        reason: 'Recommended add-on for this account tier',
        marginImpact: 'High Attach Rate'
      });
    }

    return suggestions;
  }, [products, watchLineItems, dismissedUpsells]);

  const handleAddProduct = (prod) => {
    const existingIndex = watchLineItems.findIndex(i => i.productId === prod.id);
    if (existingIndex >= 0) {
      const existing = watchLineItems[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity: Number(existing.quantity) + 1
      });
      toast.info(`Increased ${prod.name} quantity`);
    } else {
      append({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        category: prod.category,
        quantity: 1,
        unitPrice: prod.basePrice,
        cost: prod.cost,
        discountPercentage: 0,
        isSubscription: prod.isSubscription,
        allowedDiscount: prod.allowedDiscount
      });
      toast.success(`Added ${prod.name} to cart`);
    }
  };

  const createMutation = useMutation({
    mutationFn: async ({ status = 'DRAFT' }) => {
      const token = localStorage.getItem('accessToken');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

      const payload = {
        customerId: selectedCustomerId,
        lineItems: watchLineItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountPercentage: Number(item.discountPercentage)
        }))
      };

      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Creation failed');
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      toast.success(`Quotation ${data.quotationNumber} formulated successfully!`);
      navigate(`/sales/quotations/${data.id}`);
    },
    onError: (err) => toast.error(err.message)
  });

  const filteredCatalogProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotation Workspace</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Formulate commercial line items, govern discounts & calculate deal risk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/quotations')}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Customer Selection Banner (Tier & Governance) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/60">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Account / Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setValue('customerId', e.target.value);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Customer Tier</span>
              <span className="font-bold text-indigo-700">{currentCustomer.tier}</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400 block font-medium">Primary Contact</span>
              <span className="font-semibold text-slate-800">{currentCustomer.contact} ({currentCustomer.email})</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400 block font-medium">Discount Limit</span>
              <span className="font-bold text-emerald-700">&le; {currentCustomer.tierDiscountLimit}% Standard</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Quotation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Product Catalog (3 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Products & Services
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">{filteredCatalogProducts.length} items</span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog or SKU..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {['ALL', 'HARDWARE', 'SERVICES', 'SUBSCRIPTIONS'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCatalogProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No products found in this category.
              </div>
            ) : filteredCatalogProducts.map(prod => {
              const isHw = prod.category === 'HARDWARE';
              const isSvc = prod.category === 'SERVICES';
              const isSub = prod.isSubscription || prod.category === 'SUBSCRIPTIONS';

              return (
                <div 
                  key={prod.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">{prod.name}</span>
                      {isHw && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200 shrink-0">
                          Hardware
                        </span>
                      )}
                      {isSvc && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 shrink-0">
                          Service
                        </span>
                      )}
                      {isSub && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200 shrink-0">
                          Recurring ({prod.interval || 'Monthly'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="font-mono text-[10px]">{prod.sku}</span>
                      <span>&bull;</span>
                      <span className="font-bold text-slate-800">₹{prod.basePrice.toLocaleString('en-IN')}</span>
                      {isHw && (
                        <>
                          <span>&bull;</span>
                          <span className="text-[10px] text-emerald-600 font-medium">Stock: {prod.stock} units</span>
                        </>
                      )}
                      {isSvc && (
                        <>
                          <span>&bull;</span>
                          <span className="text-[10px] text-slate-500">Service SLA</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddProduct(prod)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Quotation Cart (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Quotation Line Items
            </h2>
            <span className="text-xs font-semibold text-slate-500">{fields.length} line(s)</span>
          </div>

          {fields.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs">No items in quotation cart. Select products from the left catalog.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {fields.map((field, index) => {
                const item = watchLineItems[index] || {};
                const qty = Number(item.quantity || 1);
                const price = Number(item.unitPrice || 0);
                const disc = Number(item.discountPercentage || 0);
                const lineTotal = (qty * price) * (1 - disc / 100);

                return (
                  <div key={field.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{item.productName || 'Line Item'}</h4>
                          {item.isSubscription && (
                            <span className="text-[9px] font-bold px-1 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">{item.sku || 'SKU-NONE'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                      {/* Qty with +/- buttons */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qty</label>
                        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => update(index, { ...item, quantity: Math.max(1, qty - 1) })}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full text-center bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => update(index, { ...item, quantity: qty + 1 })}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Unit Price (₹) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      {/* Discount % */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount %</label>
                        <input
                          type="number"
                          step="0.5"
                          max="90"
                          min="0"
                          {...register(`lineItems.${index}.discountPercentage`, { valueAsNumber: true })}
                          className={`w-full p-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 ${
                            disc > (item.allowedDiscount || 15)
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-slate-50 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-semibold">
                      <span className="text-slate-500 text-[11px]">Net Line Total:</span>
                      <span className="text-slate-900 font-bold">₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Deal Intelligence & Summary (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Quotation Summary with Hybrid Billing */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Quotation Summary & Billing Structure
            </h3>

            <div className="space-y-2 text-xs">
              {/* Hybrid Billing Split */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 mb-2">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>One-Time Hardware & Services:</span>
                  <span className="font-bold text-slate-900">₹{calculations.oneTimeSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-purple-700 font-medium">
                  <span>Recurring Subscriptions:</span>
                  <span className="font-bold text-purple-900">₹{calculations.recurringSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                </div>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-slate-800">₹{calculations.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Discount:</span>
                <span className="font-semibold">{calculations.totalDiscount > 0 ? `-₹${calculations.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated GST (18%):</span>
                <span className="font-semibold text-slate-800">₹{calculations.tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Grand Total (Agreed):</span>
                <span className="font-black text-slate-900 text-lg">
                  ₹{calculations.grandTotalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Margin</span>
                  <span className="text-xs font-extrabold text-emerald-900">₹{calculations.margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <span className="text-sm font-black text-emerald-700">{calculations.marginPercentage}%</span>
              </div>
            </div>
          </div>

          {/* 2. Discount Governance & Risk Score */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                Deal Governance Risk
              </h3>
              <RiskBadge score={calculations.riskScore} level={calculations.riskLevel} />
            </div>

            {calculations.problematicLines.length === 0 ? (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs text-emerald-800 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All line discounts within allowed threshold limits.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-rose-700">Discounts Exceeding Governance Rules:</p>
                {calculations.problematicLines.map((line, idx) => (
                  <div key={idx} className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{line.name}</p>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Allowed: {line.allowed}%</span>
                      <span>Applied: <strong className="text-rose-700">{line.applied}%</strong></span>
                      <span className="text-rose-700 font-bold">+{line.exceeded}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approval Routing Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                <span>Approval Status:</span>
                <span className={calculations.approvalRequirement === 'NONE' ? 'text-emerald-600' : 'text-purple-700'}>
                  {calculations.approvalRequirement === 'NONE' ? 'Approval not required' :
                   calculations.approvalRequirement === 'MANAGER' ? 'Manager Approval Required' : 'Finance & Manager Approval Required'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {calculations.approvalRequirement === 'NONE' 
                  ? 'Quotation can be confirmed directly by representative.'
                  : 'Requires managerial review before quotation can be sent to client.'}
              </p>
            </div>
          </div>

          {/* 4. Ranked Upsell & Cross-sell suggestions */}
          {upsellSuggestions.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-2xl border border-indigo-200/80 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Upsell & Cross-Sell Engine
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                  AI Ranked
                </span>
              </div>

              <div className="space-y-2.5">
                {upsellSuggestions.map((s) => (
                  <div key={s.product.id} className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{s.product.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.reason}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                        {s.marginImpact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-900">₹{s.product.basePrice.toLocaleString('en-IN')}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDismissedUpsells([...dismissedUpsells, s.product.id])}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProduct(s.product)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs"
                        >
                          + Add to Quote
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 z-40 flex items-center justify-between shadow-lg">
        <div>
          <button
            type="button"
            disabled={createMutation.isPending || fields.length === 0}
            onClick={() => createMutation.mutate({ status: 'DRAFT' })}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={createMutation.isPending || fields.length === 0}
            onClick={() => createMutation.mutate({ status: 'SENT' })}
            className="px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Preview & Send to Customer
          </button>

          {calculations.approvalRequirement !== 'NONE' ? (
            <button
              type="button"
              disabled={createMutation.isPending || fields.length === 0}
              onClick={() => createMutation.mutate({ status: 'PENDING_APPROVAL' })}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-xs flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Submit for Manager Approval
            </button>
          ) : (
            <button
              type="button"
              disabled={createMutation.isPending || fields.length === 0}
              onClick={() => createMutation.mutate({ status: 'CONFIRMED' })}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-xs"
            >
              Confirm Quotation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
