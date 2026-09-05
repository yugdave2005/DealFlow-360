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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/sales/*" element={<SalesLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="quotations/new" element={<QuotationBuilder />} />
          <Route path="quotations/:id" element={<div>Quotation Detail</div>} />
          <Route path="approvals" element={<div>Approvals</div>} />
          <Route path="fulfillment" element={<div>Fulfillment</div>} />
          <Route path="inventory" element={<div>Inventory</div>} />
          <Route path="subscriptions" element={<div>Subscriptions</div>} />
          <Route path="invoices" element={<div>Invoices</div>} />
          <Route path="deal-health" element={<div>Deal Health</div>} />
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
