import express from 'express';
import * as ctrl from './customer.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

// All customer portal routes require authentication
router.use(requireAuth);
router.use(requireRole(['CUSTOMER', 'ADMIN']));

router.get('/quotations', ctrl.listQuotations);
router.get('/quotations/:id', ctrl.getQuotation);
router.post('/quotations/:id/negotiate', ctrl.negotiate);
router.post('/quotations/:id/accept', ctrl.accept);
router.post('/quotations/:id/decline', ctrl.decline);

export default router;

