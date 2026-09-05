import { api } from '../../lib/axios';

export const adminApi = {
  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  
  getCustomerTiers: () => api.get('/admin/customer-tiers'),
  createCustomerTier: (data) => api.post('/admin/customer-tiers', data),
  
  getDiscountRules: () => api.get('/admin/discount-rules'),
  createDiscountRule: (data) => api.post('/admin/discount-rules', data),

  getApprovalRules: () => api.get('/admin/approval-rules'),
  createApprovalRule: (data) => api.post('/admin/approval-rules', data),
};
