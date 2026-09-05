import { api } from '../../lib/axios';

export const discountsApi = {
  getDiscountRules: () => api.get('/discounts'),
  createDiscountRule: (data) => api.post('/discounts', data),
  deleteDiscountRule: (id) => api.delete(`/discounts/${id}`),
};
