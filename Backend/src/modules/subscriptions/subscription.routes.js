import express from 'express';
import * as ctrl from './subscription.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.patch('/:id', ctrl.modify);
router.post('/:id/cancel', ctrl.cancel);
router.post('/:id/prorate', ctrl.prorate);

export default router;
