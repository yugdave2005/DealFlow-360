import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { ROLES } from '../lib/roles';
import PageSuspenseFallback from '../components/common/PageSuspenseFallback';

// Layouts (Loaded eagerly for layout shell stability)
import AuthLayout from '../layouts/AuthLayout';
import SalesLayout from '../layouts/SalesLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Auth Pages (Lazy loaded)
const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const AuthCallback = lazy(() => import('../pages/auth/AuthCallback'));

// Sales Workspace Pages (Lazy loaded with code-splitting)
const QuotationsList = lazy(() => import('../pages/sales/QuotationsList'));
const QuotationBuilder = lazy(() => import('../pages/sales/QuotationBuilder'));
const QuotationDetail = lazy(() => import('../pages/sales/QuotationDetail'));
const Pipeline = lazy(() => import('../pages/sales/Pipeline'));
const Approvals = lazy(() => import('../pages/sales/Approvals'));
const FulfillmentList = lazy(() => import('../pages/sales/FulfillmentList'));
const WarehouseSplit = lazy(() => import('../pages/sales/WarehouseSplit'));
const SubscriptionsList = lazy(() => import('../pages/sales/SubscriptionsList'));
const InvoicesList = lazy(() => import('../pages/sales/InvoicesList'));
const BillingHub = lazy(() => import('../pages/sales/BillingHub'));
const Customers = lazy(() => import('../pages/sales/Customers'));
const CustomerDetail = lazy(() => import('../pages/sales/CustomerDetail'));
const DealHealth = lazy(() => import('../pages/sales/DealHealth'));
const Reports = lazy(() => import('../pages/sales/Reports'));

// Customer Portal Pages (Lazy loaded)
const CustomerQuotationsList = lazy(() => import('../pages/customer/CustomerQuotationsList'));
const CustomerNegotiationsList = lazy(() => import('../pages/customer/CustomerNegotiationsList'));
const CustomerProfile = lazy(() => import('../pages/customer/CustomerProfile'));
const CustomerQuotationView = lazy(() => import('../pages/customer/CustomerQuotationView'));
const CustomerInvoices = lazy(() => import('../pages/customer/CustomerInvoices'));

// Admin Configuration Pages (Lazy loaded)
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminDiscountRules = lazy(() => import('../pages/admin/AdminDiscountRules'));
const AdminApprovalRules = lazy(() => import('../pages/admin/AdminApprovalRules'));
const AdminWarehouses = lazy(() => import('../pages/admin/AdminWarehouses'));

// Common Pages
const Unauthorized = lazy(() => import('../pages/common/Unauthorized'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
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
    </Suspense>
  );
}
