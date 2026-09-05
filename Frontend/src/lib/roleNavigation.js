import { 
  LayoutDashboard, 
  FileText, 
  Columns3, 
  CheckSquare, 
  Truck, 
  RefreshCw, 
  Receipt, 
  Users, 
  Activity, 
  BarChart3, 
  Package, 
  Sliders, 
  ShieldCheck, 
  Building2, 
  Boxes, 
  CreditCard, 
  MessageSquare, 
  ShoppingBag, 
  User as UserIcon,
  Shield,
  Layers,
  History,
  Settings
} from 'lucide-react';
import { ROLES } from './roles';

/**
 * Role-Based Navigation Matrix for DealFlow360
 */
export const ROLE_NAVIGATION = {
  // 1. SALES REPRESENTATIVE
  [ROLES.SALES_REP]: [
    {
      title: 'Sales Pipeline',
      items: [
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
      ]
    },
    {
      title: 'Customers',
      items: [
        { title: 'Customers', path: '/sales/customers', icon: Users },
      ]
    }
  ],

  // 2. SALES MANAGER / APPROVER
  [ROLES.SALES_MANAGER]: [
    {
      title: 'Sales Management',
      items: [
        { title: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { title: 'Quotations', path: '/sales/quotations', icon: FileText },
        { title: 'Pipeline', path: '/sales/pipeline', icon: Columns3 },
        { title: 'Approvals', path: '/sales/approvals', icon: CheckSquare, badge: 'Queue' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { title: 'Deal Health', path: '/sales/deal-health', icon: Activity },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { title: 'Discount Rules', path: '/admin/discount-rules', icon: Sliders },
        { title: 'Approval Rules', path: '/admin/approval-rules', icon: ShieldCheck },
      ]
    }
  ],

  // 3. FINANCE / OPERATIONS
  [ROLES.FINANCE_OPERATIONS]: [
    {
      title: 'Operations',
      items: [
        { title: 'Dashboard', path: '/operations/dashboard', icon: LayoutDashboard },
        { title: 'Approvals', path: '/sales/approvals', icon: CheckSquare, badge: 'Tier 2' },
        { title: 'Fulfillment', path: '/sales/fulfillment', icon: Truck },
      ]
    },
    {
      title: 'Billing',
      items: [
        { title: 'Invoices', path: '/sales/invoices', icon: Receipt },
        { title: 'Subscriptions', path: '/sales/subscriptions', icon: RefreshCw },
      ]
    }
  ],

  // 4. CUSTOMER / PORTAL
  [ROLES.CUSTOMER]: [
    {
      title: 'My Quotations',
      items: [
        { title: 'Quotations', path: '/portal/quotations', icon: FileText },
      ]
    },
    {
      title: 'Negotiations',
      items: [
        { title: 'Negotiations', path: '/portal/negotiations', icon: MessageSquare },
      ]
    },
    {
      title: 'Account',
      items: [
        { title: 'Profile', path: '/portal/profile', icon: UserIcon },
      ]
    }
  ],

  // 5. ADMIN
  [ROLES.ADMIN]: [
    {
      title: 'Overview',
      items: [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { title: 'Products', path: '/admin/products', icon: Package },
        { title: 'Discount Tiers', path: '/admin/discount-rules', icon: Sliders },
        { title: 'Approval Rules', path: '/admin/approval-rules', icon: ShieldCheck },
        { title: 'Warehouses', path: '/admin/warehouses', icon: Boxes },
        { title: 'Subscription Plans', path: '/admin/subscription-plans', icon: Layers },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { title: 'Reports', path: '/admin/reports', icon: BarChart3 },
      ]
    }
  ]
};

export const getNavigationForRole = (role) => {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION[ROLES.SALES_REP];
};
