import { api } from '../../lib/axios';

export const customersApi = {
  // Commercial customer views
  getCustomers: () => api.get('/customers'),
};
