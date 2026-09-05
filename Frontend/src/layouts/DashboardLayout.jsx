import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DealFlowLogo from '../components/DealFlowLogo';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Truck, 
  RefreshCw, 
  Receipt, 
  Activity, 
  BarChart3, 
  Package, 
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
  Columns3,
  Users
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState('initial'); // 'initial' | 'image'
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(AVATAR_IMAGES[0].url);
  const [selectedInitialColor, setSelectedInitialColor] = useState('blue');

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Quotation #Q-1042 Approved',
      desc: 'Manager approved 15% discount for Acme Corp.',
      time: '10m ago',
      read: false
    },
    {
      id: 2,
      title: 'High Risk Deal Detected',
      desc: 'Deal #Q-1039 exceeded margin threshold (Risk: 78).',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      title: 'Payment Received',
      desc: 'Invoice #INV-2041 marked as PAID (₹12,400.00).',
      time: '3h ago',
      read: true
    }
  ]);

  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setDisplayName(parsed.name || '');
        if (parsed.avatarType) setAvatarType(parsed.avatarType);
        if (parsed.avatarImage) setSelectedAvatarImage(parsed.avatarImage);
        if (parsed.initialColor) setSelectedInitialColor(parsed.initialColor);
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
  }, []);

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
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
    const updatedUser = {
      ...user,
      name: displayName,
      avatarType,
      avatarImage: selectedAvatarImage,
      initialColor: selectedInitialColor
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setSettingsModalOpen(false);
    toast.success('Profile and avatar settings updated!');
  };

  const userRole = user?.role || 'SALES_REP';
  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@dealflow360.com';

  const getRoleConfig = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Administrator', badgeLight: 'bg-purple-50 text-purple-700 border-purple-200', icon: ShieldCheck };
      case 'SALES_MANAGER':
        return { label: 'Sales Manager', badgeLight: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCheck };
      case 'FINANCE':
        return { label: 'Finance', badgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CreditCard };
      case 'OPERATIONS':
        return { label: 'Operations', badgeLight: 'bg-amber-50 text-amber-700 border-amber-200', icon: Truck };
      case 'CUSTOMER':
        return { label: 'Customer Client', badgeLight: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Building };
      case 'SALES_REP':
      default:
        return { label: 'Sales Representative', badgeLight: 'bg-blue-50 text-blue-700 border-blue-200', icon: Briefcase };
    }
  };

  const roleConfig = getRoleConfig(userRole);
  const RoleIcon = roleConfig.icon;

  const currentInitialPreset = INITIAL_COLORS.find(c => c.id === selectedInitialColor) || INITIAL_COLORS[0];

  // Helper component to render current avatar cleanly
  const renderAvatar = (size = 'w-9 h-9', textClass = 'text-sm') => {
    if (avatarType === 'image' && selectedAvatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200 shrink-0 shadow-sm`}>
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

  // Navigation grouped by DealFlow360 business workflow
  const navSections = [
    {
      title: 'Sales Pipeline',
      items: [
        { title: 'Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
        { title: 'Quotations', path: '/sales/quotations', icon: FileText },
        { title: 'Pipeline', path: '/sales/pipeline', icon: Columns3 },
      ]
    },
    {
      title: 'Deal Operations',
      items: [
        { title: 'Approvals', path: '/sales/approvals', icon: CheckSquare },
        { title: 'Fulfillment', path: '/sales/fulfillment', icon: Truck },
        { title: 'Subscriptions', path: '/sales/subscriptions', icon: RefreshCw },
        { title: 'Invoices', path: '/sales/invoices', icon: Receipt },
      ]
    },
    {
      title: 'Customers',
      items: [
        { title: 'Customers', path: '/sales/customers', icon: Users },
      ]
    },
    {
      title: 'Insights',
      items: [
        { title: 'Deal Health', path: '/sales/deal-health', icon: Activity },
        { title: 'Reports', path: '/sales/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'Catalog',
      items: [
        { title: 'Products', path: '/sales/products', icon: Package },
      ]
    }
  ];

  const adminRulesNavigation = [
    { title: 'Discount Rules', path: '/admin/discount-rules', icon: Sliders },
    { title: 'Approval Rules', path: '/admin/approval-rules', icon: CheckSquare },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/sales/dashboard')) return 'Dashboard';
    if (p.includes('/sales/quotations/new')) return 'New Quotation';
    if (p.includes('/sales/quotations/') && p.includes('/edit')) return 'Edit Quotation';
    if (p.includes('/sales/quotations/')) return 'Quotation Details';
    if (p.includes('/sales/quotations')) return 'Quotations';
    if (p.includes('/sales/pipeline')) return 'Deal Pipeline';
    if (p.includes('/sales/approvals')) return 'Approval Queue';
    if (p.includes('/sales/fulfillment/')) return 'Warehouse Split Allocation';
    if (p.includes('/sales/fulfillment')) return 'Fulfillment';
    if (p.includes('/sales/subscriptions')) return 'Subscriptions';
    if (p.includes('/sales/invoices')) return 'Invoices & Billing';
    if (p.includes('/sales/customers/')) return 'Customer Profile';
    if (p.includes('/sales/customers')) return 'Customers';
    if (p.includes('/sales/deal-health')) return 'Deal Health';
    if (p.includes('/sales/reports') || p.includes('/admin/reports')) return 'Sales Reports & Analytics';
    if (p.includes('/sales/products') || p.includes('/admin/products')) return 'Product & Pricing Catalog';
    if (p.includes('/admin/discount-rules')) return 'Discount Rules';
    if (p.includes('/admin/approval-rules')) return 'Approval Rules';
    return 'Sales Workspace';
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-900 font-sans antialiased text-slate-800">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800
        transition-all duration-300 ease-in-out lg:static lg:z-auto shrink-0 select-none
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
      `}>
        {/* Top Branding (Website Name & Logo) */}
        <div className={`h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <Link to="/sales/dashboard" className="flex items-center gap-3 group min-w-0">
            <DealFlowLogo variant="dark" iconOnly={isCollapsed} size={isCollapsed ? 'md' : 'md'} />
          </Link>

          {/* Desktop Collapse Toggle Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Close button on mobile */}
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Expand Trigger */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path === '/sales/dashboard' && location.pathname === '/sales');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.title : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-xs sm:text-sm">{item.title}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Admin Rule Matrix (if admin role) */}
          {userRole === 'ADMIN' && (
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Configuration</span>
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                </div>
              )}
              <nav className="space-y-0.5">
                {adminRulesNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.title : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-purple-600 text-white shadow-xs font-semibold' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-xs sm:text-sm">{item.title}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20 shadow-xs">
          {/* Left: Mobile hamburger menu & Page Title with contextual role badge */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {getPageTitle()}
              </h1>
              <span className="text-slate-300 text-sm hidden sm:inline">|</span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${roleConfig.badgeLight}`}>
                <RoleIcon className="w-3 h-3" />
                {roleConfig.label}
              </span>
            </div>
          </div>

          {/* Right: Notifications & Compact Avatar Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Notifications Button */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <button 
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Profile Avatar Button */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="relative focus:outline-none group rounded-full"
                aria-label="Open profile menu"
              >
                {renderAvatar('w-9 h-9', 'text-sm')}
              </button>

              {/* Profile Menu Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    {renderAvatar('w-10 h-10', 'text-base')}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                      <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${roleConfig.badgeLight}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      View Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setSettingsModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings & Avatar
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setLogoutModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 overscroll-none">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Popup Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to log out of DealFlow360? You will need to log back in to access your active pipeline and quotes.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-red-500/20"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">User Profile</h3>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex items-center gap-4">
                {renderAvatar('w-14 h-14', 'text-xl')}
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{userName}</h4>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border mt-1.5 ${roleConfig.badgeLight}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-slate-700 font-medium">{user?.id || 'usr_session'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-semibold text-slate-800">{userRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Active Session
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Avatar Customization Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Account Settings & Avatar</h3>
                <p className="text-xs text-slate-500">Customize how your profile appears across DealFlow360</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-5 text-xs">
              {/* Display Name Input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs"
                  placeholder="Your full name"
                />
              </div>

              {/* Avatar Style Choice: Images vs Initial */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    Avatar Display Style
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAvatarType('initial')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${avatarType === 'initial' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                    >
                      Letter Initial
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType('image')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${avatarType === 'image' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                    >
                      Illustrated Persona
                    </button>
                  </div>
                </div>

                {avatarType === 'initial' ? (
                  <div>
                    <p className="text-[11px] text-slate-500 mb-2.5">Choose background color for your initial letter:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {INITIAL_COLORS.map((preset) => (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => setSelectedInitialColor(preset.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                            selectedInitialColor === preset.id 
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${preset.bg} shrink-0`}></div>
                          <span className="text-[10px] font-medium text-slate-700 truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-500 mb-2.5">Select a character persona avatar:</p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {AVATAR_IMAGES.map((img) => (
                        <button
                          type="button"
                          key={img.id}
                          onClick={() => setSelectedAvatarImage(img.url)}
                          className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all group ${
                            selectedAvatarImage === img.url 
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20' 
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 mb-1 border border-slate-200">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-medium text-slate-700 text-center leading-tight truncate w-full">{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              <div className="pt-3 border-t border-slate-100">
                <label className="font-semibold text-slate-700 block mb-1">Email Alerts</label>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-slate-600 font-medium">Receive real-time quotation approval and discount alerts</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

