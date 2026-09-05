import { api } from '../../lib/axios';

export const usersApi = {
  getUsers: () => api.get('/users'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};
