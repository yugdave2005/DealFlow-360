import express from 'express';
import * as ctrl from './invoice.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/generate', ctrl.generate);
router.post('/:id/pay', ctrl.recordPayment);

export default router;
