import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DealFlowLogo from '../components/DealFlowLogo';
import { useAuth } from '../context/AuthContext';
import { getNavigationForRole } from '../lib/roleNavigation';
import { ROLE_METADATA, ROLES } from '../lib/roles';
import { 
  Bell, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Briefcase, 
  Check, 
  Building,
  UserCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Sliders,
  CheckCircle2,
  Truck
} from 'lucide-react';

const AVATAR_IMAGES = [
  { id: 'avatar-1', name: 'Executive Leader', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&backgroundColor=e2e8f0' },
  { id: 'avatar-2', name: 'Deal Strategist', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=f1f5f9' },
  { id: 'avatar-3', name: 'Sales Director', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=e2e8f0' },
  { id: 'avatar-4', name: 'Finance Lead', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=f1f5f9' },
  { id: 'avatar-5', name: 'Operations Mgr', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason&backgroundColor=e2e8f0' },
  { id: 'avatar-6', name: 'Deal Architect', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=f1f5f9' },
  { id: 'avatar-7', name: 'Security Analyst', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow&backgroundColor=e2e8f0' },
  { id: 'avatar-8', name: 'VP of Growth', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&backgroundColor=f1f5f9' },
];

const INITIAL_COLORS = [
  { id: 'indigo', name: 'Matte Indigo', bg: 'bg-indigo-700', text: 'text-white' },
  { id: 'slate', name: 'Graphite Slate', bg: 'bg-slate-700', text: 'text-white' },
  { id: 'blue', name: 'Matte Navy', bg: 'bg-blue-800', text: 'text-white' },
  { id: 'teal', name: 'Deep Teal', bg: 'bg-teal-800', text: 'text-white' },
  { id: 'emerald', name: 'Forest Green', bg: 'bg-emerald-800', text: 'text-white' },
  { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-800', text: 'text-white' },
  { id: 'rose', name: 'Matte Crimson', bg: 'bg-rose-800', text: 'text-white' },
  { id: 'zinc', name: 'Carbon Zinc', bg: 'bg-zinc-800', text: 'text-white' },
];

export default function DashboardLayout() {
  const { user, role, logout, defaultRoute, updateUser } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [avatarType, setAvatarType] = useState(user?.avatarType || 'initial');
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(user?.avatarImage || AVATAR_IMAGES[0].url);
  const [selectedInitialColor, setSelectedInitialColor] = useState(user?.initialColor || 'blue');

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Quotation #QT-1024 Approved',
      desc: 'Manager authorized 18% discount for Acme Corp.',
      time: '10m ago',
      read: false
    },
    {
      id: 2,
      title: 'High Risk Deal Detected',
      desc: 'QT-1039 exceeded margin threshold (Risk: 78).',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      title: 'Payment Received',
      desc: 'Invoice #INV-2026-001 marked as PAID (₹1,24,000).',
      time: '3h ago',
      read: true
    }
  ]);

  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      if (user.avatarType) setAvatarType(user.avatarType);
      if (user.avatarImage) setSelectedAvatarImage(user.avatarImage);
      if (user.initialColor) setSelectedInitialColor(user.initialColor);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const confirmLogout = () => {
    logout();
    setLogoutModalOpen(false);
    toast.success('Signed out successfully');
    navigate('/auth/login');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleSaveSettings = () => {
    if (!displayName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateUser({
      name: displayName,
      avatarType,
      avatarImage: selectedAvatarImage,
      initialColor: selectedInitialColor
    });
    setSettingsModalOpen(false);
    toast.success('Profile and avatar preferences saved!');
  };

  const roleInfo = ROLE_METADATA[role] || { label: 'User', badge: 'bg-slate-100 text-slate-700' };
  const userName = user?.name || 'Authorized User';
  const userEmail = user?.email || 'user@dealflow360.com';

  const currentInitialPreset = INITIAL_COLORS.find(c => c.id === selectedInitialColor) || INITIAL_COLORS[0];

  // Helper component to render current avatar cleanly
  const renderAvatar = (size = 'w-9 h-9', textClass = 'text-sm') => {
    if (avatarType === 'image' && selectedAvatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200 shrink-0 shadow-xs`}>
          <img src={selectedAvatarImage} alt={userName} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full ${currentInitialPreset.bg} ${currentInitialPreset.text} flex items-center justify-center font-bold ${textClass} shadow-xs ring-1 ring-slate-300 shrink-0`}>
        {userName.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Dynamic Navigation Sections based on authenticated role
  const navSections = getNavigationForRole(role);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/sales/dashboard') || p.includes('/manager/dashboard') || p.includes('/operations/dashboard') || p.includes('/admin/dashboard') || p === '/portal') {
      return 'Dashboard';
    }
    if (p.includes('/sales/quotations/new')) return 'New Quotation';
    if (p.includes('/sales/quotations/') && p.includes('/edit')) return 'Edit Quotation';
    if (p.includes('/sales/quotations/')) return 'Quotation Details';
    if (p.includes('/sales/quotations') || p.includes('/portal/quotations')) return 'Quotations';
    if (p.includes('/sales/pipeline')) return 'Deal Pipeline';
    if (p.includes('/sales/approvals')) return 'Approval Queue';
    if (p.includes('/sales/fulfillment/')) return 'Warehouse Split Allocation';
    if (p.includes('/sales/fulfillment') || p.includes('/portal/orders')) return 'Fulfillment & Orders';
    if (p.includes('/sales/subscriptions')) return 'Subscriptions';
    if (p.includes('/sales/invoices')) return 'Invoices & Billing';
    if (p.includes('/sales/customers/')) return 'Customer 360° Profile';
    if (p.includes('/sales/customers')) return 'Customers';
    if (p.includes('/sales/deal-health')) return 'Deal Health Radar';
    if (p.includes('/sales/reports') || p.includes('/admin/reports')) return 'Sales Reports & Analytics';
    if (p.includes('/admin/products') || p.includes('/sales/products')) return 'Product & Pricing Catalog';
    if (p.includes('/admin/discount-rules')) return 'Discount Rules';
    if (p.includes('/admin/approval-rules')) return 'Approval Rules';
    if (p.includes('/portal/negotiations')) return 'Negotiation Proposals';
    if (p.includes('/portal/profile')) return 'Customer Profile';
    return 'Workspace';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 h-screen bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out shrink-0
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'} border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-xs shrink-0`}>
          <Link to={defaultRoute} className="flex items-center gap-2.5 overflow-hidden focus:outline-none">
            {isCollapsed ? (
              <DealFlowLogo variant="dark" iconOnly size="md" />
            ) : (
              <DealFlowLogo variant="dark" size="md" />
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/90 font-mono">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== defaultRoute && item.path !== '/sales/dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.title : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group relative
                        ${isActive 
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'}
                        ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}
                      `}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 hidden md:flex items-center justify-between text-xs text-slate-400 bg-slate-900/60">
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={`w-2 h-2 rounded-full ${role === ROLES.ADMIN ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              <span className="truncate text-xs font-mono font-medium text-slate-300">{roleInfo.label}</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-auto"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#f8fafc] min-h-screen ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300 ease-in-out`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h2>
              
              {/* Contextual Role Badge */}
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/20 transition-all focus:outline-none"
              >
                {renderAvatar()}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    {renderAvatar('w-10 h-10', 'text-base')}
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                      <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); setProfileModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>User Profile</span>
                    </button>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setSettingsModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings & Avatar</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setLogoutModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-0 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* User Profile View Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Account Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 py-2">
              {renderAvatar('w-20 h-20', 'text-2xl')}
              <h4 className="text-base font-bold text-slate-900">{userName}</h4>
              <p className="text-xs text-slate-400">{userEmail}</p>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400 uppercase">Role Responsibility:</span>
                <span className="text-slate-800 font-medium">{roleInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400 uppercase">Default Workspace:</span>
                <span className="font-mono text-indigo-700 font-bold">{defaultRoute}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 italic">
                {roleInfo.description}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Avatar Customization Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Settings & Appearance</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Avatar Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'initial'}
                      onChange={() => setAvatarType('initial')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 font-medium">Initials with Matte Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'image'}
                      onChange={() => setAvatarType('image')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 font-medium">Persona Avatar</span>
                  </label>
                </div>
              </div>

              {avatarType === 'initial' && (
                <div className="space-y-2 pt-2">
                  <label className="block font-semibold text-slate-700">Choose Matte Background Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {INITIAL_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedInitialColor(c.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          selectedInitialColor === c.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30' : 'border-slate-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${c.bg} shrink-0`} />
                        <span className="text-[11px] font-medium text-slate-700 truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatarType === 'image' && (
                <div className="space-y-2 pt-2">
                  <label className="block font-semibold text-slate-700">Choose Persona Avatar</label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_IMAGES.map(av => (
                      <button
                        key={av.id}
                        onClick={() => setSelectedAvatarImage(av.url)}
                        className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                          selectedAvatarImage === av.url ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30' : 'border-slate-200'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-10 h-10 rounded-full" />
                        <span className="text-[10px] font-medium text-slate-600 truncate w-full">{av.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Sign Out of DealFlow360?</h3>
              <p className="text-xs text-slate-500">You will be redirected to the secure login screen.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
