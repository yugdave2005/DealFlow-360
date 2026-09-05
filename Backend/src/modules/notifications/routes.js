import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.patch('/:id/read', ctrl.markRead);
router.post('/mark-all-read', ctrl.markAllRead);

export default router;
