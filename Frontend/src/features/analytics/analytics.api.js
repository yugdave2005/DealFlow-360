import { api } from '../../lib/axios';

export const analyticsApi = {
  getReports: () => api.get('/analytics/reports'),
};
