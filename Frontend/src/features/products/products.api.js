import { api } from '../../lib/axios';

export const productsApi = {
  getProducts: () => api.get('/products'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: ({ id, ...data }) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};
