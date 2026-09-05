import { api } from '../../lib/axios';

export const fulfillmentApi = {
  getAllPlans: () => api.get('/fulfillment'),
  getPlanById: (orderId) => api.get(`/fulfillment/${orderId}`),
  acceptPlan: (orderId) => api.post(`/fulfillment/${orderId}/accept`),
};
