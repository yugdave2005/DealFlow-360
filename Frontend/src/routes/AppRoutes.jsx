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
import AuthCallback from '../pages/auth/AuthCallback';

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
import BillingHub from '../pages/sales/BillingHub';
import Customers from '../pages/sales/Customers';
import CustomerDetail from '../pages/sales/CustomerDetail';
import DealHealth from '../pages/sales/DealHealth';
import Reports from '../pages/sales/Reports';

// Customer Portal Pages
import CustomerQuotationsList from '../pages/customer/CustomerQuotationsList';
import CustomerNegotiationsList from '../pages/customer/CustomerNegotiationsList';
import CustomerProfile from '../pages/customer/CustomerProfile';
import CustomerQuotationView from '../pages/customer/CustomerQuotationView';
import CustomerInvoices from '../pages/customer/CustomerInvoices';

// Admin Configuration Pages
import AdminProducts from '../pages/admin/AdminProducts';
import AdminDiscountRules from '../pages/admin/AdminDiscountRules';
import AdminApprovalRules from '../pages/admin/AdminApprovalRules';
import AdminWarehouses from '../pages/admin/AdminWarehouses';

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
        <Route path="callback" element={<AuthCallback />} />
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
            <Route index element={<Navigate to="/sales/quotations" replace />} />
            <Route path="dashboard" element={<Navigate to="/sales/quotations" replace />} />
            
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
            <Route path="billing" element={<BillingHub />} />
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

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/sales/quotations" replace />} />
          </Route>
        </Route>

        {/* 2. SALES MANAGER WORKSPACE */}
        <Route 
          path="/manager/*" 
          element={<RoleRoute allowedRoles={[ROLES.SALES_MANAGER, ROLES.ADMIN]} />}
        >
          <Route element={<SalesLayout />}>
            <Route index element={<Navigate to="/sales/approvals" replace />} />
            <Route path="dashboard" element={<Navigate to="/sales/approvals" replace />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="deal-health" element={<DealHealth />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/sales/approvals" replace />} />
          </Route>
        </Route>

        {/* 3. FINANCE & OPERATIONS WORKSPACE */}
        <Route 
          path="/operations/*" 
          element={<RoleRoute allowedRoles={[ROLES.FINANCE_OPERATIONS, ROLES.ADMIN]} />}
        >
          <Route element={<SalesLayout />}>
            <Route index element={<Navigate to="/sales/approvals" replace />} />
            <Route path="dashboard" element={<Navigate to="/sales/approvals" replace />} />
            <Route path="fulfillment" element={<FulfillmentList />} />
            <Route path="fulfillment/:orderId" element={<WarehouseSplit />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="billing" element={<BillingHub />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="*" element={<Navigate to="/sales/approvals" replace />} />
          </Route>
        </Route>

        {/* 4. CUSTOMER RESTRICTED PORTAL */}
        <Route 
          path="/portal/*" 
          element={<RoleRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]} />}
        >
          <Route element={<CustomerLayout />}>
            <Route index element={<Navigate to="/portal/quotations" replace />} />
            <Route path="dashboard" element={<Navigate to="/portal/quotations" replace />} />
            <Route path="quotations" element={<CustomerQuotationsList />} />
            <Route path="quotations/:id" element={<CustomerQuotationView />} />
            <Route path="negotiations" element={<CustomerNegotiationsList />} />
            <Route path="billing" element={<BillingHub />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="*" element={<Navigate to="/portal/quotations" replace />} />
          </Route>
        </Route>

        {/* Dedicated Standalone Customer Quotation Review Routes */}
        <Route path="/customer/*">
          <Route index element={<Navigate to="/customer/quotations" replace />} />
          <Route path="dashboard" element={<Navigate to="/customer/quotations" replace />} />
          <Route path="quotations" element={<CustomerQuotationsList />} />
          <Route path="quotations/:id" element={<CustomerQuotationView />} />
          <Route path="quotation/:id" element={<CustomerQuotationView />} />
          <Route path="negotiations" element={<CustomerNegotiationsList />} />
          <Route path="billing" element={<BillingHub />} />
          <Route path="invoices" element={<CustomerInvoices />} />
        </Route>

        {/* 5. ADMIN PLATFORM CONFIGURATION WORKSPACE */}
        <Route 
          path="/admin/*" 
          element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SALES_MANAGER]} />}
        >
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/products" replace />} />
            <Route path="dashboard" element={<Navigate to="/admin/products" replace />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="discount-rules" element={<AdminDiscountRules />} />
            <Route path="approval-rules" element={<AdminApprovalRules />} />
            <Route path="warehouses" element={<AdminWarehouses />} />
            <Route path="subscription-plans" element={<AdminDiscountRules />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/admin/products" replace />} />
          </Route>
        </Route>

      </Route>

      {/* Unauthorized Access Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Global Catch-all */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
