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

import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/sales/Dashboard';
import QuotationsList from '../pages/sales/QuotationsList';
import QuotationBuilder from '../pages/sales/QuotationBuilder';
import Approvals from '../pages/sales/Approvals';
import FulfillmentList from '../pages/sales/FulfillmentList';
import SubscriptionsList from '../pages/sales/SubscriptionsList';
import InvoicesList from '../pages/sales/InvoicesList';
import DealHealth from '../pages/sales/DealHealth';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth routes under /auth/* */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/sales/*" element={<SalesLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="quotations/new" element={<QuotationBuilder />} />
          <Route path="quotations/:id" element={<div>Quotation Detail</div>} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="fulfillment" element={<FulfillmentList />} />
          <Route path="inventory" element={<div>Inventory</div>} />
          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="deal-health" element={<DealHealth />} />
        </Route>

        <Route path="/admin/*" element={<RoleRoute allowedRoles={['ADMIN', 'SALES_REP']} />}>
          <Route element={<AdminLayout />}>
            <Route path="products" element={<AdminProducts />} />
            <Route path="discount-rules" element={<AdminDiscountRules />} />
            <Route path="approval-rules" element={<AdminApprovalRules />} />
            <Route path="customers" element={<div>Customers</div>} />
            <Route path="warehouses" element={<div>Warehouses</div>} />
            <Route path="subscription-plans" element={<div>Subscription Plans</div>} />
            <Route path="reports" element={<div>Reports</div>} />
          </Route>
        </Route>
      </Route>

      <Route path="/customer/*" element={<CustomerLayout />}>
        <Route path="quotation/:id" element={<div>Customer Quotation View</div>} />
      </Route>

      <Route path="/unauthorized" element={<div>Unauthorized</div>} />
    </Routes>
  );
}
