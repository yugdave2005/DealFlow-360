import express from 'express';
import { getSalesDashboard } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.get('/sales', requireAuth, requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), getSalesDashboard);

export default router;
