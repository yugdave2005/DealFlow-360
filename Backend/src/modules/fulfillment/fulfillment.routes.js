import express from 'express';
import * as fulfillmentController from './fulfillment.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/generate', requireRole(['ADMIN', 'OPERATIONS', 'FINANCE_OPERATIONS', 'SALES_REP', 'SALES_MANAGER']), fulfillmentController.generatePlan);
router.get('/', requireRole(['ADMIN', 'OPERATIONS', 'FINANCE_OPERATIONS', 'SALES_MANAGER', 'SALES_REP']), fulfillmentController.listPlans);
router.get('/:planId', requireRole(['ADMIN', 'OPERATIONS', 'FINANCE_OPERATIONS', 'SALES_MANAGER', 'SALES_REP']), fulfillmentController.getPlan);
router.post('/:planId/accept', requireRole(['ADMIN', 'OPERATIONS', 'FINANCE_OPERATIONS', 'SALES_REP', 'SALES_MANAGER']), fulfillmentController.acceptPlan);
router.post('/:planId/deliver', requireRole(['ADMIN', 'OPERATIONS', 'FINANCE_OPERATIONS', 'SALES_REP', 'SALES_MANAGER']), fulfillmentController.markDelivered);

export default router;

