import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Building2, 
  Mail, 
  ChevronRight, 
  X,
  FileText, 
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
  UserPlus,
  Lock
} from 'lucide-react';
import { adminApi } from '../../features/admin/admin.api';
import { useAuth } from '../../context/AuthContext';
import RiskBadge from '../../components/common/RiskBadge';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function Customers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SALES_MANAGER';

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // 1. Fetch Customers
  const { 
    data: customerAccounts = [], 
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ['adminCustomersList'],
    queryFn: () => customersApi.getCustomers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  // 2. Fetch Quotations to enrich commercial profile & 360 view
  const { 
    data: quotations = [], 
    isLoading: isQuotesLoading 
  } = useQuery({
    queryKey: ['salesQuotations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const isLoading = isCustomersLoading || isQuotesLoading;

  // React Hook Forms
  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    reset: resetEdit,
    formState: { errors: editErrors } 
  } = useForm();

  const { 
    register: registerCreate, 
    handleSubmit: handleCreateSubmit, 
    reset: resetCreate,
    formState: { errors: createErrors } 
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: 'password123'
    }
  });

  // 3. Mutations for Customer Management
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateCustomer(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success(res.data?.message || 'Customer details updated successfully');
      setIsEditModalOpen(false);
      setCustomerToEdit(null);
      resetEdit();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteCustomer(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success(res.data?.message || 'Customer account deleted/deactivated successfully');
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      if (selectedCustomerId === customerToDelete?.id) {
        setSelectedCustomerId(null);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete customer');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createCustomer(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success(res.data?.message || 'New customer account created successfully');
      setIsCreateModalOpen(false);
      resetCreate();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create customer');
    }
  });

  // Handlers for Modals
  const openEditModal = (cust, e) => {
    if (e) e.stopPropagation();
    setCustomerToEdit(cust);
    resetEdit({
      name: cust.name || cust.companyName || '',
      email: cust.email || '',
      isActive: cust.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (cust, e) => {
    if (e) e.stopPropagation();
    setCustomerToDelete(cust);
    setIsDeleteModalOpen(true);
  };

  const onSaveEdit = (data) => {
    if (!customerToEdit?.id) return;
    updateMutation.mutate({
      id: customerToEdit.id,
      data: {
        name: data.name?.trim(),
        email: data.email?.trim().toLowerCase(),
        isActive: data.isActive === true || data.isActive === 'true'
      }
    });
  };

  const onConfirmDelete = () => {
    if (!customerToDelete?.id) return;
    deleteMutation.mutate(customerToDelete.id);
  };

  const onSaveCreate = (data) => {
    createMutation.mutate({
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      password: data.password || 'password123'
    });
  };

  // Process and join customer accounts with quotation statistics
  const customerList = useMemo(() => {
    const rawList = Array.isArray(customerAccounts) ? customerAccounts : (customerAccounts?.data || []);
    if (!rawList || rawList.length === 0) return [];
    
    return rawList.map(c => {
      const relatedQuotes = quotations.filter(q => 
        q.customerId === c.id || 
        (q.customer && q.customer.id === c.id)
      );
      
      const pipelineValue = c.pipelineValue !== undefined && c.pipelineValue > 0 
        ? c.pipelineValue 
        : relatedQuotes.reduce((sum, q) => sum + Number(q.activeVersion?.totalAmount || q.totalAmount || 0), 0);
        
      const avgRisk = relatedQuotes.length > 0 
        ? Math.round(relatedQuotes.reduce((sum, q) => sum + (q.activeVersion?.riskScore || 0), 0) / relatedQuotes.length)
        : (c.riskScore || 0);

      const tier = (c.tier || 'STANDARD').toUpperCase();
      
      return {
        id: c.id,
        companyName: c.companyName || c.name || 'Commercial Account',
        name: c.name,
        tier: tier,
        tierDiscountLimit: c.tierDiscountLimit || (tier === 'ENTERPRISE' ? 15 : tier === 'GOLD' ? 12 : 10),
        contactName: c.contactName || c.contact || c.name || 'Primary Contact',
        email: c.email || 'customer@company.com',
        activeQuotesCount: relatedQuotes.length > 0 ? relatedQuotes.length : (c.activeQuotesCount || 0),
        pipelineValue: Number(pipelineValue || 0),
        lastActivity: relatedQuotes.length > 0 ? 'Active Deals' : 'Registered Account',
        riskScore: avgRisk,
        riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW',
        isActive: c.isActive !== false,
        quotes: relatedQuotes
      };
    });
  }, [customerAccounts, quotations]);

  // Search and Tier/Status Filter
  const filteredCustomers = useMemo(() => {
    return customerList.filter(c => {
      const name = (c.companyName || '').toLowerCase();
      const contact = (c.contactName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || name.includes(term) || contact.includes(term) || email.includes(term);
      const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
      const matchesStatus = statusFilter === 'ALL' 
        ? true 
        : statusFilter === 'ACTIVE' ? c.isActive === true : c.isActive === false;
      
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [customerList, searchTerm, tierFilter, statusFilter]);

  // Selected customer for 360 View Drawer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerList.find(c => c.id === selectedCustomerId) || null;
  }, [customerList, selectedCustomerId]);

  // Aggregate metrics for contextual summary bar
  const summaryMetrics = useMemo(() => {
    const totalCustomers = customerList.length;
    const activeDeals = customerList.reduce((acc, c) => acc + (c.activeQuotesCount || 0), 0);
    const totalPipeline = customerList.reduce((acc, c) => acc + (c.pipelineValue || 0), 0);
    const highRiskCount = customerList.filter(c => c.riskScore > 45 || c.riskLevel === 'HIGH').length;
    const activeCount = customerList.filter(c => c.isActive).length;

    return { totalCustomers, activeDeals, totalPipeline, highRiskCount, activeCount };
  }, [customerList]);

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]';
      case 'GOLD':
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
      case 'STANDARD':
      default:
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Page Header */}
      <div className="border-b border-[#EEEAE4] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[32px] sm:text-[38px] font-semibold text-[#171717] tracking-tight leading-tight">
                Customer Directory
              </h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8E9E3] text-[#C96648] border border-[#E9B8A7]">
                  Admin Controls Enabled
                </span>
              )}
            </div>
            <p className="text-[14px] sm:text-[15px] text-[#6F6B66] mt-1 font-normal">
              Manage client directory, governance tiers, edit customer accounts & track deal lifecycle history.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                resetCreate();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 h-11 px-5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>

        {/* Compact Summary Bar */}
        {!isLoading && customerList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-3 border-t border-[#EEEAE4]/60 text-xs sm:text-[13px]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Users className="w-3.5 h-3.5 text-[#D97757]" />
              <span className="font-semibold">{summaryMetrics.totalCustomers}</span>
              <span className="text-[#6F6B66]">Total ({summaryMetrics.activeCount} Active)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <FileText className="w-3.5 h-3.5 text-[#6F6B66]" />
              <span className="font-semibold">{summaryMetrics.activeDeals}</span>
              <span className="text-[#6F6B66]">Active Deals</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E6E1D9] text-[#171717] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <DollarSign className="w-3.5 h-3.5 text-[#3F8F63]" />
              <span className="font-semibold">₹{summaryMetrics.totalPipeline.toLocaleString('en-IN')}</span>
              <span className="text-[#6F6B66]">Pipeline</span>
            </div>

            {summaryMetrics.highRiskCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FBEAEA] border border-[#F5C7C7] text-[#C95757] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C95757]" />
                <span className="font-semibold">{summaryMetrics.highRiskCount}</span>
                <span>High Risk</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Search + Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-[420px] md:w-[480px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#96918A]" />
          <input
            type="text"
            placeholder="Search company name, primary contact or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] text-[#171717] placeholder:text-[#96918A] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#96918A] hover:text-[#171717] p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] font-semibold text-[#6F6B66] whitespace-nowrap">Tier:</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="ENTERPRISE">Enterprise Tier</option>
              <option value="GOLD">Gold Tier</option>
              <option value="STANDARD">Standard Tier</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] font-semibold text-[#6F6B66] whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3.5 bg-white border border-[#E6E1D9] rounded-[10px] text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Customer Table */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : isCustomersError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-[#C95757]">Unable to load customer directory.</p>
            <button
              onClick={() => refetchCustomers()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[10px] bg-[#F5F2ED] hover:bg-[#EDE8E0] text-[#171717] border border-[#E6E1D9] transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Users}
              title={searchTerm || tierFilter !== 'ALL' || statusFilter !== 'ALL' ? 'No matching customers found' : 'No customer accounts yet'}
              description={
                searchTerm || tierFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query, tier or status filter.' 
                  : 'Customer accounts will appear here once registered or created.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[12px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">
                  <th className="py-3.5 px-6">Company / Account</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Active Quotes</th>
                  <th className="py-3.5 px-4">Pipeline Value</th>
                  <th className="py-3.5 px-4">Risk Profile</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE4]">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.id;

                  return (
                    <tr 
                      key={cust.id} 
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`
                        transition-colors duration-150 cursor-pointer group
                        ${isSelected ? 'bg-[#F8E9E3]/30' : 'hover:bg-[#FBFAF8]'}
                        ${!cust.isActive ? 'opacity-70 bg-gray-50/40' : ''}
                      `}
                      style={{ height: '74px' }}
                    >
                      {/* 1. Company Name & ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[#171717] text-[15px] sm:text-[16px] group-hover:text-[#D97757] transition-colors leading-snug">
                            {cust.companyName}
                          </div>
                          {!cust.isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-200 text-gray-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#96918A] font-mono mt-0.5 truncate max-w-[180px]">
                          ID: {cust.id}
                        </div>
                      </td>

                      {/* 2. Customer Tier Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${getTierBadgeStyle(cust.tier)}`}>
                          {cust.tier}
                        </span>
                      </td>

                      {/* 3. Primary Contact */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#171717] text-[14px]">
                          {cust.contactName}
                        </div>
                        <div className="text-[13px] text-[#96918A] truncate max-w-[200px]">
                          {cust.email}
                        </div>
                      </td>

                      {/* 4. Active Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {cust.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF5EF] text-[#2F7E53] border border-[#BCE4CD]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F63]"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#6F6B66] border border-[#E6E1D9]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#96918A]"></span>
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* 5. Active Quotes */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#171717] text-[14px]">
                          {cust.activeQuotesCount} {cust.activeQuotesCount === 1 ? 'quote' : 'quotes'}
                        </div>
                      </td>
                      {/* 6. Pipeline Value */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#171717] text-[15px] sm:text-[16px]">
                          ₹{Number(cust.pipelineValue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 7. Risk Profile */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <RiskBadge score={cust.riskScore || 0} level={cust.riskLevel} />
                      </td>

                      {/* 8. Actions (360° View + Admin Edit/Delete) */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                title="Edit customer details"
                                onClick={(e) => openEditModal(cust, e)}
                                className="p-2 text-[#6F6B66] hover:text-[#D97757] hover:bg-[#F8E9E3] border border-transparent hover:border-[#E9B8A7] rounded-[8px] transition-all cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Delete or deactivate customer"
                                onClick={(e) => openDeleteModal(cust, e)}
                                className="p-2 text-[#6F6B66] hover:text-[#C95757] hover:bg-[#FBEAEA] border border-transparent hover:border-[#F5C7C7] rounded-[8px] transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="inline-flex items-center gap-1 h-8 px-3 text-[12px] font-semibold bg-white hover:bg-[#F8E9E3] text-[#6F6B66] hover:text-[#C96648] border border-[#E6E1D9] hover:border-[#E9B8A7] rounded-[8px] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          >
                            <span>360°</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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
      </div>

      {/* 4. Customer 360 Slide-over Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#171717]/30 backdrop-blur-[2px] transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-[540px] bg-white border-l border-[#E6E1D9] shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E6E1D9] bg-[#FAF9F6] shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadgeStyle(selectedCustomer.tier)}`}>
                        {selectedCustomer.tier} TIER
                      </span>
                      <RiskBadge score={selectedCustomer.riskScore || 0} level={selectedCustomer.riskLevel} />
                      {selectedCustomer.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF5EF] text-[#2F7E53]">
                          Active Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#171717] tracking-tight">
                      {selectedCustomer.companyName}
                    </h2>
                    <p className="text-[12px] font-mono text-[#96918A] mt-0.5">
                      ID: {selectedCustomer.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(selectedCustomer)}
                          title="Edit Customer"
                          className="p-1.5 text-[#6F6B66] hover:text-[#D97757] hover:bg-[#F8E9E3] rounded-[8px] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(selectedCustomer)}
                          title="Delete Customer"
                          className="p-1.5 text-[#6F6B66] hover:text-[#C95757] hover:bg-[#FBEAEA] rounded-[8px] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="p-1.5 text-[#6F6B66] hover:text-[#171717] hover:bg-[#EDE8E0] rounded-[8px] transition-colors cursor-pointer"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Commercial Profile */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Commercial Profile
                  </h3>
                  <div className="bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4] p-4 space-y-2.5 text-xs sm:text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Customer Tier</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.tier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Governance Discount Limit</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.tierDiscountLimit}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Active Quotations</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.activeQuotesCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Pipeline Value</span>
                      <span className="font-semibold text-[#171717]">
                        ₹{Number(selectedCustomer.pipelineValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6F6B66]">Commercial Risk Score</span>
                      <span className="font-semibold text-[#171717]">{selectedCustomer.riskScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* 2. Primary Contact Details */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Primary Contact
                  </h3>
                  <div className="bg-white rounded-[10px] border border-[#E6E1D9] p-4 space-y-2 text-xs sm:text-[13px]">
                    <div className="flex items-center gap-2 text-[#171717] font-medium">
                      <Users className="w-4 h-4 text-[#D97757]" />
                      <span>{selectedCustomer.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6F6B66]">
                      <Mail className="w-4 h-4 text-[#96918A]" />
                      <a href={`mailto:${selectedCustomer.email}`} className="hover:text-[#D97757] transition-colors">
                        {selectedCustomer.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. Quotation History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                      Quotation History ({selectedCustomer.quotes?.length || 0})
                    </h3>
                  </div>

                  {(!selectedCustomer.quotes || selectedCustomer.quotes.length === 0) ? (
                    <div className="p-4 rounded-[10px] border border-[#EEEAE4] bg-[#FAF9F6] text-center text-xs text-[#6F6B66]">
                      No recorded quotations found for this account.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.quotes.map((q) => {
                        const amount = Number(q.activeVersion?.totalAmount || q.totalAmount || 0);
                        const itemsCount = q.activeVersion?.items?.length || 0;

                        return (
                          <div 
                            key={q.id}
                            onClick={() => navigate(`/sales/quotations/${q.id}`)}
                            className="p-3.5 rounded-[10px] border border-[#E6E1D9] bg-white hover:bg-[#FBFAF8] hover:border-[#D97757]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-[13px] text-[#171717] group-hover:text-[#D97757] transition-colors">
                                  {q.quotationNumber || `QT-${q.id.slice(0, 8)}`}
                                </span>
                                <StatusBadge status={q.status} />
                              </div>
                              <div className="text-[11px] text-[#96918A]">
                                {itemsCount > 0 ? `${itemsCount} line items` : 'Commercial quotation'} • {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-xs sm:text-[13px] text-[#171717]">
                                ₹{amount.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[11px] text-[#D97757] font-medium flex items-center justify-end gap-0.5 mt-0.5">
                                View <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Negotiation & Risk Insights */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#96918A]">
                    Governance & Risk Notes
                  </h3>
                  <div className="p-4 rounded-[10px] bg-[#FAF9F6] border border-[#EEEAE4] text-xs text-[#6F6B66] space-y-2 leading-relaxed">
                    <p>
                      • Standard tier pricing policy applies. Commercial requests exceeding {selectedCustomer.tierDiscountLimit}% discount trigger automated multi-tier approval routing.
                    </p>
                    {selectedCustomer.riskScore > 45 ? (
                      <p className="text-[#C95757] font-medium">
                        • Warning: Elevated deal margin or terms risk detected. Review payment schedules and margin floors prior to contract dispatch.
                      </p>
                    ) : (
                      <p className="text-[#3F8F63] font-medium">
                        • Account maintains healthy margin thresholds and standard governance metrics.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer CTA */}
              <div className="p-4 sm:p-5 border-t border-[#E6E1D9] bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedCustomer)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#171717] bg-white border border-[#E6E1D9] hover:bg-[#F5F2ED] rounded-[9px] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#D97757]" />
                      <span>Edit Customer</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate(`/sales/customers/${selectedCustomer.id}`);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[9px] transition-all flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                  <span>Full Customer 360° Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. Edit Customer Modal */}
      {isEditModalOpen && customerToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] border border-[#E6E1D9] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#EEEAE4] flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#171717]">Edit Customer Details</h3>
                  <p className="text-xs text-[#6F6B66] font-mono">ID: {customerToEdit.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setCustomerToEdit(null);
                }}
                className="text-[#96918A] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#EDE8E0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onSaveEdit)} className="p-6 space-y-4">
              {/* Customer / Company Name */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">
                  Company / Customer Name *
                </label>
                <input
                  type="text"
                  {...registerEdit('name', { required: 'Customer name is required' })}
                  placeholder="e.g. Acme Corp"
                  className="w-full h-10 px-3 bg-white border border-[#E6E1D9] rounded-[8px] text-sm text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                />
                {editErrors.name && (
                  <p className="text-xs text-[#C95757] mt-1">{editErrors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...registerEdit('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="e.g. contact@acme.com"
                  className="w-full h-10 px-3 bg-white border border-[#E6E1D9] rounded-[8px] text-sm text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                />
                {editErrors.email && (
                  <p className="text-xs text-[#C95757] mt-1">{editErrors.email.message}</p>
                )}
              </div>

              {/* Account Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-[#171717] cursor-pointer">
                    <input
                      type="radio"
                      value="true"
                      {...registerEdit('isActive')}
                      className="text-[#D97757] focus:ring-[#D97757]"
                    />
                    <span className="font-medium text-[#2F7E53]">Active</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[#171717] cursor-pointer">
                    <input
                      type="radio"
                      value="false"
                      {...registerEdit('isActive')}
                      className="text-[#D97757] focus:ring-[#D97757]"
                    />
                    <span className="font-medium text-[#6F6B66]">Deactivated (Suspended)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EEEAE4] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCustomerToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] bg-[#F5F2ED] hover:bg-[#EDE8E0] rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#D97757] hover:bg-[#C96648] text-white text-xs font-semibold rounded-[8px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {updateMutation.isPending ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Customer Modal */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] border border-[#E6E1D9] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#EEEAE4] flex justify-between items-center bg-[#FBEAEA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-white border border-[#F5C7C7] flex items-center justify-center text-[#C95757]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#C95757]">Delete Customer Account</h3>
                  <p className="text-xs text-[#6F6B66]">This action requires confirmation</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCustomerToDelete(null);
                }}
                className="text-[#96918A] hover:text-[#171717] p-1.5 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-[#FAF9F6] border border-[#E6E1D9] rounded-[10px] space-y-1.5 text-xs">
                <div className="font-semibold text-sm text-[#171717]">{customerToDelete.companyName}</div>
                <div className="text-[#6F6B66]">{customerToDelete.email}</div>
                <div className="text-[#96918A] font-mono text-[11px]">ID: {customerToDelete.id}</div>
                {customerToDelete.activeQuotesCount > 0 && (
                  <div className="pt-2 text-[#C95757] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Has {customerToDelete.activeQuotesCount} active deal(s) / transaction records.</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#6F6B66] leading-relaxed">
                If this customer has historical quotations or orders, the account will be safely <strong>deactivated</strong> to preserve audit integrity. If no transactions exist, it will be completely removed.
              </p>

              <div className="pt-3 border-t border-[#EEEAE4] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCustomerToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] bg-[#F5F2ED] hover:bg-[#EDE8E0] rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={onConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#C95757] hover:bg-[#B24545] text-white text-xs font-semibold rounded-[8px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {deleteMutation.isPending ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] border border-[#E6E1D9] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#EEEAE4] flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#171717]">Create Customer Account</h3>
                  <p className="text-xs text-[#6F6B66]">Add a new commercial client to the directory</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                }}
                className="text-[#96918A] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#EDE8E0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit(onSaveCreate)} className="p-6 space-y-4">
              {/* Customer / Company Name */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">
                  Company / Customer Name *
                </label>
                <input
                  type="text"
                  {...registerCreate('name', { required: 'Customer name is required' })}
                  placeholder="e.g. Apex Global Technologies"
                  className="w-full h-10 px-3 bg-white border border-[#E6E1D9] rounded-[8px] text-sm text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                />
                {createErrors.name && (
                  <p className="text-xs text-[#C95757] mt-1">{createErrors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...registerCreate('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="e.g. procurement@apex.com"
                  className="w-full h-10 px-3 bg-white border border-[#E6E1D9] rounded-[8px] text-sm text-[#171717] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                />
                {createErrors.email && (
                  <p className="text-xs text-[#C95757] mt-1">{createErrors.email.message}</p>
                )}
              </div>

              {/* Password info notice */}
              <div className="p-3 bg-[#FAF9F6] border border-[#E6E1D9] rounded-[8px] text-xs text-[#6F6B66] flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-[#96918A] mt-0.5 shrink-0" />
                <span>
                  Default login password for new customer will be set to <code className="font-mono font-semibold text-[#171717]">password123</code>. The client can change this anytime.
                </span>
              </div>

              <div className="pt-4 border-t border-[#EEEAE4] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6F6B66] hover:text-[#171717] bg-[#F5F2ED] hover:bg-[#EDE8E0] rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#D97757] hover:bg-[#C96648] text-white text-xs font-semibold rounded-[8px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {createMutation.isPending ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}