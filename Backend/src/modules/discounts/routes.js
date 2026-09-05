import express from 'express';
import * as ctrl from './controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/validate', ctrl.validate);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

export default router;
