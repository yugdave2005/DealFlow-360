import { api } from '../../lib/axios';

export const adminApi = {
  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: ({ id, ...data }) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  getCustomerTiers: () => api.get('/admin/customer-tiers'),
  createCustomerTier: (data) => api.post('/admin/customer-tiers', data),
  
  getDiscountRules: () => api.get('/admin/discount-rules'),
  createDiscountRule: (data) => api.post('/admin/discount-rules', data),
  deleteDiscountRule: (id) => api.delete(`/admin/discount-rules/${id}`),

  getApprovalRules: () => api.get('/admin/approval-rules'),
  createApprovalRule: (data) => api.post('/admin/approval-rules', data),
  deleteApprovalRule: (id) => api.delete(`/admin/approval-rules/${id}`),

  getWarehouses: () => api.get('/admin/warehouses'),
  createWarehouse: (data) => api.post('/admin/warehouses', data),

  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getCustomers: () => api.get('/admin/customers'),
};
