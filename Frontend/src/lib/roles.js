/**
 * DealFlow360 Standard Roles
 */
export const ROLES = {
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE_OPERATIONS: 'FINANCE_OPERATIONS',
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
};

// Normalize DB roles (e.g. FINANCE / OPERATIONS) to DealFlow360 application roles
export const normalizeRole = (role) => {
  if (!role) return ROLES.SALES_REP;
  const upper = String(role).toUpperCase();
  if (upper === 'FINANCE' || upper === 'OPERATIONS' || upper === 'FINANCE_OPERATIONS') {
    return ROLES.FINANCE_OPERATIONS;
  }
  if (upper === 'SALES_MANAGER' || upper === 'MANAGER') {
    return ROLES.SALES_MANAGER;
  }
  if (upper === 'ADMIN' || upper === 'ADMINISTRATOR') {
    return ROLES.ADMIN;
  }
  if (upper === 'CUSTOMER' || upper === 'CLIENT') {
    return ROLES.CUSTOMER;
  }
  return ROLES.SALES_REP;
};

// Role default landing routes
export const ROLE_DEFAULT_ROUTES = {
  [ROLES.SALES_REP]: '/sales/dashboard',
  [ROLES.SALES_MANAGER]: '/manager/dashboard',
  [ROLES.FINANCE_OPERATIONS]: '/operations/dashboard',
  [ROLES.CUSTOMER]: '/portal',
  [ROLES.ADMIN]: '/admin/dashboard',
};

// Role Display Metadata
export const ROLE_METADATA = {
  [ROLES.SALES_REP]: {
    label: 'Sales Representative',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Create & manage quotations, negotiate discounts and track fulfillment.'
  },
  [ROLES.SALES_MANAGER]: {
    label: 'Sales Manager / Approver',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Review discount approvals, monitor team pipeline and deal health.'
  },
  [ROLES.FINANCE_OPERATIONS]: {
    label: 'Finance / Operations',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '2nd-level approvals, multi-hub warehouse fulfillment, subscriptions & hybrid billing.'
  },
  [ROLES.CUSTOMER]: {
    label: 'Customer Client',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Review quotations, submit counter-proposals and confirm orders.'
  },
  [ROLES.ADMIN]: {
    label: 'Platform Administrator',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Configure products, pricing tiers, approval matrices, and platform governance.'
  }
};
