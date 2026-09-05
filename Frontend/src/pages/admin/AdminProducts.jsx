import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { api } from '../../lib/axios';
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
  Trash2, 
  Edit3, 
  Building2, 
  MapPin
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriceFieldsModalOpen, setIsPriceFieldsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [warehouseStocks, setWarehouseStocks] = useState({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['adminWarehouses'],
    queryFn: () => api.get('/warehouses').then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { data: customerTiers = [] } = useQuery({
    queryKey: ['adminCustomerTiers'],
    queryFn: () => adminApi.getCustomerTiers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const { register, handleSubmit, reset, watch, setValue, control } = useForm({
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
    mutationFn: adminApi.createProduct,
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
    mutationFn: adminApi.updateProduct,
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
    mutationFn: adminApi.deleteProduct,
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

  const handleWarehouseStockChange = (warehouseId, val) => {
    const qty = parseInt(val, 10);
    const safeQty = isNaN(qty) || qty < 0 ? 0 : qty;
    setWarehouseStocks(prev => {
      const updated = { ...prev, [warehouseId]: safeQty };
      const total = Object.values(updated).reduce((sum, n) => sum + (Math.max(0, parseInt(n, 10) || 0)), 0);
      setValue('quantityOnHand', total);
      return updated;
    });
  };

  const totalAllocatedStock = Object.values(warehouseStocks).reduce((sum, v) => sum + (Math.max(0, parseInt(v, 10) || 0)), 0);

  const onSubmit = (data) => {
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

    const warehouseStockPayload = Object.entries(warehouseStocks).map(([warehouseId, quantity]) => ({
      warehouseId,
      quantity: Math.max(0, parseInt(quantity, 10) || 0)
    }));
    const totalWarehouseQty = warehouseStockPayload.reduce((acc, curr) => acc + curr.quantity, 0);

    const payload = {
      name: data.name?.trim(),
      category: data.category || 'Hardware',
      isSubscription: isSub,
      recurringInterval: isSub ? (data.recurringCycle || 'Monthly') : null,
      quantityOnHand: totalWarehouseQty > 0 ? totalWarehouseQty : (isNaN(parsedQty) ? 0 : parsedQty),
      warehouseStock: warehouseStockPayload,
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
    const initialStocks = {};
    warehouses.forEach(w => { initialStocks[w.id] = 0; });
    setWarehouseStocks(initialStocks);

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

    const currentStocks = {};
    warehouses.forEach(w => { currentStocks[w.id] = 0; });
    if (Array.isArray(prod.inventory)) {
      prod.inventory.forEach(inv => {
        if (inv.warehouseId) {
          currentStocks[inv.warehouseId] = inv.availableQuantity || 0;
        }
      });
    }
    setWarehouseStocks(currentStocks);

    let basePrice = '';
    if (prod.pricing && prod.pricing.length > 0 && prod.pricing[0].price !== undefined) {
      basePrice = Number(prod.pricing[0].price);
    } else if (prod.price !== undefined) {
      basePrice = Number(prod.price);
    }

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
  const totalVariants = products.reduce((acc, p) => {
    if (Array.isArray(p.variantAttributes)) return acc + p.variantAttributes.length;
    if (p.variantAttributes && typeof p.variantAttributes === 'object') return acc + Object.keys(p.variantAttributes).length;
    return acc;
  }, 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || name.includes(term) || category.includes(term);
      const matchesCategory = categoryFilter === 'ALL' || category === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto space-y-7 pb-28">
      {/* 1. Page Header (Flat Canvas) */}
      <div className="border-b border-[#EEEAE4] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[34px] sm:text-[40px] font-semibold text-[#171717] tracking-tight leading-tight">
              Product Catalog
            </h1>
            <p className="text-[15px] sm:text-[16px] text-[#6F6B66] mt-1.5 font-normal">
              Every product, variant, warehouse stock level, and price list in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPriceFieldsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-[#6F6B66] hover:text-[#171717] bg-[#FFFFFF] hover:bg-[#F2EFEA] border border-[#E6E1D9] rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-[#96918A]" />
              <span>Price Matrix Rules</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-[14px] font-semibold rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-5 rounded-[14px] border border-[#E6E1D9] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em] block">
                Catalog Items
              </span>
              <p className="text-[22px] sm:text-[24px] font-bold text-[#171717] mt-1">
                {activeCount} <span className="text-[13px] text-[#6F6B66] font-normal">products active</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-[14px] border border-[#E6E1D9] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em] block">
                Customer Price Lists
              </span>
              <p className="text-[22px] sm:text-[24px] font-bold text-[#171717] mt-1">
                {customerTiers.length || 4} Tiers <span className="text-[13px] text-[#6F6B66] font-normal">INR Base Matrix</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-[#EAF5EE] border border-[#C2E2CE] flex items-center justify-center text-[#3F8F63]">
              <Tags className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-[14px] border border-[#E6E1D9] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em] block">
                Variants & Attributes
              </span>
              <p className="text-[22px] sm:text-[24px] font-bold text-[#171717] mt-1">
                {totalVariants} <span className="text-[13px] text-[#6F6B66] font-normal">custom attributes</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#6F6B66]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[440px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
          <input
            type="text"
            placeholder="Search products by name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <label className="text-[13px] font-semibold text-[#6F6B66] whitespace-nowrap">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 px-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[13px] sm:text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Hardware">Hardware & Devices</option>
            <option value="Services">Professional Services</option>
            <option value="Subscriptions">Subscriptions & SaaS</option>
            <option value="Cloud">Cloud & Infrastructure</option>
            <option value="Peripherals">Peripherals</option>
          </select>
        </div>
      </div>

      {/* 3. Product Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8"><LoadingSkeleton rows={5} /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-14">
            <EmptyState 
              icon={Package} 
              title="No products found" 
              description={searchTerm ? "Try adjusting your search criteria." : "Create your first catalog item with tier-based pricing and variants."}
              actionLabel={searchTerm ? undefined : "Add Product"}
              onAction={searchTerm ? undefined : handleOpenNew}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-4 px-6">Product Name</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Inventory Stock</th>
                  <th className="py-4 px-5">Base Price</th>
                  <th className="py-4 px-5">Type</th>
                  <th className="py-4 px-5">Tax / GST</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4] text-[14px]">
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
                      className="hover:bg-[#FBFAF8] transition-colors duration-150 cursor-pointer group h-[74px]"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#171717] text-[15px] sm:text-[16px] group-hover:text-[#D97757] transition-colors">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[12px] text-[#96918A] truncate max-w-[260px] mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 font-medium text-[#6F6B66] whitespace-nowrap text-[14px]">
                        {p.category || 'Hardware'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#171717] font-mono text-[13px] sm:text-[14px]">
                          {pStock} units in stock
                        </div>
                        {p.inventory && p.inventory.filter(i => (i.availableQuantity || 0) > 0).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {p.inventory.filter(i => (i.availableQuantity || 0) > 0).slice(0, 2).map(i => (
                              <span 
                                key={i.id || i.warehouseId} 
                                title={`${i.warehouse?.name || 'Warehouse'}: ${i.availableQuantity} units`}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9] font-mono"
                              >
                                <Building2 className="w-3 h-3 text-[#D97757]" />
                                {i.warehouse?.code?.replace('WH-', '') || 'WH'}: {i.availableQuantity}
                              </span>
                            ))}
                            {p.inventory.filter(i => (i.availableQuantity || 0) > 0).length > 2 && (
                              <span className="text-[11px] text-[#96918A] font-semibold self-center">
                                +{p.inventory.filter(i => (i.availableQuantity || 0) > 0).length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#96918A]">No warehouse stock</span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-semibold text-[#171717] whitespace-nowrap text-[15px]">
                        {pPrice}
                      </td>
                      <td className="py-4 px-5 text-[#6F6B66] whitespace-nowrap text-[13px] sm:text-[14px]">
                        {pUnit}
                      </td>
                      <td className="py-4 px-5 text-[#6F6B66] whitespace-nowrap text-[13px] sm:text-[14px]">
                        {pTax}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EAF5EE] text-[#3F8F63] border border-[#C2E2CE]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F63]"></span>
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleRowClick(p)}
                            className="p-2 text-[#96918A] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, p.id)}
                            disabled={deletingId === p.id}
                            className="p-2 text-[#96918A] hover:text-[#C95757] hover:bg-[#FBEAEA] rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center gap-2.5 text-[13px] text-[#6F6B66]">
          <Info className="w-4 h-4 text-[#D97757] shrink-0" />
          <span>Click any product row to view and modify specifications, inventory warehouse allocation, and variant pricing.</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CREATE / EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171717]/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-[16px] shadow-2xl border border-[#E6E1D9] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 sm:py-5 border-b border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F8E9E3] border border-[#E9B8A7] text-[#D97757] rounded-[10px] flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#171717] tracking-tight">
                    {selectedProduct ? `Edit ${selectedProduct.name}` : 'Create Master Product'}
                  </h2>
                  <p className="text-[13px] text-[#6F6B66]">
                    {selectedProduct ? 'Update product pricing, stock inventory, and variant options' : 'Configure master catalog specifications, pricing, and variant rules'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-[#96918A] hover:text-[#171717] hover:bg-[#EDE8E0] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-[13px] text-[#171717] bg-[#FAF9F6]/40">
              <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* General Info Section */}
                <div className="bg-white border border-[#E6E1D9] rounded-[12px] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-3">
                    <h3 className="text-[13px] font-semibold text-[#171717] uppercase tracking-[0.05em] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#D97757]" /> General Specifications
                    </h3>
                    <span className="text-[12px] text-[#96918A]">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Product Name <span className="text-[#C95757]">*</span>
                      </label>
                      <input 
                        {...register('name', { required: true })} 
                        placeholder="e.g. Enterprise Firewall Appliance"
                        className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-medium text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all" 
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Category <span className="text-[#C95757]">*</span>
                      </label>
                      <select 
                        {...register('category', { required: true })} 
                        className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer transition-all"
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
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Base Price (₹ INR) <span className="text-[#C95757]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A] font-medium text-[13px]">
                          ₹
                        </span>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...register('price', { required: true })} 
                          className="w-full h-11 pl-8 pr-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[14px] font-semibold text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all font-mono" 
                        />
                      </div>
                    </div>

                    {/* Tax Rate Selection */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Tax / GST Rate (%)
                      </label>
                      <select 
                        {...register('tax')} 
                        className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer transition-all"
                      >
                        <option value={18}>18% (Standard GST)</option>
                        <option value={12}>12% (Concessional GST)</option>
                        <option value={5}>5% (Reduced GST)</option>
                        <option value={28}>28% (Higher Rate)</option>
                        <option value={0}>0% (Tax Exempt / Nil)</option>
                      </select>
                    </div>

                    {/* Billing Model */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Billing Model
                      </label>
                      <select 
                        {...register('isSubscription')} 
                        className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer transition-all"
                      >
                        <option value="false">One-Time Purchase</option>
                        <option value="true">Recurring Subscription</option>
                      </select>
                    </div>

                    {/* Conditional: Recurring Interval or Quantity on Hand */}
                    {watchIsSubscription === 'true' ? (
                      <div>
                        <label className="block text-[13px] font-medium text-[#D97757] mb-1.5">
                          Billing Interval (Recurring)
                        </label>
                        <select 
                          {...register('recurringCycle')} 
                          className="w-full h-11 px-3.5 bg-[#F8E9E3]/40 border border-[#E9B8A7] rounded-[9px] text-[13px] font-medium text-[#C96648] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer transition-all"
                        >
                          <option value="Monthly">Monthly Recurring (MRR/ARR)</option>
                          <option value="Quarterly">Quarterly Billing</option>
                          <option value="Yearly">Annual License (ARR)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                          Total Quantity on Hand / Stock
                        </label>
                        <input 
                          type="number" 
                          placeholder="0"
                          {...register('quantityOnHand')} 
                          className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[14px] font-semibold text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all font-mono" 
                        />
                      </div>
                    )}

                    {/* Unit of Measure */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Unit Type
                      </label>
                      <select 
                        {...register('unit')} 
                        className="w-full h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 cursor-pointer transition-all"
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
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Catalog Status
                      </label>
                      <div className="flex items-center gap-2 h-11 px-3.5 bg-[#FAF9F6] border border-[#E6E1D9] rounded-[9px]">
                        <span className="w-2 h-2 rounded-full bg-[#3F8F63]"></span>
                        <span className="text-[13px] font-medium text-[#171717]">Active & Published</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                        Commercial Description & Specifications
                      </label>
                      <textarea 
                        rows={2}
                        {...register('description')} 
                        placeholder="Brief summary of product specifications, warranty terms, and scope..."
                        className="w-full p-3.5 bg-white border border-[#E6E1D9] rounded-[9px] text-[13px] font-normal text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* Warehouse Stock Allocation Section */}
                {watchIsSubscription !== 'true' && (
                  <div className="bg-white border border-[#E6E1D9] rounded-[12px] p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-semibold text-[#171717] uppercase tracking-[0.05em] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#D97757]" /> Warehouse Inventory Breakdown
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
                          {warehouses.length} Active Hubs
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-[#6F6B66] font-mono">
                        Total Stock: <span className="font-bold text-[#D97757]">{totalAllocatedStock}</span> units
                      </span>
                    </div>

                    <p className="text-[12px] text-[#6F6B66]">
                      Specify inventory stock allocated at each warehouse depot location.
                    </p>

                    {warehouses.length === 0 ? (
                      <div className="py-5 text-center text-[13px] text-[#96918A]">
                        No warehouses configured yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {warehouses.map((wh) => (
                          <div key={wh.id} className="p-3.5 bg-[#FAF9F6] border border-[#EEEAE4] rounded-[10px] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-semibold text-[#171717] truncate">{wh.name}</span>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-[#6F6B66] border border-[#E6E1D9] font-semibold shrink-0">{wh.code}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[12px] text-[#96918A] truncate mt-1">
                                <MapPin className="w-3.5 h-3.5 text-[#96918A] shrink-0" />
                                <span className="truncate">{wh.location || 'Hub Location'}</span>
                              </div>
                            </div>
                            <div className="w-28 shrink-0">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={warehouseStocks[wh.id] ?? ''}
                                onChange={(e) => handleWarehouseStockChange(wh.id, e.target.value)}
                                className="w-full text-right px-3 py-2 bg-white border border-[#E6E1D9] rounded-[8px] text-[13px] font-mono font-semibold text-[#171717] focus:outline-none focus:border-[#D97757]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Variants Section */}
                <div className="bg-white border border-[#E6E1D9] rounded-[12px] p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-[#171717] uppercase tracking-[0.05em] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#D97757]" /> Product Variants
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
                        {variantFields.length} Attributes
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => appendVariant({ attribute: '', values: '', extraPrice: '' })} 
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#D97757] hover:text-[#C96648] bg-[#F8E9E3] hover:bg-[#F2D7CD] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Attribute
                    </button>
                  </div>
                  
                  <div className="border border-[#E6E1D9] rounded-[10px] overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#96918A] font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5 w-1/3">Attribute</th>
                          <th className="py-3 px-3.5 w-1/3">Allowed Values</th>
                          <th className="py-3 px-3.5 flex-1">Price Adjustment</th>
                          <th className="py-3 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEEAE4]">
                        {variantFields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-[#96918A] text-[13px]">
                              No variants configured. Click "+ Add Attribute" to specify RAM, Storage, or Capacity options.
                            </td>
                          </tr>
                        ) : variantFields.map((f, i) => (
                          <tr key={f.id} className="hover:bg-[#FBFAF8] transition-colors">
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.attribute`)} 
                                placeholder="e.g. Memory (RAM)" 
                                className="w-full px-3 py-2 font-medium text-[#171717] text-[13px] border border-[#E6E1D9] rounded-[7px] bg-white focus:outline-none focus:border-[#D97757]" 
                              />
                            </td>
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.values`)} 
                                placeholder="e.g. 16GB, 32GB" 
                                className="w-full px-3 py-2 text-[#171717] text-[13px] border border-[#E6E1D9] rounded-[7px] bg-white focus:outline-none focus:border-[#D97757]" 
                              />
                            </td>
                            <td className="p-2.5">
                              <input 
                                {...register(`variants.${i}.extraPrice`)} 
                                placeholder="e.g. +₹4,500" 
                                className="w-full px-3 py-2 font-mono text-[13px] text-[#D97757] font-semibold border border-[#E6E1D9] rounded-[7px] bg-white focus:outline-none focus:border-[#D97757]" 
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeVariant(i)} 
                                className="text-[#96918A] hover:text-[#C95757] p-1.5 rounded-md hover:bg-[#FBEAEA] transition-colors cursor-pointer"
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
            <div className="px-6 py-4.5 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center justify-between shrink-0">
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, selectedProduct.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2.5 text-[13px] font-semibold text-[#C95757] hover:bg-[#FBEAEA] rounded-[9px] transition-colors border border-[#F5C7C7] flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Product</span>
                </button>
              ) : (
                <span className="text-[13px] text-[#6F6B66] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3F8F63] inline-block"></span>
                  Ready to save catalog item
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-[13px] font-semibold text-[#6F6B66] hover:text-[#171717] bg-white border border-[#E6E1D9] hover:bg-[#F2EFEA] rounded-[9px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="productForm"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[9px] shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : (selectedProduct ? 'Update Product' : 'Create Product')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRICE MATRIX RULES MODAL */}
      {/* ========================================================================= */}
      {isPriceFieldsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171717]/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-[16px] shadow-2xl border border-[#E6E1D9] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EAF5EE] border border-[#C2E2CE] text-[#3F8F63] rounded-[10px] flex items-center justify-center">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#171717]">Price Lists & Governance Settings</h3>
                  <p className="text-[13px] text-[#6F6B66]">Customer pricing tiers and standard commercial adjustments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceFieldsModalOpen(false)}
                className="p-2 text-[#96918A] hover:text-[#171717] hover:bg-[#EDE8E0] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-[13px] bg-[#FAF9F6]/40">
              <div className="bg-white p-5 rounded-[12px] border border-[#E6E1D9] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-2.5">
                  <span className="font-semibold text-[#171717] uppercase tracking-[0.05em] text-[12px]">Active Customer Tiers</span>
                  <span className="text-[#3F8F63] font-semibold text-[12px] bg-[#EAF5EE] px-3 py-1 rounded-full border border-[#C2E2CE]">
                    INR (₹) Base Matrix
                  </span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { tier: 'Standard', discount: 'Base List Price (Max 10% Discount Floor)', badge: 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]' },
                    { tier: 'Gold', discount: 'High-Volume Partner (Max 12% Governed Limit)', badge: 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]' },
                    { tier: 'Enterprise', discount: 'Strategic VIP Tier (Max 15% Governed Limit)', badge: 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]' }
                  ].map((t) => (
                    <div key={t.tier} className="flex items-center justify-between p-3.5 rounded-[10px] border border-[#EEEAE4] bg-[#FAF9F6]">
                      <div>
                        <span className="font-semibold text-[#171717] text-[14px] block">{t.tier} Tier</span>
                        <span className="text-[12px] text-[#6F6B66]">{t.discount}</span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${t.badge}`}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-[12px] border border-[#E6E1D9] space-y-2">
                <span className="font-semibold text-[#171717] uppercase tracking-[0.05em] text-[12px]">Formula Matrix</span>
                <p className="text-[#6F6B66] text-[13px] leading-relaxed">
                  Line Total = <code className="bg-[#FAF9F6] border border-[#EEEAE4] px-2 py-0.5 rounded font-mono text-[#D97757]">Quantity × Unit Base Price × (1 - Discount %)</code> + Applicable GST Tax (0%, 5%, 12%, 18%, 28%).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 bg-[#FAF9F6] border-t border-[#E6E1D9] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPriceFieldsModalOpen(false)}
                className="px-4 py-2.5 text-[13px] font-semibold text-[#171717] bg-white hover:bg-[#F2EFEA] border border-[#E6E1D9] rounded-[9px] transition-colors cursor-pointer"
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
