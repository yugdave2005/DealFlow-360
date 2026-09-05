import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/summary/:customerId', ctrl.summary);
router.get('/summary', ctrl.summary);
router.get('/tax', ctrl.tax);
router.get('/proration', ctrl.proration);

export default router;
