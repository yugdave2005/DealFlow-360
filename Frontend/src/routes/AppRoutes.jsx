import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { ROLES } from '../lib/roles';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import SalesLayout from '../layouts/SalesLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Role Dashboards
import Dashboard from '../pages/sales/Dashboard'; // Sales Rep Dashboard
import ManagerDashboard from '../pages/manager/ManagerDashboard'; // Sales Manager Dashboard
import OperationsDashboard from '../pages/operations/OperationsDashboard'; // Finance/Operations Dashboard
import CustomerPortalDashboard from '../pages/customer/CustomerPortalDashboard'; // Customer Dashboard
import AdminDashboard from '../pages/admin/AdminDashboard'; // Admin Dashboard

// Sales Workspace Pages
import QuotationsList from '../pages/sales/QuotationsList';
import QuotationBuilder from '../pages/sales/QuotationBuilder';
import QuotationDetail from '../pages/sales/QuotationDetail';
import Pipeline from '../pages/sales/Pipeline';
import Approvals from '../pages/sales/Approvals';
import FulfillmentList from '../pages/sales/FulfillmentList';
import WarehouseSplit from '../pages/sales/WarehouseSplit';
import SubscriptionsList from '../pages/sales/SubscriptionsList';
import InvoicesList from '../pages/sales/InvoicesList';
import Customers from '../pages/sales/Customers';
import CustomerDetail from '../pages/sales/CustomerDetail';
import DealHealth from '../pages/sales/DealHealth';
import Reports from '../pages/sales/Reports';

// Customer Portal Pages
import CustomerQuotationsList from '../pages/customer/CustomerQuotationsList';
import CustomerNegotiationsList from '../pages/customer/CustomerNegotiationsList';
import CustomerOrdersList from '../pages/customer/CustomerOrdersList';
import CustomerProfile from '../pages/customer/CustomerProfile';
import CustomerQuotationView from '../pages/customer/CustomerQuotationView';

// Admin Configuration Pages
import AdminProducts from '../pages/admin/AdminProducts';
import AdminDiscountRules from '../pages/admin/AdminDiscountRules';
import AdminApprovalRules from '../pages/admin/AdminApprovalRules';

// Common / Error Pages
import Unauthorized from '../pages/common/Unauthorized';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

      {/* Auth Public Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* =========================================================================
          PROTECTED ROLE-BASED WORKSPACES
      ========================================================================= */}
      <Route element={<ProtectedRoute />}>
        
        {/* 1. SALES REPRESENTATIVE WORKSPACE */}
        <Route 
          path="/sales/*" 
          element={<RoleRoute allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE_OPERATIONS, ROLES.ADMIN]} />}
        >
          <Route element={<SalesLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Sales Pipeline */}
            <Route path="quotations" element={<QuotationsList />} />
            <Route path="quotations/new" element={<QuotationBuilder />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="quotations/:id/edit" element={<QuotationBuilder />} />
            <Route path="pipeline" element={<Pipeline />} />
            
            {/* Deal Operations */}
            <Route path="approvals" element={<Approvals />} />
            <Route path="approvals/:id" element={<Approvals />} />
            <Route path="fulfillment" element={<FulfillmentList />} />
            <Route path="fulfillment/:orderId" element={<WarehouseSplit />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="invoices" element={<InvoicesList />} />
            
            {/* Customers Directory */}
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            
            {/* Insights */}
            <Route path="deal-health" element={<DealHealth />} />
            <Route path="reports" element={<Reports />} />
            
            {/* Catalog */}
            <Route path="products" element={<AdminProducts />} />
          </Route>
        </Route>

        {/* 2. SALES MANAGER WORKSPACE */}
        <Route 
          path="/manager/*" 
          element={<RoleRoute allowedRoles={[ROLES.SALES_MANAGER, ROLES.ADMIN]} />}
        >
          <Route element={<SalesLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="deal-health" element={<DealHealth />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        {/* 3. FINANCE & OPERATIONS WORKSPACE */}
        <Route 
          path="/operations/*" 
          element={<RoleRoute allowedRoles={[ROLES.FINANCE_OPERATIONS, ROLES.ADMIN]} />}
        >
          <Route element={<SalesLayout />}>
            <Route index element={<OperationsDashboard />} />
            <Route path="dashboard" element={<OperationsDashboard />} />
            <Route path="fulfillment" element={<FulfillmentList />} />
            <Route path="fulfillment/:orderId" element={<WarehouseSplit />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
          </Route>
        </Route>

        {/* 4. CUSTOMER RESTRICTED PORTAL */}
        <Route 
          path="/portal/*" 
          element={<RoleRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]} />}
        >
          <Route element={<CustomerLayout />}>
            <Route index element={<CustomerPortalDashboard />} />
            <Route path="quotations" element={<CustomerQuotationsList />} />
            <Route path="quotations/:id" element={<CustomerQuotationView />} />
            <Route path="negotiations" element={<CustomerNegotiationsList />} />
            <Route path="orders" element={<CustomerOrdersList />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Dedicated Standalone Customer Quotation Review Route */}
        <Route path="/customer/*">
          <Route path="quotation/:id" element={<CustomerQuotationView />} />
        </Route>

        {/* 5. ADMIN PLATFORM CONFIGURATION WORKSPACE */}
        <Route 
          path="/admin/*" 
          element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SALES_MANAGER]} />}
        >
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            
            {/* Configuration */}
            <Route path="products" element={<AdminProducts />} />
            <Route path="discount-rules" element={<AdminDiscountRules />} />
            <Route path="approval-rules" element={<AdminApprovalRules />} />
            <Route path="warehouses" element={<WarehouseSplit />} />
            <Route path="subscription-plans" element={<SubscriptionsList />} />
            
            {/* Management & Analytics */}
            <Route path="users" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-900 mb-2">User Directory</h2><p className="text-slate-500">Manage internal sales representatives, sales managers, finance users, and client portal credentials.</p></div>} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Reports />} />
            <Route path="audit-logs" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-900 mb-2">System Audit Logs</h2><p className="text-slate-500">Immutable ledger of quotation revisions, approvals, discount overrides, and user auth events.</p></div>} />
            <Route path="settings" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-900 mb-2">System Governance Settings</h2><p className="text-slate-500">Global currency definitions (₹ INR), tax brackets, and approval SLA configurations.</p></div>} />
          </Route>
        </Route>

      </Route>

      {/* 403 Forbidden Access Denied Page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
