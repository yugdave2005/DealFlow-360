import { api } from '../../lib/axios';

export const customersApi = {
  getCustomers: () => api.get('/customers'),
};
