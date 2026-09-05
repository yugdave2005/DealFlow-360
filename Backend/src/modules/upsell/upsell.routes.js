import express from 'express';
import * as upsellController from './upsell.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/suggestions', upsellController.getSuggestions);
router.get('/suggestions', upsellController.getSuggestions);

export default router;
