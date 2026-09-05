import { api } from '../../lib/axios';

export const dealHealthApi = {
  getDealHealthOverview: () => api.get('/deal-health'),
  getDealHealthByQuote: (id) => api.get(`/deal-health/${id}`),
};
