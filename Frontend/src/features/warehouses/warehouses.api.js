import { api } from '../../lib/axios';

export const warehousesApi = {
  getWarehouses: () => api.get('/warehouses'),
  createWarehouse: (data) => api.post('/warehouses', data),
  updateWarehouse: ({ id, ...data }) => api.put(`/warehouses/${id}`, data),
};
