import { api } from '../../lib/axios';

export const quotationsApi = {
  getQuotations: (params) => api.get('/quotations', { params }),
  getQuotationById: (id) => api.get(`/quotations/${id}`),
  createQuotation: (payload) => api.post('/quotations', payload),
  updateQuotation: (id, payload) => api.put(`/quotations/${id}`, payload),
  
  // Customer Portal Endpoints
  getCustomerQuotations: (params) => api.get('/customer-portal/quotations', { params }),
  getCustomerQuotationById: (id, customerId) => api.get(`/customer-portal/quotations/${id}?customerId=${customerId}`),
  acceptQuotation: (id, payload) => api.post(`/customer-portal/quotations/${id}/accept`, payload),
  negotiateQuotation: (id, payload) => api.post(`/customer-portal/quotations/${id}/negotiate`, payload),
};
