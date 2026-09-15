import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  FileText, 
  ShoppingBag, 
  Plus, 
  Inbox,
  ArrowUpRight,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { customersApi } from '../../features/customers/customers.api';
import { quotationsApi } from '../../features/quotations/quotations.api';
import { api } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SALES_MANAGER';

  const [activeTab, setActiveTab] = useState('QUOTATIONS');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // React Hook Form for Edit
  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    reset: resetEdit,
    formState: { errors: editErrors } 
  } = useForm();

  // Fetch all customers for matching profile metadata
  const { data: customersData = [], isLoading: isCustomersLoading } = useQuery({
    queryKey: ['adminCustomersList'],
    queryFn: () => customersApi.getCustomers().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const customerRecord = useMemo(() => {
    const list = Array.isArray(customersData) ? customersData : (customersData?.data || []);
    return list.find(c => c.id === id) || null;
  }, [customersData, id]);

  const { data: quotations = [], isLoading: isQuotesLoading } = useQuery({
    queryKey: ['customerDetailQuotations', id],
    queryFn: () => quotationsApi.getQuotations().then(res => res.data?.data || res.data || []).catch(() => [])
  });

  const isLoading = isCustomersLoading || isQuotesLoading;

  // Mutations for Customer Update & Delete
  const updateMutation = useMutation({
    mutationFn: (data) => adminApi.updateCustomer(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success(res.data?.message || 'Customer updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCustomer(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success(res.data?.message || 'Customer account deleted / deactivated');
      setIsDeleteModalOpen(false);
      navigate('/sales/customers');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete customer');
    }
  });

  const openEditModal = () => {
    resetEdit({
      name: customerRecord?.name || customerRecord?.companyName || '',
      email: customerRecord?.email || '',
      isActive: customerRecord?.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const onSaveEdit = (data) => {
    updateMutation.mutate({
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      isActive: data.isActive === true || data.isActive === 'true'
    });
  };

  const onConfirmDelete = () => {
    deleteMutation.mutate();
  };

  const customerQuotes = useMemo(() => {
    if (!Array.isArray(quotations)) return [];
    return quotations.filter(q => 
      q.customerId === id || 
      q.customer?.id === id || 
      (customerRecord?.email && q.customer?.email === customerRecord.email) ||
      (customerRecord?.name && q.customer?.name === customerRecord.name) ||
      q.id === id
    );
  }, [quotations, id, customerRecord]);

  const firstQuote = customerQuotes[0];
  const customerName = customerRecord?.companyName || customerRecord?.name || firstQuote?.customer?.companyName || firstQuote?.customer?.name || (id ? `Account #${id.slice(0, 8)}` : 'Client Account');
  const customerTier = (customerRecord?.tier || firstQuote?.customer?.tier || 'STANDARD').toUpperCase();
  const customerEmail = customerRecord?.email || firstQuote?.customer?.email || 'customer@company.com';
  const contactName = customerRecord?.contactName || customerRecord?.name || 'Primary Contact';

  const totalRevenue = customerQuotes
    .filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status))
    .reduce((sum, q) => {
      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
      return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
    }, 0);

  const totalPipeline = customerQuotes.reduce((sum, q) => {
    const v = q.activeVersion || (q.versions && q.versions[0]) || {};
    return sum + (Number(v.totalAmount) || Number(q.totalAmount) || 0);
  }, 0);

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]';
      case 'GOLD':
      case 'STANDARD':
      default:
        return 'bg-[#F5F2ED] text-[#6F6B66] border-[#E6E1D9]';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/sales/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F6B66] hover:text-[#D97757] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </button>
      </div>

      {/* Account Overview Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E6E1D9] shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757] shadow-xs shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#171717] tracking-tight">
                  {customerName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadgeStyle(customerTier)}`}>
                  {customerTier} TIER
                </span>
                {customerRecord?.isActive === false && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                    Deactivated
                  </span>
                )}
                {customerRecord?.riskScore !== undefined && (
                  <RiskBadge score={customerRecord.riskScore} level={customerRecord.riskLevel} />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6F6B66] mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#96918A]" />
                  <span>{customerEmail}</span>
                </span>
                <span>•</span>
                <span>Contact: <strong className="text-[#171717] font-medium">{contactName}</strong></span>
                <span>•</span>
                <span className="font-mono text-[#96918A]">ID: {id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8E9E3] text-[#171717] border border-[#E6E1D9] hover:border-[#E9B8A7] text-xs font-semibold rounded-[9px] transition-all cursor-pointer shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FBEAEA] text-[#C95757] border border-[#E6E1D9] hover:border-[#F5C7C7] text-xs font-semibold rounded-[9px] transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}

            <button
              onClick={() => navigate('/sales/quotations/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D97757] hover:bg-[#C96648] text-white text-xs font-semibold rounded-[9px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </button>
          </div>
        </div>

        {/* Commercial & Governance Parameters Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EEEAE4]">
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Confirmed Revenue</span>
            <p className="text-[18px] font-semibold text-[#171717] mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Total Pipeline</span>
            <p className="text-[18px] font-semibold text-[#D97757] mt-0.5">₹{totalPipeline.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3.5 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4]">
            <span className="text-[11px] font-semibold text-[#96918A] uppercase tracking-[0.05em]">Discount Governance Limit</span>
            <p className="text-[18px] font-semibold text-[#171717] mt-0.5">{customerRecord?.tierDiscountLimit || 15}% max</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EEEAE4]">
        {[
          { id: 'QUOTATIONS', label: `Quotations (${customerQuotes.length})`, icon: FileText },
          { id: 'ORDERS', label: 'Orders & Fulfillment', icon: ShoppingBag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#D97757] text-[#D97757]'
                  : 'border-transparent text-[#6F6B66] hover:text-[#171717]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-[14px] border border-[#E6E1D9] shadow-sm p-5 sm:p-6">
        {activeTab === 'QUOTATIONS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[15px] font-semibold text-[#171717]">Quotation History</h3>
            </div>

            {isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : customerQuotes.length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="w-8 h-8 text-[#96918A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#171717]">No quotations recorded for this client</p>
                <p className="text-xs text-[#6F6B66] mt-0.5">Click &ldquo;New Quotation&rdquo; to build and dispatch one.</p>
              </div>
            ) : (
              <div className="border border-[#E6E1D9] rounded-[10px] overflow-hidden">
                <table className="w-full text-left text-xs sm:text-[13px]">
                  <thead className="bg-[#FAF9F6] border-b border-[#E6E1D9] text-[#96918A] font-semibold uppercase tracking-[0.05em] text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEAE4]">
                    {customerQuotes.map(q => {
                      const v = q.activeVersion || (q.versions && q.versions[0]) || {};
                      return (
                        <tr key={q.id} className="hover:bg-[#FBFAF8] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#171717]">
                            {q.quotationNumber || `QT-${q.id.slice(0, 6)}`}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#171717]">
                            ₹{Number(v.totalAmount || q.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={q.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => navigate(`/sales/quotations/${q.id}`)} 
                              className="text-xs font-semibold text-[#D97757] hover:text-[#C96648] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>View Deal</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold text-[#171717]">Fulfillment Orders</h3>
            {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="w-8 h-8 text-[#96918A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#171717]">No confirmed orders yet</p>
                <p className="text-xs text-[#6F6B66] mt-0.5">Orders appear here once a quotation is approved and confirmed.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerQuotes.filter(q => ['CONFIRMED', 'COMPLETED', 'PAID'].includes(q.status)).map(q => (
                  <div key={q.id} className="p-4 bg-[#FAF9F6] rounded-[10px] border border-[#EEEAE4] text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-[#171717] font-mono text-[13px]">{q.quotationNumber || `ORD-${q.id.slice(0, 6)}`}</strong>
                      <p className="text-[#6F6B66] mt-0.5">Confirmed commercial order</p>
                    </div>
                    <button
                      onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F8E9E3] text-[#6F6B66] hover:text-[#C96648] border border-[#E6E1D9] hover:border-[#E9B8A7] font-semibold rounded-[8px] transition-all cursor-pointer"
                    >
                      View Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] border border-[#E6E1D9] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#EEEAE4] flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#F8E9E3] border border-[#E9B8A7] flex items-center justify-center text-[#D97757]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#171717]">Edit Customer Details</h3>
                  <p className="text-xs text-[#6F6B66] font-mono">ID: {id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#96918A] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#EDE8E0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onSaveEdit)} className="p-6 space-y-4">
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
                    <span className="font-medium text-[#6F6B66]">Deactivated</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EEEAE4] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* Delete Customer Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] border border-[#E6E1D9] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#EEEAE4] flex justify-between items-center bg-[#FBEAEA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-white border border-[#F5C7C7] flex items-center justify-center text-[#C95757]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#C95757]">Delete Customer Account</h3>
                  <p className="text-xs text-[#6F6B66]">Confirmation required</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-[#96918A] hover:text-[#171717] p-1.5 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-[#FAF9F6] border border-[#E6E1D9] rounded-[10px] space-y-1.5 text-xs">
                <div className="font-semibold text-sm text-[#171717]">{customerName}</div>
                <div className="text-[#6F6B66]">{customerEmail}</div>
                <div className="text-[#96918A] font-mono text-[11px]">ID: {id}</div>
                {customerQuotes.length > 0 && (
                  <div className="pt-2 text-[#C95757] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Has {customerQuotes.length} active deal(s) / transaction records.</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#6F6B66] leading-relaxed">
                If this customer has historical quotations or orders, the account will be safely <strong>deactivated</strong> to preserve audit integrity. If no transactions exist, it will be completely removed.
              </p>

              <div className="pt-3 border-t border-[#EEEAE4] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
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
    </div>
  );
}
