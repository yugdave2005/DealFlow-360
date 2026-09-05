import express from 'express';
import * as quotationController from './quotation.controller.js';
import { validate, createQuotationSchema } from './quotation.validation.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth); // All quotation routes require auth

router.post('/', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN']), validate(createQuotationSchema), quotationController.createQuotation);
router.get('/', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'FINANCE', 'OPERATIONS']), quotationController.listQuotations);

export default router;
