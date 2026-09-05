import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
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
  Percent
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data).catch(() => [])
  });

  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      isSubscription: 'false',
      quantityOnHand: 0,
      variants: [{ attribute: '', values: '', extraPrice: '' }],
      pricelists: [{ tier: 'Bronze', currency: 'USD', rule: 'Standard Price' }]
    }
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });
  const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({ control, name: 'pricelists' });

  const watchIsSubscription = watch('isSubscription');

  const createMutation = useMutation({
    mutationFn: adminApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Product created successfully.');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.message || 'Failed to create product')
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      name: data.name,
      category: data.category,
      type: data.isSubscription === 'true' ? 'SUBSCRIPTION' : 'ONE_TIME',
      stock: parseInt(data.quantityOnHand, 10) || 0,
      pricing: [{ price: parseFloat(data.price) || 0, currency: 'USD' }]
    });
  };

  const handleOpenNew = () => {
    reset({
      name: '', category: '', price: '', unit: 'Each', description: '', tax: 18,
      isSubscription: 'false', recurringCycle: 'Monthly', quantityOnHand: 0,
      variants: [{ attribute: '', values: '', extraPrice: '' }],
      pricelists: [{ tier: 'Bronze', currency: 'USD', rule: 'Price, no adjustment' }]
    });
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (prod) => {
    // Open in edit mode
    setSelectedProduct(prod);
    reset({
      name: prod.name,
      category: prod.category || 'Hardware',
      price: prod.pricing?.[0]?.price || 0,
      unit: prod.type === 'SUBSCRIPTION' ? 'Recurring' : (prod.unit || 'Each'),
      description: prod.description || '',
      tax: parseInt(prod.tax, 10) || 18,
      isSubscription: prod.type === 'SUBSCRIPTION' ? 'true' : 'false',
      recurringCycle: prod.recurringCycle || 'Monthly',
      quantityOnHand: prod.stock || 0,
      variants: prod.variantsList || [{ attribute: 'RAM', values: '8GB, 16GB', extraPrice: '+$100' }],
      pricelists: prod.pricelistsList || [{ tier: 'Bronze', currency: 'USD', rule: 'Price, no adjustment' }]
    });
    setIsModalOpen(true);
  };

  const mockData = [
    { 
      id: '1', name: 'ThinkPad X1 Carbon Gen 11', category: 'Hardware', type: 'ONE_TIME', 
      variants: '3 (CPU, RAM, Display)', priceStr: '$1,650', unit: 'Each', tax: '18%', status: 'Active',
      description: 'Ultralight premium business laptop featuring 13th Gen Intel Core processors and 14" OLED panel.', stock: 350,
      pricing: [{ price: 1650 }],
      variantsList: [
        { attribute: 'CPU', values: 'i5, i7', extraPrice: '+$200' },
        { attribute: 'RAM', values: '16GB, 32GB', extraPrice: '+$120' },
        { attribute: 'Display', values: 'WUXGA, OLED', extraPrice: '+$150' }
      ],
      pricelistsList: [
        { tier: 'General', currency: 'USD', rule: 'List Price' },
        { tier: 'Gold', currency: 'USD', rule: 'List Price minus 15 percent' },
        { tier: 'General', currency: 'INR', rule: 'MRP Conversion' }
      ]
    },
    { 
      id: '2', name: 'Microsoft 365 E5 Enterprise', category: 'Software', type: 'SUBSCRIPTION', recurringCycle: 'Yearly',
      variants: '1 (License Pool)', priceStr: '$38.00/usr', unit: 'Recurring', tax: '18%', status: 'Active',
      description: 'Comprehensive productivity suite featuring advanced security, compliance, phone system, and Power BI Pro.', stock: 9999,
      pricing: [{ price: 38 }],
      variantsList: [
        { attribute: 'License Pool', values: '1-99, 100-499, 500+', extraPrice: '-$2 for 500+' }
      ],
      pricelistsList: [
        { tier: 'General', currency: 'USD', rule: 'List Price' },
        { tier: 'Silver', currency: 'USD', rule: 'List Price minus 5 percent' }
      ]
    },
    { 
      id: '3', name: 'AWS Cloud Architecture Audit', category: 'Services', type: 'ONE_TIME', 
      variants: '2 (Scope)', priceStr: '$5,000', unit: 'Project', tax: '18%', status: 'Active',
      description: 'End-to-End infrastructure audit focusing on cost-optimization, security baselines, and reliability.', stock: 10,
      pricing: [{ price: 5000 }],
      variantsList: [
        { attribute: 'Scope', values: 'Single AWS Account, Multi-Org AWS', extraPrice: '+$3,500' }
      ],
      pricelistsList: [
        { tier: 'Standard', currency: 'USD', rule: 'List Price' }
      ]
    },
    { 
      id: '4', name: 'Palo Alto PA-400 Series NGFW', category: 'Hardware', type: 'ONE_TIME', 
      variants: '4 (Throughput/Model)', priceStr: '$4,200', unit: 'Each', tax: '18%', status: 'Active',
      description: 'Next-Generation Firewall appliance offering zero-trust network security for enterprise branch offices.', stock: 42,
      pricing: [{ price: 4200 }],
      variantsList: [
        { attribute: 'Model', values: 'PA-410, PA-440, PA-460', extraPrice: '+$1,500 per tier' },
        { attribute: 'HA Cluster', values: 'Standalone, Active-Passive', extraPrice: '+$3,000' }
      ],
      pricelistsList: [
        { tier: 'Standard', currency: 'USD', rule: 'List Price' },
        { tier: 'Gold', currency: 'USD', rule: 'Price minus 20 percent base' }
      ]
    },
    { 
      id: '5', name: 'Managed IT Support Helpdesk', category: 'Support', type: 'SUBSCRIPTION', recurringCycle: 'Monthly',
      variants: '2 (SLA Tier)', priceStr: '$150/usr', unit: 'Recurring', tax: '18%', status: 'Active',
      description: '24/7/365 priority IT support, comprehensive workstation monitoring, and MDM solutions.', stock: 5000,
      pricing: [{ price: 150 }],
      variantsList: [
        { attribute: 'SLA Tier', values: 'Silver (8x5), Gold (24x7)', extraPrice: '+$50/usr' }
      ],
      pricelistsList: [
        { tier: 'Standard', currency: 'USD', rule: 'List Price' },
        { tier: 'Standard', currency: 'INR', rule: 'Adjusted MSRP' }
      ]
    },
    { 
      id: '6', name: 'Herman Miller Aeron Chair', category: 'Office', type: 'ONE_TIME', 
      variants: '3 (Size, Color)', priceStr: '$1,299', unit: 'Each', tax: '18%', status: 'Active',
      description: 'Ergonomic office seating providing superior posture support and suspension material.', stock: 112,
      pricing: [{ price: 1299 }],
      variantsList: [
        { attribute: 'Size', values: 'A (Small), B (Medium), C (Large)', extraPrice: '+$0' },
        { attribute: 'Color', values: 'Graphite, Carbon, Mineral', extraPrice: '+$215 for Mineral' }
      ],
      pricelistsList: [
        { tier: 'Standard', currency: 'USD', rule: 'List Price' },
        { tier: 'Silver', currency: 'USD', rule: 'Price minus 5 percent base' }
      ]
    },
    { 
      id: '7', name: 'Oracle to PostgreSQL Migration', category: 'Services', type: 'ONE_TIME', 
      variants: '3 (DB Size)', priceStr: '$12,500', unit: 'Project', tax: '18%', status: 'Active',
      description: 'Turnkey database migration service converting Oracle schemas, PL/SQL and data to modern PostgreSQL.', stock: 5,
      pricing: [{ price: 12500 }],
      variantsList: [
        { attribute: 'Database Size', values: '<500GB, 500GB-2TB, >2TB', extraPrice: '+$4,500 per tier' }
      ],
      pricelistsList: [
        { tier: 'General', currency: 'USD', rule: 'List Price' },
        { tier: 'Gold', currency: 'USD', rule: 'Custom Enterprise Discount' }
      ]
    }
  ];

  // Mock stats
  const activeCount = products.length > 0 ? products.length : mockData.length;
  const archivedCount = 3;
  const totalVariants = activeCount * 3 - 4; // Mock math based on dummy variants count

  const filteredProducts = (products.length > 0 ? products : mockData).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Manage Price fields
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
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
            <p className="text-sm font-medium text-slate-600"><span className="text-xl font-bold text-slate-900 mr-2">{activeCount}</span> active, {archivedCount} archived</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-emerald-500" /> Pricelists
            </h3>
            <p className="text-sm font-medium text-slate-600"><span className="text-xl font-bold text-slate-900 mr-2">3</span> tiers, <span className="font-bold text-slate-900 mx-1">2</span> Currencies</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" /> Variants
            </h3>
            <p className="text-sm font-medium text-slate-600"><span className="text-xl font-bold text-slate-900 mr-2">{totalVariants > 0 ? totalVariants : 340}</span> SKUs across all products</p>
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
            <EmptyState icon={Package} title="No products found" description="Adjust your filters or create a new product." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Variants</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Unit</th>
                  <th className="py-3.5 px-4 font-semibold">Tax</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const pPrice = p.priceStr || `$${p.pricing?.[0]?.price || '0'}`;
                  const pVariants = p.variants || '-';
                  const pUnit = p.unit || (p.type === 'SUBSCRIPTION' ? 'Recurring' : 'Each');
                  const pTax = p.tax || '18%';

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleRowClick(p)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {p.name}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">{p.category || 'Hardware'}</td>
                      <td className="py-4 px-4 text-slate-500 text-xs font-medium bg-slate-50/50 rounded-md inline-block mt-2 ml-4 mb-2">{pVariants}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{pPrice}</td>
                      <td className="py-4 px-4 text-slate-500 text-xs">{pUnit}</td>
                      <td className="py-4 px-4 text-slate-600 text-xs">{pTax}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-amber-50/50 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-800 font-medium">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Click a product row to open general info, variants and tier/currency price lists.</span>
        </div>
      </div>

      {/* Modal Slide-over for "Product and pricelist" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Product Master Data</span>
                <h2 className="text-xl font-bold">{selectedProduct ? selectedProduct.name : 'Product and pricelist'}</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors focus:outline-none">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 bg-slate-50 custom-scrollbar">
              <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* General Info Section */}
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> General Info
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product name</label>
                      <input {...register('name', { required: true })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tax %</label>
                      <input type="number" {...register('tax')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <input {...register('category', { required: true })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subscription</label>
                      <select {...register('isSubscription')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors">
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Base Price ($)</label>
                      <input type="number" step="0.01" {...register('price', { required: true })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    {watchIsSubscription === 'true' ? (
                      <div>
                        <label className="block text-xs font-bold text-indigo-700 mb-1">Recurring Interval</label>
                        <select {...register('recurringCycle')} className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-semibold text-indigo-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors">
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    ) : (
                      <div></div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
                      <input {...register('unit')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quantity on hand (Integer)</label>
                      <input type="number" {...register('quantityOnHand')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                      <input {...register('description')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                  </div>
                </section>

                {/* Product Variants Section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Product Variants
                    </h3>
                    <button type="button" onClick={() => appendVariant({ attribute: '', values: '', extraPrice: '' })} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-indigo-100">
                      + Add Attribute
                    </button>
                  </div>
                  <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-xs ring-1 ring-slate-950/5">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-bold text-slate-700 w-1/3 text-xs uppercase tracking-wider">Attribute</th>
                          <th className="py-3 px-4 font-bold text-slate-700 w-1/3 text-xs uppercase tracking-wider">Values</th>
                          <th className="py-3 px-4 font-bold text-slate-700 flex-1 text-xs uppercase tracking-wider">Extra price</th>
                          <th className="py-3 px-4 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variantFields.length === 0 ? (
                          <tr><td colSpan={4} className="py-6 text-center text-slate-400 text-sm font-medium">No variants configured</td></tr>
                        ) : variantFields.map((f, i) => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-2"><input {...register(`variants.${i}.attribute`)} placeholder="e.g. Color" className="w-full px-3 py-2 font-medium text-slate-700 text-sm border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent placeholder-slate-400" /></td>
                            <td className="p-2"><input {...register(`variants.${i}.values`)} placeholder="e.g. Blue, Black" className="w-full px-3 py-2 text-slate-700 text-sm border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent placeholder-slate-400" /></td>
                            <td className="p-2"><input {...register(`variants.${i}.extraPrice`)} placeholder="e.g. +$10" className="w-full px-3 py-2 font-mono text-xs text-indigo-700 font-bold border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent placeholder-indigo-300" /></td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removeVariant(i)} className="text-slate-300 hover:text-rose-600 focus:outline-none p-1.5 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Pricelists Section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4" /> Pricelists
                    </h3>
                    <button type="button" onClick={() => appendPrice({ tier: '', currency: '', rule: '' })} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-indigo-100">
                      + Add Price Rule
                    </button>
                  </div>
                  <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-xs ring-1 ring-slate-950/5">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-bold text-slate-700 w-1/4 text-xs uppercase tracking-wider">Tier</th>
                          <th className="py-3 px-4 font-bold text-slate-700 w-1/4 text-xs uppercase tracking-wider">Currency</th>
                          <th className="py-3 px-4 font-bold text-slate-700 flex-1 text-xs uppercase tracking-wider">Price Rule</th>
                          <th className="py-3 px-4 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {priceFields.length === 0 ? (
                          <tr><td colSpan={4} className="py-6 text-center text-slate-400 text-sm font-medium">No pricelists configured</td></tr>
                        ) : priceFields.map((f, i) => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-2">
                              <select {...register(`pricelists.${i}.tier`)} className="w-full px-3 py-2 font-bold text-slate-800 text-sm border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent cursor-pointer">
                                <option>General</option>
                                <option>Standard</option>
                                <option className="text-amber-700">Bronze</option>
                                <option className="text-slate-500">Silver</option>
                                <option className="text-yellow-600">Gold</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select {...register(`pricelists.${i}.currency`)} className="w-full px-3 py-2 font-mono text-xs font-bold text-slate-700 border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent cursor-pointer">
                                <option>USD</option>
                                <option>USD/EUR</option>
                                <option>INR</option>
                              </select>
                            </td>
                            <td className="p-2"><input {...register(`pricelists.${i}.rule`)} placeholder="e.g. Price minus 10 percent base" className="w-full px-3 py-2 text-sm text-slate-700 font-medium border-0 focus:ring-1 focus:ring-indigo-500 rounded-md bg-transparent placeholder-slate-400" /></td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removePrice(i)} className="text-slate-300 hover:text-rose-600 focus:outline-none p-1.5 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                
                {/* Note */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl flex gap-3 text-xs text-amber-900 shadow-sm mt-4">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium">Product details should be filled accurately for synchronization with ERP.</p>
                    {watchIsSubscription === 'true' && <p className="font-bold text-amber-950 mt-1">Recurring order with this product will be invoiced at the beginning of the selected period.</p>}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 rounded-xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {createMutation.isPending ? 'Saving...' : 'Save Product Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
