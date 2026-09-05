import { api } from '../../lib/axios';

export const dashboardApi = {
  getSalesMetrics: () => api.get('/dashboard/sales'),
  getAdminMetrics: () => api.get('/dashboard/admin'),
  getCustomerMetrics: () => api.get('/dashboard/customer'),
};
