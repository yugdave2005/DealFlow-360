import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { adminApi } from '../../features/admin/admin.api';
import { api } from '../../lib/axios';

// Subcomponents
import QuotationHeader from './quotation-builder/QuotationHeader';
import QuotationStepper from './quotation-builder/QuotationStepper';
import CustomerSummary from './quotation-builder/CustomerSummary';
import ProductCatalog from './quotation-builder/ProductCatalog';
import QuotationItemsTable from './quotation-builder/QuotationItemsTable';
import QuotationItemDrawer from './quotation-builder/QuotationItemDrawer';
import RecommendationPreview from './quotation-builder/RecommendationPreview';
import RecommendationsDrawer from './quotation-builder/RecommendationsDrawer';
import QuoteSummary from './quotation-builder/QuoteSummary';
import CustomerDetailsDrawer from './quotation-builder/CustomerDetailsDrawer';
import GovernanceDrawer from './quotation-builder/GovernanceDrawer';
import BillingDrawer from './quotation-builder/BillingDrawer';
import QuotePreviewModal from './quotation-builder/QuotePreviewModal';
import QuotationActionBar from './quotation-builder/QuotationActionBar';

export default function QuotationBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dismissedUpsells, setDismissedUpsells] = useState([]);
  
  // Drawer & Modal open states for Progressive Disclosure
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerIndex, setActiveDrawerIndex] = useState(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [governanceDrawerOpen, setGovernanceDrawerOpen] = useState(false);
  const [billingDrawerOpen, setBillingDrawerOpen] = useState(false);
  const [recommendationsDrawerOpen, setRecommendationsDrawerOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Default validity date (30 days ahead)
  const defaultValidDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);
  const [validUntilDate, setValidUntilDate] = useState(defaultValidDate);

  // Fetch backend customer accounts
  const { data: dbCustomers = [], isLoading: isCustomersLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: () => adminApi.getCustomers().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  // Fetch backend products
  const { data: backendProducts = [], isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const customers = useMemo(() => {
    const rawList = Array.isArray(dbCustomers) ? dbCustomers : (dbCustomers?.data || []);
    if (rawList.length > 0) {
      return rawList.map(c => ({
        id: c.id,
        name: c.companyName || c.name,
        companyName: c.companyName || `${c.name} Corp`,
        tier: c.tier || 'SILVER',
        tierDiscountLimit: c.tier === 'ENTERPRISE' ? 25 : c.tier === 'GOLD' ? 20 : 15,
        contact: c.contactName || c.name || 'Account Rep',
        email: c.email || `contact@${(c.name || 'account').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      }));
    }

    // High quality fallback accounts if no accounts registered yet
    return [
      {
        id: 'cust-seed-1',
        name: 'TechCorp Solutions',
        companyName: 'TechCorp Solutions Pvt Ltd',
        tier: 'ENTERPRISE',
        tierDiscountLimit: 25,
        contact: 'Priya Sharma (VP Technology)',
        email: 'priya.sharma@techcorp.in'
      },
      {
        id: 'cust-seed-2',
        name: 'Nexus FinTech Ltd',
        companyName: 'Nexus FinTech Ltd',
        tier: 'GOLD',
        tierDiscountLimit: 20,
        contact: 'Rahul Mehta (Head of IT)',
        email: 'rahul.mehta@nexusfin.com'
      },
      {
        id: 'cust-seed-3',
        name: 'Global Logistics Hub',
        companyName: 'Global Logistics Hub',
        tier: 'SILVER',
        tierDiscountLimit: 15,
        contact: 'Amit Patel (Operations Director)',
        email: 'amit.patel@globallogistics.com'
      }
    ];
  }, [dbCustomers]);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      setValue('customerId', customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const products = useMemo(() => {
    const rawProds = Array.isArray(backendProducts) ? backendProducts : (backendProducts?.data || []);
    if (rawProds && rawProds.length > 0) {
      return rawProds.map(p => ({
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

  const { register, control, handleSubmit, watch, setValue, formState: { isDirty } } = useForm({
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
    name: 'Standard Account',
    tier: 'Standard',
    tierDiscountLimit: 15,
    contact: 'Primary Contact',
    email: 'billing@clientcorp.com'
  };

  // Dynamic calculations with Hybrid Billing & Deal Governance Risk
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
      const cost = Number(item.unitCost || item.cost || unit * 0.65);
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
    const tax = grandTotal * 0.18;
    const grandTotalWithTax = grandTotal + tax;
    const margin = grandTotal - totalCost;
    const marginPercentage = grandTotal > 0 ? ((margin / grandTotal) * 100) : 0;

    let calculatedRisk = 10;
    if (problematicLines.length > 0) {
      const maxExceeded = Math.max(...problematicLines.map(p => Number(p.exceeded)));
      calculatedRisk += problematicLines.length * 15 + maxExceeded * 2;
    }
    if (marginPercentage < 20) calculatedRisk += 30;
    else if (marginPercentage < 30) calculatedRisk += 15;

    const riskScore = Math.min(Math.round(calculatedRisk), 95);
    const riskLevel = riskScore >= 70 ? 'CRITICAL' : riskScore >= 45 ? 'HIGH' : riskScore >= 20 ? 'MEDIUM' : 'LOW';

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

  // Stepper Current Step
  const currentStep = useMemo(() => {
    if (!selectedCustomerId) return 1;
    if (watchLineItems.length === 0) return 2;
    if (calculations.problematicLines.length > 0) return 3;
    return 4;
  }, [selectedCustomerId, watchLineItems.length, calculations.problematicLines.length]);

  // Ranked Upsell & Cross-Sell Suggestions
  const upsellSuggestions = useMemo(() => {
    if (!products || products.length === 0) return [];
    const existingIds = new Set(watchLineItems.map(i => i.productId));
    const suggestions = [];

    const hasHardware = watchLineItems.some(i => i.category === 'HARDWARE');
    const hasServices = watchLineItems.some(i => i.category === 'SERVICES');
    const hasSub = watchLineItems.some(i => i.isSubscription || i.category === 'SUBSCRIPTIONS');

    if (hasHardware && !hasServices) {
      const serviceProd = products.find(p => p.category === 'SERVICES' && !existingIds.has(p.id) && !dismissedUpsells.includes(p.id));
      if (serviceProd) {
        suggestions.push({
          product: serviceProd,
          reason: 'Frequently paired with hardware: Add implementation & setup service',
          marginImpact: '+35% Margin Boost'
        });
      }
    }

    if (!hasSub) {
      const subProd = products.find(p => p.isSubscription && !existingIds.has(p.id) && !dismissedUpsells.includes(p.id));
      if (subProd) {
        suggestions.push({
          product: subProd,
          reason: 'Recurring ARR driver: Attach 12-month SLA & support license',
          marginImpact: `+₹${subProd.basePrice.toLocaleString('en-IN')}/mo ARR`
        });
      }
    }

    const remainingProd = products.find(p => !existingIds.has(p.id) && !dismissedUpsells.includes(p.id) && !suggestions.some(s => s.product.id === p.id));
    if (remainingProd && suggestions.length < 4) {
      suggestions.push({
        product: remainingProd,
        reason: 'Recommended add-on for this account tier',
        marginImpact: 'High Attach'
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
      toast.info(`Increased ${prod.name} quantity to ${Number(existing.quantity) + 1}`);
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
      toast.success(`Added ${prod.name} to quotation`);
    }
  };

  const handleOpenDrawer = (index) => {
    setActiveDrawerIndex(index);
    setDrawerOpen(true);
  };

  const handleUpdateItem = (index, updatedItem) => {
    update(index, updatedItem);
  };

  const handleRemoveItem = (index) => {
    const item = watchLineItems[index];
    remove(index);
    if (item) toast.info(`Removed ${item.productName || 'item'} from quote`);
  };

  const handleClearAll = () => {
    setValue('lineItems', []);
    toast.info('Cleared quotation cart');
  };

  const createMutation = useMutation({
    mutationFn: async ({ status = 'DRAFT' }) => {
      const payload = {
        customerId: selectedCustomerId,
        lineItems: watchLineItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountPercentage: Number(item.discountPercentage)
        }))
      };

      const res = await api.post('/quotations', payload);
      return res?.data || res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      toast.success(`Quotation ${data?.quotationNumber || 'draft'} formulated successfully!`);
      navigate(`/sales/quotations/${data?.id || ''}`);
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to create quotation');
      }
    }
  });

  const filteredCatalogProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const isApprovalRequired = calculations.approvalRequirement !== 'NONE';

  const handlePrimarySubmit = () => {
    if (isApprovalRequired) {
      createMutation.mutate({ status: 'PENDING_APPROVAL' });
    } else {
      createMutation.mutate({ status: 'SENT' });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 sm:px-8 sm:py-8 space-y-5">
      
      {/* 1. Simple, Compact Page Header */}
      <QuotationHeader
        onSaveDraft={() => createMutation.mutate({ status: 'DRAFT' })}
        onPreview={() => setPreviewModalOpen(true)}
        onSubmit={handlePrimarySubmit}
        isPending={createMutation.isPending}
        hasItems={watchLineItems.length > 0}
        approvalRequired={isApprovalRequired}
      />

      {/* 2. Subtle Workflow Stepper */}
      <QuotationStepper currentStep={currentStep} />

      {/* 3. Simplified Customer Section */}
      <CustomerSummary
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id) => {
          setSelectedCustomerId(id);
          setValue('customerId', id);
        }}
        currentCustomer={currentCustomer}
        validUntilDate={validUntilDate}
        onValidUntilChange={setValidUntilDate}
        onOpenDetails={() => setCustomerDetailsOpen(true)}
      />

      {/* 4. Main 3-Column SaaS Workspace (Balanced: 33% Catalog / 42% Quotation Items / 25% Summary) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Product Catalog (col-span-4) */}
        <div className="xl:col-span-4 lg:col-span-4 col-span-12">
          <ProductCatalog
            products={filteredCatalogProducts}
            searchTerm={productSearch}
            onSearchChange={setProductSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddProduct={handleAddProduct}
            onRefresh={refetchProducts}
            isLoading={isProductsLoading}
          />
        </div>

        {/* Center Column: Quotation Items Table (col-span-5 - Main Focus) */}
        <div className="xl:col-span-5 lg:col-span-5 col-span-12 space-y-4">
          <QuotationItemsTable
            items={watchLineItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            onOpenDrawer={handleOpenDrawer}
            tierDiscountLimit={currentCustomer.tierDiscountLimit}
            onClearAll={handleClearAll}
          />

          {/* Compact Recommendation Section */}
          <RecommendationPreview
            suggestions={upsellSuggestions}
            onAddSuggestion={handleAddProduct}
            onOpenAllRecommendations={() => setRecommendationsDrawerOpen(true)}
          />
        </div>

        {/* Right Column: Clean Sticky Summary & Governance (col-span-3) */}
        <div className="xl:col-span-3 lg:col-span-3 col-span-12">
          <QuoteSummary
            calculations={calculations}
            onOpenBilling={() => setBillingDrawerOpen(true)}
            onOpenGovernance={() => setGovernanceDrawerOpen(true)}
          />
        </div>

      </div>

      {/* 5. Sticky Action Bar */}
      <QuotationActionBar
        onSaveDraft={() => createMutation.mutate({ status: 'DRAFT' })}
        onPreview={() => setPreviewModalOpen(true)}
        onSubmit={handlePrimarySubmit}
        isPending={createMutation.isPending}
        hasItems={watchLineItems.length > 0}
        approvalRequired={isApprovalRequired}
        isDirty={isDirty}
      />

      {/* 6. Customer Details Drawer */}
      <CustomerDetailsDrawer
        isOpen={customerDetailsOpen}
        onClose={() => setCustomerDetailsOpen(false)}
        customer={currentCustomer}
      />

      {/* 7. Quotation Item Edit Drawer */}
      <QuotationItemDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={activeDrawerIndex !== null ? watchLineItems[activeDrawerIndex] : null}
        index={activeDrawerIndex}
        onSave={handleUpdateItem}
        tierDiscountLimit={currentCustomer.tierDiscountLimit}
      />

      {/* 8. Governance Drawer */}
      <GovernanceDrawer
        isOpen={governanceDrawerOpen}
        onClose={() => setGovernanceDrawerOpen(false)}
        calculations={calculations}
      />

      {/* 9. Billing Schedule Drawer */}
      <BillingDrawer
        isOpen={billingDrawerOpen}
        onClose={() => setBillingDrawerOpen(false)}
        oneTimeSubtotal={calculations.oneTimeSubtotal}
        recurringSubtotal={calculations.recurringSubtotal}
        items={watchLineItems}
      />

      {/* 10. Recommendations Drawer */}
      <RecommendationsDrawer
        isOpen={recommendationsDrawerOpen}
        onClose={() => setRecommendationsDrawerOpen(false)}
        suggestions={upsellSuggestions}
        onAddSuggestion={handleAddProduct}
      />

      {/* 11. Customer-Facing Preview Modal */}
      <QuotePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        currentCustomer={currentCustomer}
        items={watchLineItems}
        calculations={calculations}
        validUntilDate={validUntilDate}
      />

    </div>
  );
}
