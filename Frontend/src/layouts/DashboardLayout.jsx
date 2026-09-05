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
  ChevronLeft,
  ChevronRight,
  Search
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
  { id: 'coral', name: 'Warm Coral', bg: 'bg-[#B85D19]', text: 'text-white' },
  { id: 'stone', name: 'Matte Stone', bg: 'bg-[#78716C]', text: 'text-white' },
  { id: 'forest', name: 'Deep Forest', bg: 'bg-[#3F8F63]', text: 'text-white' },
  { id: 'navy', name: 'Warm Navy', bg: 'bg-[#475569]', text: 'text-white' },
  { id: 'amber', name: 'Rich Amber', bg: 'bg-[#C98A32]', text: 'text-white' },
  { id: 'sienna', name: 'Burnt Sienna', bg: 'bg-[#A0522D]', text: 'text-white' },
  { id: 'steel', name: 'Steel Blue', bg: 'bg-[#5D83A8]', text: 'text-white' },
  { id: 'charcoal', name: 'Charcoal', bg: 'bg-[#3A3733]', text: 'text-white' },
];

export default function DashboardLayout({ variant } = {}) {
  const { user, role: authRole, logout, defaultRoute, updateUser } = useAuth();
  const role = variant === 'admin' ? ROLES.ADMIN : authRole;
  
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
  const [selectedInitialColor, setSelectedInitialColor] = useState(user?.initialColor || 'coral');

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

  const roleInfo = ROLE_METADATA[role] || { label: 'User', badge: 'bg-[#F5EFEB] text-[#B85D19] border-[#E8DFD8]' };
  const userName = user?.name || 'Authorized User';
  const userEmail = user?.email || 'user@dealflow360.com';

  const currentInitialPreset = INITIAL_COLORS.find(c => c.id === selectedInitialColor) || INITIAL_COLORS[0];

  // Helper component to render current avatar cleanly
  const renderAvatar = (size = 'w-10 h-10', textClass = 'text-base') => {
    if (avatarType === 'image' && selectedAvatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden bg-[#F5EFEB] ring-2 ring-[#E8DFD8] shrink-0`}>
          <img src={selectedAvatarImage} alt={userName} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full ${currentInitialPreset.bg} ${currentInitialPreset.text} flex items-center justify-center font-bold ${textClass} ring-2 ring-[#E8DFD8] shrink-0`}>
        {userName.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Dynamic Navigation Sections based on authenticated role
  const navSections = getNavigationForRole(role);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#1E1B18]/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 h-screen bg-[#FFFFFF] flex flex-col border-r border-[#EBE8E2] transition-all duration-300 ease-in-out shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)]
        ${sidebarOpen ? 'translate-x-0 w-[290px]' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-[290px]'}
      `}>
        {/* Brand Header — Larger & prominent logo */}
        <div className={`h-[76px] flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} border-b border-[#EBE8E2] shrink-0`}>
          <Link to={defaultRoute} className="flex items-center gap-3 overflow-hidden focus:outline-none group">
            {isCollapsed ? (
              <DealFlowLogo variant="light" iconOnly size="md" />
            ) : (
              <DealFlowLogo variant="light" size="md" />
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-[#78716C] hover:text-[#1E1B18] p-1.5 rounded-xl hover:bg-[#F5EFEB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Sections — Larger text, icons & comfortable padding */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed && (
                <h3 className="px-3.5 pb-1.5 text-[12px] font-bold uppercase tracking-[0.09em] text-[#8C827A]">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== defaultRoute && item.path !== '/sales/quotations' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.title : undefined}
                      className={`
                        flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold 
                        transition-all duration-150 ease-out select-none cursor-pointer group relative
                        active:scale-[0.98]
                        ${isActive 
                          ? 'bg-[#F5EFEB] text-[#1E1B18] font-bold border border-[#E8DFD8] shadow-xs' 
                          : 'text-[#57534E] hover:text-[#1E1B18] hover:bg-[#FAF8F5] active:bg-[#F5EFEB]'}
                        ${isCollapsed ? 'justify-center px-0 py-3' : ''}
                      `}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-[#B85D19]' : 'text-[#8C827A] group-hover:text-[#B85D19]'}`} />
                      
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#B85D19] border border-[#E8DFD8]">
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

        {/* Sidebar Footer: Collapse Toggle & Active Role Indicator */}
        <div className="p-3.5 border-t border-[#EBE8E2] hidden md:flex items-center justify-between text-xs bg-[#FAF8F5]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate text-xs font-bold text-[#57534E]">{roleInfo.label}</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] active:scale-95 rounded-xl transition-all ml-auto cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#FAF8F5] min-h-screen ${isCollapsed ? 'md:pl-20' : 'md:pl-[290px]'} transition-all duration-300 ease-in-out`}>
        {/* Top Header - Compact and seamless */}
        <header className="h-[52px] sm:h-[56px] bg-[#FAF8F5] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 border-b border-[#EBE8E2]/60 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] active:scale-95 rounded-xl md:hidden transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 flex items-center justify-center text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F5EFEB] active:scale-95 rounded-xl relative transition-all focus:outline-none cursor-pointer border border-transparent hover:border-[#EBE8E2]"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#B85D19] rounded-full ring-2 ring-[#FAF8F5]" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-xl py-0 z-50">
                  <div className="px-4 py-3.5 border-b border-[#EBE8E2] flex items-center justify-between">
                    <span className="font-bold text-[#1E1B18] text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-[#B85D19] hover:text-[#9E4E13] font-bold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#EBE8E2]/60">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3.5 hover:bg-[#FAF8F5] transition-colors ${!n.read ? 'bg-[#F5EFEB]/40' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#1E1B18]">{n.title}</p>
                          <span className="text-[10px] text-[#A8A29E] shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-[#78716C] mt-1">{n.desc}</p>
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
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#B85D19]/30 active:scale-95 transition-all focus:outline-none cursor-pointer"
              >
                {renderAvatar('w-10 h-10', 'text-base')}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-xl py-0 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-4 py-3.5 border-b border-[#EBE8E2] flex items-center gap-3 bg-[#FAF8F5]">
                    {renderAvatar('w-10 h-10', 'text-base')}
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[#1E1B18] truncate">{userName}</p>
                      <p className="text-xs text-[#78716C] truncate">{userEmail}</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); setProfileModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#44403C] hover:bg-[#F5EFEB] hover:text-[#1E1B18] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#78716C]" />
                      <span className="font-semibold">User Profile</span>
                    </button>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setSettingsModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#44403C] hover:bg-[#F5EFEB] hover:text-[#1E1B18] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[#78716C]" />
                      <span className="font-semibold">Settings & Avatar</span>
                    </button>

                    <div className="border-t border-[#EBE8E2] my-1"></div>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setLogoutModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span className="font-bold">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-0 bg-[#FAF8F5] min-h-[calc(100vh-56px)]">
          <Outlet />
        </main>
      </div>

      {/* ===== USER PROFILE VIEW MODAL ===== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-[2px]">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-2xl border border-[#EBE8E2] shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
              <h3 className="text-lg font-bold text-[#1E1B18]">Account Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-[#78716C] hover:text-[#1E1B18] p-1.5 rounded-xl hover:bg-[#F5EFEB] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 py-2">
              {renderAvatar('w-20 h-20', 'text-2xl')}
              <h4 className="text-base font-bold text-[#1E1B18]">{userName}</h4>
              <p className="text-xs text-[#78716C]">{userEmail}</p>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-xl space-y-2 text-xs text-[#78716C] border border-[#EBE8E2]">
              <div className="flex justify-between">
                <span className="font-semibold text-[#A8A29E] uppercase tracking-wide text-[10px]">Role Responsibility:</span>
                <span className="text-[#1E1B18] font-bold">{roleInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#A8A29E] uppercase tracking-wide text-[10px]">Default Workspace:</span>
                <span className="font-mono text-[#B85D19] font-bold">{defaultRoute}</span>
              </div>
              <p className="text-[11px] text-[#78716C] pt-1">
                {roleInfo.description}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SETTINGS & AVATAR MODAL ===== */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-[2px]">
          <div className="bg-[#FFFFFF] w-full max-w-lg rounded-2xl border border-[#EBE8E2] shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E2]">
              <h3 className="text-lg font-bold text-[#1E1B18]">Settings & Appearance</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="text-[#78716C] hover:text-[#1E1B18] p-1.5 rounded-xl hover:bg-[#F5EFEB] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F7] border border-[#EBE8E2] text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-2">Avatar Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'initial'}
                      onChange={() => setAvatarType('initial')}
                      className="accent-[#B85D19]"
                    />
                    <span className="text-[#1E1B18]">Initials with Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'image'}
                      onChange={() => setAvatarType('image')}
                      className="accent-[#B85D19]"
                    />
                    <span className="text-[#1E1B18]">Persona Avatar</span>
                  </label>
                </div>
              </div>

              {avatarType === 'initial' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-[#44403C]">Choose Background Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {INITIAL_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedInitialColor(c.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          selectedInitialColor === c.id ? 'border-[#B85D19] ring-2 ring-[#B85D19]/20 bg-[#F5EFEB]' : 'border-[#EBE8E2] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${c.bg} shrink-0`} />
                        <span className="text-[11px] font-semibold text-[#57534E] truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatarType === 'image' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-[#44403C]">Choose Persona Avatar</label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_IMAGES.map(av => (
                      <button
                        key={av.id}
                        onClick={() => setSelectedAvatarImage(av.url)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                          selectedAvatarImage === av.url ? 'border-[#B85D19] ring-2 ring-[#B85D19]/20 bg-[#F5EFEB]' : 'border-[#EBE8E2] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-10 h-10 rounded-full" />
                        <span className="text-[10px] font-semibold text-[#57534E] truncate w-full">{av.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EBE8E2]">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 text-xs font-bold text-white bg-[#B85D19] hover:bg-[#9E4E13] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGOUT CONFIRMATION ===== */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/40 backdrop-blur-[2px]">
          <div className="bg-[#FFFFFF] w-full max-w-sm rounded-2xl border border-[#EBE8E2] shadow-xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1E1B18]">Sign Out of DealFlow360?</h3>
              <p className="text-xs text-[#78716C]">You will be redirected to the secure login screen.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-[#78716C] hover:bg-[#F5EFEB] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
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
