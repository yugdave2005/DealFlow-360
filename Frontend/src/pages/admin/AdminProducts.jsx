import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../features/products/products.api';
import { pricingApi } from '../../features/pricing/pricing.api';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Package, 
  Search, 
  Plus, 
  Settings2, 
  Layers, 
  Tags, 
  Info, 
  X, 
  Save, 
  Box, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => productsApi.getProducts().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      name: '',
      category: 'Hardware',
      price: '',
      tax: 18,
      unit: 'Each',
      isSubscription: 'false',
      recurringCycle: 'Monthly',
      quantityOnHand: 0,
      description: '',
      variants: [{ attribute: '', values: '', extraPrice: '' }]
    }
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });
  const watchIsSubscription = watch('isSubscription');

  // Mutation: Create Product
  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProductsList'] });
      toast.success('Product created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create product')
  });

  // Mutation: Update Product
  const updateMutation = useMutation({
    mutationFn: productsApi.updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProductsList'] });
      toast.success('Product updated successfully');
      setIsModalOpen(false);
      setSelectedProduct(null);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update product')
  });

  // Mutation: Delete Product
  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProductsList'] });
      toast.success('Product deleted successfully');
      setDeletingId(null);
      if (selectedProduct) {
        setIsModalOpen(false);
        setSelectedProduct(null);
      }
    },
    onError: (err) => {
      setDeletingId(null);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete product');
    }
  });

  const onSubmit = (data) => {
    // Filter and sanitize variant attributes
    const cleanVariants = (data.variants || [])
      .filter(v => v.attribute && v.attribute.trim())
      .map(v => ({
        attribute: v.attribute.trim(),
        values: v.values?.trim() || '',
        extraPrice: v.extraPrice?.trim() || ''
      }));

    const parsedPrice = parseFloat(data.price);
    const parsedQty = parseInt(data.quantityOnHand, 10);
    const isSub = data.isSubscription === 'true' || data.isSubscription === true;

    const payload = {
      name: data.name?.trim(),
      category: data.category || 'Hardware',
      isSubscription: isSub,
      recurringInterval: isSub ? (data.recurringCycle || 'Monthly') : null,
      quantityOnHand: isNaN(parsedQty) ? 0 : parsedQty,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      tax: parseInt(data.tax, 10) || 18,
      unit: data.unit || 'Each',
      description: data.description || '',
      variantAttributes: cleanVariants
    };

    if (selectedProduct && selectedProduct.id) {
      updateMutation.mutate({ id: selectedProduct.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenNew = () => {
    setSelectedProduct(null);
    reset({
      name: '',
      category: 'Hardware',
      price: '',
      tax: 18,
      unit: 'Each',
      isSubscription: 'false',
      recurringCycle: 'Monthly',
      quantityOnHand: 0,
      description: '',
      variants: [{ attribute: '', values: '', extraPrice: '' }]
    });
    setIsModalOpen(true);
  };

  const handleRowClick = (prod) => {
    setSelectedProduct(prod);

    // Extract base price correctly
    let basePrice = '';
    if (prod.pricing && prod.pricing.length > 0 && prod.pricing[0].price !== undefined) {
      basePrice = Number(prod.pricing[0].price);
    } else if (prod.price !== undefined) {
      basePrice = Number(prod.price);
    }

    // Extract variant attributes
    let parsedVariants = [{ attribute: '', values: '', extraPrice: '' }];
    if (Array.isArray(prod.variantAttributes) && prod.variantAttributes.length > 0) {
      parsedVariants = prod.variantAttributes;
    } else if (prod.variantAttributes && typeof prod.variantAttributes === 'object') {
      parsedVariants = Object.entries(prod.variantAttributes).map(([attr, val]) => ({
        attribute: attr,
        values: Array.isArray(val) ? val.join(', ') : String(val),
        extraPrice: ''
      }));
    }

    reset({
      name: prod.name || '',
      category: prod.category || 'Hardware',
      price: basePrice !== '' ? basePrice : 0,
      tax: parseInt(prod.tax, 10) || 18,
      unit: prod.unit || (prod.isSubscription ? 'User/Month' : 'Each'),
      isSubscription: prod.isSubscription ? 'true' : 'false',
      recurringCycle: prod.recurringInterval || 'Monthly',
      quantityOnHand: prod.quantityOnHand ?? 0,
      description: prod.description || '',
      variants: parsedVariants
    });
    setIsModalOpen(true);
  };

  const handleDelete = (e, prodId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product?')) {
      setDeletingId(prodId);
      deleteMutation.mutate(prodId);
    }
  };

  const activeCount = products.length;
  const archivedCount = 0;
  const totalVariants = products.reduce((acc, p) => {
    if (Array.isArray(p.variantAttributes)) return acc + p.variantAttributes.length;
    if (p.variantAttributes && typeof p.variantAttributes === 'object') return acc + Object.keys(p.variantAttributes).length;
    return acc;
  }, 0);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isPriceFieldsModalOpen, setIsPriceFieldsModalOpen] = useState(false);

  const { data: customerTiers = [] } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => pricingApi.getCustomerTiers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
              <p className="text-sm text-slate-500 mt-0.5">Every product, variant, and price list in one place.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPriceFieldsModalOpen(true)}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            Manage Price fields
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-indigo-500" /> Total Products
            </h3>
            <p className="text-sm font-medium text-slate-600">
              <span className="text-xl font-bold text-slate-900 mr-2">{activeCount}</span> active in catalog
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-emerald-500" /> Customer Price Lists
            </h3>
            <p className="text-sm font-medium text-slate-600">
              <span className="text-xl font-bold text-slate-900 mr-2">{customerTiers.length || 4} Tiers</span> INR Base Currency
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" /> Variants & Attributes
            </h3>
            <p className="text-sm font-medium text-slate-600">
              <span className="text-xl font-bold text-slate-900 mr-2">{totalVariants}</span> attributes active
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wider border border-indigo-200 uppercase">
              Products
            </span>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-2xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              icon={Package} 
              title="No products in catalog yet" 
              description="Create your first catalog item with tier-based pricing and variants."
              actionLabel="Add Product"
              onAction={handleOpenNew}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Inventory Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Base Price</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Tax</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const priceNum = Number(p.pricing?.[0]?.price ?? p.price ?? 0);
                  const pPrice = `₹${priceNum.toLocaleString('en-IN')}`;
                  const pStock = p.quantityOnHand ?? 0;
                  const pUnit = p.isSubscription ? `Recurring (${p.recurringInterval || 'Monthly'})` : 'One-Time';
                  const pTax = p.tax ? `${p.tax}%` : '18%';

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleRowClick(p)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">{p.category || 'Hardware'}</td>
                      <td className="py-4 px-4 text-slate-600 text-xs font-medium font-mono">
                        {pStock} units in stock
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">{pPrice}</td>
                      <td className="py-4 px-4 text-slate-500 text-xs">{pUnit}</td>
                      <td className="py-4 px-4 text-slate-600 text-xs">{pTax}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRowClick(p); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, p.id)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-indigo-50/50 border-t border-indigo-100 flex items-center gap-2 text-xs text-indigo-800 font-medium">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Click any product row or the edit icon to view and modify specifications, pricing, and variant rules.</span>
        </div>
      </div>

      {/* Modal Dialog for "Product and pricelist" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-2xs shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {selectedProduct ? `Edit ${selectedProduct.name}` : 'Create Master Product'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProduct ? 'Update product pricing, stock inventory, and variant options' : 'Configure master catalog specifications, pricing, and variant rules'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50/50 custom-scrollbar">
              <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* General Info Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-600" /> General Specifications
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Product Name <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        {...register('name', { required: true })} 
                        placeholder="e.g. Dell Latitude 5450"
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs" 
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select 
                        {...register('category', { required: true })} 
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="Hardware">Hardware & Devices</option>
                        <option value="Services">Professional Services</option>
                        <option value="Subscriptions">Software & Subscriptions</option>
                        <option value="Cloud">Cloud & Infrastructure</option>
                        <option value="Peripherals">Peripherals & Accessories</option>
                      </select>
                    </div>

                    {/* Base Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Base Price (₹ INR) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...register('price', { required: true })} 
                          className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs" 
                        />
                      </div>
                    </div>

                    {/* Tax Rate Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tax / GST Rate (%)
                      </label>
                      <select 
                        {...register('tax')} 
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all shadow-2xs"
                      >
                        <option value={18}>18% (Standard GST)</option>
                        <option value={12}>12% (Concessional GST)</option>
                        <option value={5}>5% (Reduced GST)</option>
                        <option value={28}>28% (Luxury / Higher Rate)</option>
                        <option value={0}>0% (Tax Exempt / Nil)</option>
                      </select>
                    </div>

                    {/* Billing Model */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Billing Model
                      </label>
                      <select 
                        {...register('isSubscription')} 
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="false">One-Time Purchase</option>
                        <option value="true">Recurring Subscription</option>
                      </select>
                    </div>

                    {/* Conditional: Recurring Interval or Quantity on Hand */}
                    {watchIsSubscription === 'true' ? (
                      <div>
                        <label className="block text-xs font-bold text-purple-700 mb-1.5">
                          Billing Interval (Recurring)
                        </label>
                        <select 
                          {...register('recurringCycle')} 
                          className="w-full px-3.5 py-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer transition-all shadow-2xs"
                        >
                          <option value="Monthly">Monthly Recurring (MRR/ARR)</option>
                          <option value="Quarterly">Quarterly Billing</option>
                          <option value="Yearly">Annual License (ARR)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Quantity on Hand / Stock
                        </label>
                        <input 
                          type="number" 
                          placeholder="0"
                          {...register('quantityOnHand')} 
                          className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs" 
                        />
                      </div>
                    )}

                    {/* Unit of Measure */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Unit Type
                      </label>
                      <select 
                        {...register('unit')} 
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="Each">Each (Units)</option>
                        <option value="User/Month">Per User / Month</option>
                        <option value="License/Year">Per License / Year</option>
                        <option value="Hour">Per Hour (Consulting)</option>
                        <option value="Pack">Pack / Bundle</option>
                      </select>
                    </div>

                    {/* Product Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Catalog Status
                      </label>
                      <div className="flex items-center gap-2 h-[42px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span className="text-xs font-bold text-slate-800">Active & Published</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Commercial Description & Specifications
                      </label>
                      <textarea 
                        rows={2}
                        {...register('description')} 
                        placeholder="Brief summary of product specifications, warranty terms, and scope..."
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs" 
                      />
                    </div>
                  </div>
                </div>

                {/* Product Variants Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" /> Product Variants
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {variantFields.length} Attributes
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => appendVariant({ attribute: '', values: '', extraPrice: '' })} 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors border border-indigo-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Attribute
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3.5 w-1/3">Attribute</th>
                          <th className="py-2.5 px-3.5 w-1/3">Allowed Values</th>
                          <th className="py-2.5 px-3.5 flex-1">Price Adjustment</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variantFields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                              No variants configured. Click "+ Add Attribute" to add RAM, Storage, or Color options.
                            </td>
                          </tr>
                        ) : variantFields.map((f, i) => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.attribute`)} 
                                placeholder="e.g. Memory (RAM)" 
                                className="w-full px-3 py-1.5 font-semibold text-slate-800 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                              />
                            </td>
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.values`)} 
                                placeholder="e.g. 16GB, 32GB, 64GB" 
                                className="w-full px-3 py-1.5 text-slate-800 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                              />
                            </td>
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.extraPrice`)} 
                                placeholder="e.g. +₹4,500" 
                                className="w-full px-3 py-1.5 font-mono text-xs text-indigo-700 font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeVariant(i)} 
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, selectedProduct.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Master catalog item will be saved immediately
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="productForm"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : (selectedProduct ? 'Update Product' : 'Create Product')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Dialog for "Manage Price fields" */}
      {isPriceFieldsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-2xs">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Price Lists & Currency Settings</h3>
                  <p className="text-xs text-slate-500">Configured customer pricing tiers and standard commercial adjustments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceFieldsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Active Customer Tiers</span>
                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    INR (₹) Base Matrix
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { tier: 'Bronze', discount: 'Base List Price (0% Discount)', color: 'border-amber-200 bg-amber-50/50 text-amber-800' },
                    { tier: 'Silver', discount: 'Standard Tier (-5% Automated Margin Limit)', color: 'border-slate-200 bg-slate-50 text-slate-800' },
                    { tier: 'Gold', discount: 'High-Volume Partner (-10% Discount Limit)', color: 'border-yellow-200 bg-yellow-50/50 text-yellow-800' },
                    { tier: 'Enterprise', discount: 'Strategic VIP Tier (-15% Governed Limit)', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-800' }
                  ].map((t) => (
                    <div key={t.tier} className={`flex items-center justify-between p-3 rounded-xl border ${t.color}`}>
                      <div>
                        <span className="font-bold block">{t.tier} Tier</span>
                        <span className="text-[11px] opacity-80">{t.discount}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">System Price Calculation Formula</span>
                <p className="text-slate-600 text-xs">
                  Line Total = <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700">Quantity × Unit Base Price × (1 - Discount %)</code> + Applicable GST Tax (0%, 5%, 12%, 18%, 28%).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPriceFieldsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
