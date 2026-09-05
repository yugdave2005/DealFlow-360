import { api } from '../../lib/axios';

export const negotiationsApi = {
  getNegotiationsList: () => api.get('/negotiations'),
  getNegotiationDetails: (id) => api.get(`/negotiations/${id}`),
};
