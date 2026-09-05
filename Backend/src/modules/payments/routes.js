import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.get('/invoice/:invoiceId', ctrl.getByInvoice);
router.post('/', ctrl.record);

export default router;
