import express from 'express';

const router = express.Router();

// Health Endpoints
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'DealFlow360 API' }));
router.get('/health/db', (req, res) => res.json({ status: 'OK', message: 'DB Health endpoint (Mock)' }));
router.get('/health/redis', (req, res) => res.json({ status: 'OK', message: 'Redis Health endpoint (Mock)' }));
router.get('/health/rabbitmq', (req, res) => res.json({ status: 'OK', message: 'RabbitMQ Health endpoint (Mock)' }));

// Module Routes
// router.use('/v1/auth', authRoutes);
// etc...

export default router;
