import { api } from '../../lib/axios';

export const subscriptionsApi = {
  getSubscriptions: () => api.get('/subscriptions'),
  getPricingPlans: () => api.get('/subscriptions/plans')
};
