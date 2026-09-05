import express from 'express';

const router = express.Router();

// Health Endpoints
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'DealFlow360 API' }));
router.get('/health/db', (req, res) => res.json({ status: 'OK', message: 'DB Health endpoint (Mock)' }));
router.get('/health/redis', (req, res) => res.json({ status: 'OK', message: 'Redis Health endpoint (Mock)' }));
router.get('/health/rabbitmq', (req, res) => res.json({ status: 'OK', message: 'RabbitMQ Health endpoint (Mock)' }));

import adminRoutes from '../modules/admin/routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import quotationRoutes from '../modules/quotations/quotation.routes.js';

// Module Routes
router.use('/v1/auth', authRoutes);
router.use('/v1/dashboard', dashboardRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/quotations', quotationRoutes);

export default router;
