import React from 'react';
import { Search, X, Package, RefreshCw } from 'lucide-react';
import ProductCatalogItem from './ProductCatalogItem';

export default function ProductCatalog({
  products = [],
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAddProduct,
  onRefresh,
  isLoading
}) {
  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'HARDWARE', label: 'Hardware' },
    { id: 'SERVICES', label: 'Services' },
    { id: 'SUBSCRIPTIONS', label: 'Subscriptions' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
          Product Catalog
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-200">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <Package className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">No products available</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Products can be configured in Product Catalog.
            </p>
          </div>
        ) : (
          products.map(prod => (
            <ProductCatalogItem
              key={prod.id}
              product={prod}
              onAdd={onAddProduct}
            />
          ))
        )}
      </div>
    </div>
  );
}
