import express from 'express';
import * as fulfillmentController from './fulfillment.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/generate', requireRole(['ADMIN', 'OPERATIONS']), fulfillmentController.generatePlan);
router.get('/', requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']), fulfillmentController.listPlans);
router.get('/:planId', requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']), fulfillmentController.getPlan);
router.post('/:planId/accept', requireRole(['ADMIN', 'OPERATIONS']), fulfillmentController.acceptPlan);

export default router;
