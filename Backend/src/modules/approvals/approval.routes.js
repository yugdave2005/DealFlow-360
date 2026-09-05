import express from 'express';
import * as approvalController from './approval.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth);

// Sales rep submits their quotation for approval
router.post('/quotations/:quotationId/submit', requireRole(['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'FINANCE_OPERATIONS']), approvalController.submitForApproval);

// Manager/Admin views pending approvals for their role
router.get('/pending', requireRole(['SALES_MANAGER', 'ADMIN', 'FINANCE_OPERATIONS', 'FINANCE', 'SALES_REP', 'OPERATIONS']), approvalController.getPendingApprovals);

// Manager/Admin actions an approval (approve/reject/return)
router.post('/:approvalId/action', requireRole(['SALES_MANAGER', 'ADMIN', 'FINANCE_OPERATIONS', 'FINANCE']), approvalController.actionApproval);

export default router;
