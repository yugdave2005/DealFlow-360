import { api } from '../../lib/axios';

export const fulfillmentApi = {
  getAllPlans: () => api.get('/fulfillment'),
  getPlanById: (orderId) => api.get(`/fulfillment/${orderId}`),
  acceptPlan: (orderId, payload) => api.post(`/fulfillment/${orderId}/accept`, payload),
};
