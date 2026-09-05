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
    <div className="bg-white rounded-[14px] border border-[#E6E1D9] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#171717] tracking-tight">
          Product Catalog
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 text-[#96918A] hover:text-[#171717] hover:bg-[#F5F2ED] rounded-lg transition-colors cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#96918A] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="w-full h-10 pl-9 pr-8 rounded-[9px] bg-white border border-[#E6E1D9] text-[13px] sm:text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-2xs"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#6F6B66] bg-[#F5F2ED] hover:bg-[#EDE8E0] border border-[#E6E1D9]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-[#E6E1D9]">
        {isLoading ? (
          <div className="space-y-2.5 p-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-16 bg-[#F5F2ED] rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-[#E6E1D9] rounded-[12px] bg-[#FAF9F6]">
            <Package className="w-7 h-7 text-[#96918A] mx-auto mb-2" />
            <p className="text-[14px] font-semibold text-[#171717]">No products available</p>
            <p className="text-[12px] text-[#6F6B66] mt-1">
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
