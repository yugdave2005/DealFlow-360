import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/version/:versionId', ctrl.getByVersion);
router.get('/quotation/:quotationId', ctrl.getByQuotation);
router.post('/', ctrl.create);

export default router;
