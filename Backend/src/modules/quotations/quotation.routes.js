import express from 'express';
import * as quotationController from './quotation.controller.js';
import { validate, createQuotationSchema } from './quotation.validation.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth); // All quotation routes require auth

router.post('/', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), validate(createQuotationSchema), quotationController.createQuotation);
router.put('/:id', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), quotationController.updateQuotation);
router.get('/', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'FINANCE', 'OPERATIONS', 'CUSTOMER']), quotationController.listQuotations);
router.get('/:id', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'FINANCE', 'OPERATIONS', 'CUSTOMER']), quotationController.getQuotation);

// Lifecycle Transitions
router.post('/:id/submit', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), quotationController.submitQuotation);
router.post('/:id/send', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), quotationController.sendQuotation);
router.post('/:id/respond-negotiation', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), quotationController.respondNegotiation);
router.post('/:id/confirm', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'CUSTOMER']), quotationController.confirmQuotation);

export default router;
