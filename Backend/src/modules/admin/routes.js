import express from 'express';
import * as adminController from './controller.js';

const router = express.Router();

router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/customer-tiers', adminController.getCustomerTiers);
router.post('/customer-tiers', adminController.createCustomerTier);

router.get('/pricing', adminController.getProductPricing);
router.post('/pricing', adminController.createProductPricing);

router.get('/discount-rules', adminController.getDiscountRules);
router.post('/discount-rules', adminController.createDiscountRule);
router.delete('/discount-rules/:id', adminController.deleteDiscountRule);

router.get('/approval-rules', adminController.getApprovalRules);
router.post('/approval-rules', adminController.createApprovalRule);
router.delete('/approval-rules/:id', adminController.deleteApprovalRule);

router.get('/warehouses', adminController.getWarehouses);
router.post('/warehouses', adminController.createWarehouse);

router.get('/customers', adminController.getCustomers);

export default router;
