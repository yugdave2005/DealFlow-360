import express from 'express';

const router = express.Router();

// Health Endpoints
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'DealFlow360 API' }));
router.get('/health/db', (req, res) => res.json({ status: 'OK', message: 'DB Health endpoint (Mock)' }));
router.get('/health/redis', (req, res) => res.json({ status: 'OK', message: 'Redis Health endpoint (Mock)' }));
router.get('/health/rabbitmq', (req, res) => res.json({ status: 'OK', message: 'RabbitMQ Health endpoint (Mock)' }));

// Existing module routes
import adminRoutes from '../modules/admin/routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import quotationRoutes from '../modules/quotations/quotation.routes.js';
import approvalRoutes from '../modules/approvals/approval.routes.js';
import upsellRoutes from '../modules/upsell/upsell.routes.js';
import fulfillmentRoutes from '../modules/fulfillment/fulfillment.routes.js';
import subscriptionRoutes from '../modules/subscriptions/subscription.routes.js';
import invoiceRoutes from '../modules/invoices/invoice.routes.js';
import dealHealthRoutes from '../modules/dealhealth/dealhealth.routes.js';
import customerPortalRoutes from '../modules/customer/customer.routes.js';

// NEW domain module routes
import productRoutes from '../modules/products/routes.js';
import pricingRoutes from '../modules/pricing/routes.js';
import inventoryRoutes from '../modules/inventory/routes.js';
import discountRoutes from '../modules/discounts/routes.js';
import warehouseRoutes from '../modules/warehouses/routes.js';
import paymentRoutes from '../modules/payments/routes.js';
import negotiationRoutes from '../modules/negotiations/routes.js';
import notificationRoutes from '../modules/notifications/routes.js';
import billingRoutes from '../modules/billing/routes.js';
import userRoutes from '../modules/users/routes.js';
import customerRoutes from '../modules/customers/routes.js';

// Mount all module routes under both /v1/x and /x for universal URL compatibility
const mountRoute = (path, routeHandler) => {
  router.use(`/v1${path}`, routeHandler);
  router.use(path, routeHandler);
};

// Module mounts
mountRoute('/auth', authRoutes);
mountRoute('/dashboard', dashboardRoutes);
mountRoute('/admin', adminRoutes);
mountRoute('/quotations', quotationRoutes);
mountRoute('/approvals', approvalRoutes);
mountRoute('/upsell', upsellRoutes);
mountRoute('/fulfillment', fulfillmentRoutes);
mountRoute('/subscriptions', subscriptionRoutes);
mountRoute('/invoices', invoiceRoutes);
mountRoute('/deal-health', dealHealthRoutes);
mountRoute('/customer-portal', customerPortalRoutes);
mountRoute('/products', productRoutes);
mountRoute('/pricing', pricingRoutes);
mountRoute('/inventory', inventoryRoutes);
mountRoute('/discounts', discountRoutes);
mountRoute('/warehouses', warehouseRoutes);
mountRoute('/payments', paymentRoutes);
mountRoute('/negotiations', negotiationRoutes);
mountRoute('/notifications', notificationRoutes);
mountRoute('/billing', billingRoutes);
mountRoute('/users', userRoutes);
mountRoute('/customers', customerRoutes);

export default router;
