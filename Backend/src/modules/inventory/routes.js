import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.get('/product/:productId', ctrl.getByProduct);
router.get('/availability/:productId', ctrl.availability);
router.post('/adjust', ctrl.adjust);
router.post('/reserve', ctrl.reserve);
router.post('/release', ctrl.release);

export default router;
