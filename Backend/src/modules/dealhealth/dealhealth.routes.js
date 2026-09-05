import express from 'express';
import * as ctrl from './dealhealth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);
router.get('/', ctrl.getDealHealth);
router.post('/escalate', ctrl.escalateIssue);

export default router;
