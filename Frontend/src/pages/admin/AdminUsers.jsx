import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../features/admin/admin.api';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  CreditCard, 
  Truck, 
  User, 
  Crown, 
  CheckCircle2, 
  XCircle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Filter 
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

const ROLE_CONFIGS = {
  ADMIN: { label: 'Administrator', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Crown },
  SALES_REP: { label: 'Sales Rep', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Briefcase },
  SALES_MANAGER: { label: 'Sales Manager', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: UserCheck },
  FINANCE: { label: 'Finance Controller', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CreditCard },
  OPERATIONS: { label: 'Operations', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Truck },
  CUSTOMER: { label: 'Customer Client', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: User }
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRole, setEditRole] = useState('CUSTOMER');
  const [editActive, setEditActive] = useState(true);
  const [editName, setEditName] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: () => adminApi.getUsers().then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])).catch(() => [])
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update user')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success('User deleted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete user')
  });

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditRole(user.role || 'CUSTOMER');
    setEditActive(user.isActive !== false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      name: editName.trim(),
      role: editRole,
      isActive: editActive
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const userList = useMemo(() => Array.isArray(users) ? users : (users?.data || []), [users]);

  // KPI Calculations
  const totalUsers = userList.length;
  const customerCount = userList.filter(u => u.role === 'CUSTOMER').length;
  const staffCount = totalUsers - customerCount;
  const activeCount = userList.filter(u => u.isActive !== false).length;

  const filteredUsers = useMemo(() => {
    return userList.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [userList, searchTerm, roleFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform User Directory</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage staff permissions, sales team access, and client portal customer accounts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalUsers}</p>
          <span className="text-xs text-slate-400 mt-1 block">Registered in DealFlow360</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customers</span>
            <User className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{customerCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Customer Portal Accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Internal Staff</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{staffCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Sales, Ops, Finance & Admin</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{activeCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Active user accounts</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {['ALL', 'CUSTOMER', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'ADMIN'].map((r) => {
              const active = roleFilter === r;
              const label = r === 'ALL' ? 'All Roles' : (ROLE_CONFIGS[r]?.label || r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              icon={Users} 
              title="No users found" 
              description="No user accounts matched your current filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role Permission</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const roleCfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.CUSTOMER;
                  const RoleIcon = roleCfg.icon;
                  const initials = (u.name || u.email || 'U').slice(0, 2).toUpperCase();
                  const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

                  return (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs group-hover:text-indigo-600 transition-colors">
                              {u.name || 'Unnamed User'}
                            </span>
                            <span className="text-slate-500 text-[11px] font-medium font-mono block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit User Permissions</h3>
                  <p className="text-[11px] text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
                >
                  <option value="CUSTOMER">Customer Client (Portal Access)</option>
                  <option value="SALES_REP">Sales Representative</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="FINANCE">Finance Controller</option>
                  <option value="OPERATIONS">Operations / Fulfillment</option>
                  <option value="ADMIN">Global Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Access Status</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editActive === true}
                      onChange={() => setEditActive(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editActive === false}
                      onChange={() => setEditActive(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-rose-700">Suspended</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
