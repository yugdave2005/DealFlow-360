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
  { id: 'coral', name: 'Warm Coral', bg: 'bg-[#D97757]', text: 'text-white' },
  { id: 'stone', name: 'Matte Stone', bg: 'bg-[#78716C]', text: 'text-white' },
  { id: 'forest', name: 'Deep Forest', bg: 'bg-[#3F8F63]', text: 'text-white' },
  { id: 'navy', name: 'Warm Navy', bg: 'bg-[#475569]', text: 'text-white' },
  { id: 'amber', name: 'Rich Amber', bg: 'bg-[#C98A32]', text: 'text-white' },
  { id: 'sienna', name: 'Burnt Sienna', bg: 'bg-[#A0522D]', text: 'text-white' },
  { id: 'steel', name: 'Steel Blue', bg: 'bg-[#5D83A8]', text: 'text-white' },
  { id: 'charcoal', name: 'Charcoal', bg: 'bg-[#3A3733]', text: 'text-white' },
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

  const roleInfo = ROLE_METADATA[role] || { label: 'User', badge: 'bg-[#F8E9E3] text-[#C96648] border-[#E9B8A7]' };
  const userName = user?.name || 'Authorized User';
  const userEmail = user?.email || 'user@dealflow360.com';

  const currentInitialPreset = INITIAL_COLORS.find(c => c.id === selectedInitialColor) || INITIAL_COLORS[0];

  // Helper component to render current avatar cleanly
  const renderAvatar = (size = 'w-9 h-9', textClass = 'text-sm') => {
    if (avatarType === 'image' && selectedAvatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden bg-[#F5F2ED] ring-2 ring-[#E6E1D9] shrink-0`}>
          <img src={selectedAvatarImage} alt={userName} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full ${currentInitialPreset.bg} ${currentInitialPreset.text} flex items-center justify-center font-semibold ${textClass} ring-1 ring-[#E6E1D9] shrink-0`}>
        {userName.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Dynamic Navigation Sections based on authenticated role
  const navSections = getNavigationForRole(role);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#171717]/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 h-screen bg-[#F7F5F1] flex flex-col border-r border-[#E6E1D9] transition-all duration-300 ease-in-out shrink-0
        ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-[280px]'}
      `}>
        {/* Brand Header */}
        <div className={`h-[68px] flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'} border-b border-[#E6E1D9] shrink-0`}>
          <Link to={defaultRoute} className="flex items-center gap-2.5 overflow-hidden focus:outline-none">
            {isCollapsed ? (
              <DealFlowLogo variant="light" iconOnly size="md" />
            ) : (
              <DealFlowLogo variant="light" size="md" />
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-[#6F6B66] hover:text-[#171717] p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#96918A]">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
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
                        flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium 
                        transition-all duration-150 ease-out select-none cursor-pointer group relative
                        active:scale-[0.97] active:translate-y-[0.5px]
                        ${isActive 
                          ? 'bg-white text-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E6E1D9] font-semibold' 
                          : 'text-[#6F6B66] hover:text-[#171717] hover:bg-[#EDE8E0] active:bg-[#E5DFD5]'}
                        ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}
                      `}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 ${isActive ? 'text-[#D97757]' : 'text-[#96918A] group-hover:text-[#171717]'}`} />
                      
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F8E9E3] text-[#C96648] border border-[#E9B8A7]">
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
        <div className="p-3 border-t border-[#E6E1D9] hidden md:flex items-center justify-between text-xs bg-[#F7F5F1]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-[#3F8F63]" />
              <span className="truncate text-xs font-medium text-[#6F6B66]">{roleInfo.label}</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-[#96918A] hover:text-[#171717] hover:bg-[#EDE8E0] active:scale-90 rounded-lg transition-all ml-auto cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#FAF9F6] min-h-screen ${isCollapsed ? 'md:pl-20' : 'md:pl-[280px]'} transition-all duration-300 ease-in-out`}>
        {/* Top Header - Compact and seamless without divider */}
        <header className="h-[44px] sm:h-[48px] bg-[#FAF9F6] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-[#6F6B66] hover:text-[#171717] hover:bg-[#EDE8E0] active:scale-95 rounded-lg md:hidden transition-all cursor-pointer"
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
                className="w-10 h-10 flex items-center justify-center text-[#6F6B66] hover:text-[#171717] hover:bg-[#EDE8E0] active:scale-95 rounded-[12px] relative transition-all focus:outline-none cursor-pointer border border-transparent hover:border-[#E6E1D9]"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[1.8]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#D97757] rounded-full ring-2 ring-[#FAF9F6]" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#E6E1D9] shadow-df-lg py-0 z-50">
                  <div className="px-4 py-3 border-b border-[#EEEAE4] flex items-center justify-between">
                    <span className="font-semibold text-[#171717] text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-[#D97757] hover:text-[#C96648] font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#EEEAE4]">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3.5 hover:bg-[#FBFAF8] transition-colors ${!n.read ? 'bg-[#F8E9E3]/20' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#171717]">{n.title}</p>
                          <span className="text-[10px] text-[#96918A] shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-[#6F6B66] mt-1">{n.desc}</p>
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
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#D97757]/30 active:scale-95 transition-all focus:outline-none cursor-pointer"
              >
                {renderAvatar('w-10 h-10', 'text-base')}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#E6E1D9] shadow-df-lg py-0 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-[#EEEAE4] flex items-center gap-3">
                    {renderAvatar('w-10 h-10', 'text-base')}
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-[#171717] truncate">{userName}</p>
                      <p className="text-xs text-[#96918A] truncate">{userEmail}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); setProfileModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#6F6B66] hover:bg-[#F2EFEA] hover:text-[#171717] flex items-center gap-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#96918A]" />
                      <span>User Profile</span>
                    </button>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setSettingsModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#6F6B66] hover:bg-[#F2EFEA] hover:text-[#171717] flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#96918A]" />
                      <span>Settings & Avatar</span>
                    </button>

                    <div className="border-t border-[#EEEAE4] my-1"></div>

                    <button
                      onClick={() => { setProfileDropdownOpen(false); setLogoutModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#C95757] hover:bg-[#FBEAEA] flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-[#C95757]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-0 bg-[#FAF9F6] min-h-[calc(100vh-68px)]">
          <Outlet />
        </main>
      </div>

      {/* ===== USER PROFILE VIEW MODAL ===== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-xl border border-[#E6E1D9] shadow-df-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
              <h3 className="text-lg font-semibold text-[#171717]">Account Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-[#96918A] hover:text-[#171717] p-1 rounded-lg hover:bg-[#F2EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 py-2">
              {renderAvatar('w-20 h-20', 'text-2xl')}
              <h4 className="text-base font-semibold text-[#171717]">{userName}</h4>
              <p className="text-xs text-[#96918A]">{userEmail}</p>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="bg-[#F5F2ED] p-4 rounded-[10px] space-y-2 text-xs text-[#6F6B66] border border-[#EEEAE4]">
              <div className="flex justify-between">
                <span className="font-medium text-[#96918A] uppercase tracking-wide text-[11px]">Role Responsibility:</span>
                <span className="text-[#171717] font-medium">{roleInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#96918A] uppercase tracking-wide text-[11px]">Default Workspace:</span>
                <span className="font-mono text-[#D97757] font-semibold">{defaultRoute}</span>
              </div>
              <p className="text-[11px] text-[#96918A] pt-1 italic">
                {roleInfo.description}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="df-btn-primary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SETTINGS & AVATAR MODAL ===== */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-lg rounded-xl border border-[#E6E1D9] shadow-df-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE4]">
              <h3 className="text-lg font-semibold text-[#171717]">Settings & Appearance</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="text-[#96918A] hover:text-[#171717] p-1 rounded-lg hover:bg-[#F2EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="df-label">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="df-input"
                />
              </div>

              <div>
                <label className="df-label mb-2">Avatar Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'initial'}
                      onChange={() => setAvatarType('initial')}
                      className="accent-[#D97757]"
                    />
                    <span className="text-[#171717] font-medium">Initials with Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="avatarType"
                      checked={avatarType === 'image'}
                      onChange={() => setAvatarType('image')}
                      className="accent-[#D97757]"
                    />
                    <span className="text-[#171717] font-medium">Persona Avatar</span>
                  </label>
                </div>
              </div>

              {avatarType === 'initial' && (
                <div className="space-y-2 pt-2">
                  <label className="df-label">Choose Background Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {INITIAL_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedInitialColor(c.id)}
                        className={`p-2 rounded-[10px] border flex items-center gap-2 text-left transition-all ${
                          selectedInitialColor === c.id ? 'border-[#D97757] ring-2 ring-[#D97757]/20 bg-[#F8E9E3]/30' : 'border-[#E6E1D9] hover:bg-[#F2EFEA]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${c.bg} shrink-0`} />
                        <span className="text-[11px] font-medium text-[#6F6B66] truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatarType === 'image' && (
                <div className="space-y-2 pt-2">
                  <label className="df-label">Choose Persona Avatar</label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_IMAGES.map(av => (
                      <button
                        key={av.id}
                        onClick={() => setSelectedAvatarImage(av.url)}
                        className={`p-2 rounded-[10px] border flex flex-col items-center text-center gap-1 transition-all ${
                          selectedAvatarImage === av.url ? 'border-[#D97757] ring-2 ring-[#D97757]/20 bg-[#F8E9E3]/30' : 'border-[#E6E1D9] hover:bg-[#F2EFEA]'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-10 h-10 rounded-full" />
                        <span className="text-[10px] font-medium text-[#6F6B66] truncate w-full">{av.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EEEAE4]">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="df-btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="df-btn-primary text-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGOUT CONFIRMATION ===== */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-xl border border-[#E6E1D9] shadow-df-lg p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FBEAEA] text-[#C95757] flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#171717]">Sign Out of DealFlow360?</h3>
              <p className="text-sm text-[#6F6B66]">You will be redirected to the login screen.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 df-btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 h-[42px] px-4 text-sm font-semibold text-white bg-[#C95757] hover:bg-[#B44A4A] rounded-[9px] transition-colors cursor-pointer"
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
