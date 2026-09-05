import { api } from '../../lib/axios';

export const pricingApi = {
  // Configured in Phase 2 backend module
  getPricingData: () => api.get('/pricing'),
  createPricing: (data) => api.post('/pricing', data),
  updatePricing: ({ id, ...data }) => api.put(`/pricing/${id}`, data),
  deletePricing: (id) => api.delete(`/pricing/${id}`),

  // Fallback to admin module where tiers weren't decoupled
  getCustomerTiers: () => api.get('/admin/customer-tiers'),
  createCustomerTier: (data) => api.post('/admin/customer-tiers', data),
};
