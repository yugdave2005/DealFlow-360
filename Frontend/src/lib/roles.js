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

// Role default landing routes (dashboards removed)
export const ROLE_DEFAULT_ROUTES = {
  [ROLES.SALES_REP]: '/sales/quotations',
  [ROLES.SALES_MANAGER]: '/sales/approvals',
  [ROLES.FINANCE_OPERATIONS]: '/sales/approvals',
  [ROLES.CUSTOMER]: '/portal/quotations',
  [ROLES.ADMIN]: '/admin/products',
};

// Role Display Metadata
export const ROLE_METADATA = {
  [ROLES.SALES_REP]: {
    label: 'Sales Representative',
    badge: 'bg-[#F5EFEB] text-[#44403C] border-[#E8DFD8]',
    description: 'Create & manage quotations, negotiate discounts and track fulfillment.'
  },
  [ROLES.SALES_MANAGER]: {
    label: 'Sales Manager / Approver',
    badge: 'bg-[#F5EFEB] text-[#B85D19] border-[#E8DFD8]',
    description: 'Review discount approvals, monitor team pipeline and deal health.'
  },
  [ROLES.FINANCE_OPERATIONS]: {
    label: 'Finance / Operations',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: '2nd-level approvals, multi-hub warehouse fulfillment, subscriptions & hybrid billing.'
  },
  [ROLES.CUSTOMER]: {
    label: 'Customer Client',
    badge: 'bg-[#F5EFEB] text-[#44403C] border-[#E8DFD8]',
    description: 'Review quotations, submit counter-proposals and confirm orders.'
  },
  [ROLES.ADMIN]: {
    label: 'Platform Administrator',
    badge: 'bg-[#F5EFEB] text-[#B85D19] border-[#E8DFD8]',
    description: 'Configure products, pricing tiers, approval matrices, and platform governance.'
  }
};
