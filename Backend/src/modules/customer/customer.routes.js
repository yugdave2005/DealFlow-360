import express from 'express';
import * as ctrl from './customer.controller.js';

const router = express.Router();

// No strict internal JWT auth here, assume Customer JWT or open token for demo
router.get('/quotations/:id', ctrl.getQuotation);
router.post('/quotations/:id/negotiate', ctrl.negotiate);
router.post('/quotations/:id/accept', ctrl.accept);

export default router;
