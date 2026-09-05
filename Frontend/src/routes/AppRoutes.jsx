import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AuthLayout from '../layouts/AuthLayout';
import SalesLayout from '../layouts/SalesLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminDiscountRules from '../pages/admin/AdminDiscountRules';
import AdminApprovalRules from '../pages/admin/AdminApprovalRules';

import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/sales/Dashboard';
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
import CustomerQuotationView from '../pages/customer/CustomerQuotationView';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

      {/* Auth routes under /auth/* */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* DealFlow360 Sales Workspace Routes */}
        <Route path="/sales/*" element={<SalesLayout />}>
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
          
          {/* Customers */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          
          {/* Insights */}
          <Route path="deal-health" element={<DealHealth />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Catalog */}
          <Route path="products" element={<AdminProducts />} />
        </Route>

        <Route path="/admin/*" element={<RoleRoute allowedRoles={['ADMIN', 'SALES_REP']} />}>
          <Route element={<AdminLayout />}>
            <Route path="products" element={<AdminProducts />} />
            <Route path="discount-rules" element={<AdminDiscountRules />} />
            <Route path="approval-rules" element={<AdminApprovalRules />} />
            <Route path="customers" element={<Customers />} />
            <Route path="warehouses" element={<WarehouseSplit />} />
            <Route path="subscription-plans" element={<SubscriptionsList />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      {/* Separate Restricted Customer Portal */}
      <Route path="/customer/*" element={<CustomerLayout />}>
        <Route path="quotation/:id" element={<CustomerQuotationView />} />
      </Route>

      <Route path="/unauthorized" element={<div>Unauthorized</div>} />
    </Routes>
  );
}
