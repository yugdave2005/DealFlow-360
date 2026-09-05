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

// Existing module mounts
router.use('/v1/auth', authRoutes);
router.use('/v1/dashboard', dashboardRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/quotations', quotationRoutes);
router.use('/v1/approvals', approvalRoutes);
router.use('/v1/upsell', upsellRoutes);
router.use('/v1/fulfillment', fulfillmentRoutes);
router.use('/v1/subscriptions', subscriptionRoutes);
router.use('/v1/invoices', invoiceRoutes);
router.use('/v1/deal-health', dealHealthRoutes);
router.use('/v1/customer-portal', customerPortalRoutes);

// NEW domain module mounts
router.use('/v1/products', productRoutes);
router.use('/v1/pricing', pricingRoutes);
router.use('/v1/inventory', inventoryRoutes);
router.use('/v1/discounts', discountRoutes);
router.use('/v1/warehouses', warehouseRoutes);
router.use('/v1/payments', paymentRoutes);
router.use('/v1/negotiations', negotiationRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/billing', billingRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/customers', customerRoutes);

export default router;
