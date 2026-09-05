import { api } from '../../lib/axios';

export const billingApi = {
  getInvoices: () => api.get('/invoices'),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  recordPayment: (id, payload) => api.post(`/invoices/${id}/payment`, payload),
  
  getSubscriptions: () => api.get('/subscriptions'),
  getSubscriptionById: (id) => api.get(`/subscriptions/${id}`),
  cancelSubscription: (id) => api.post(`/subscriptions/${id}/cancel`),
  prorateSubscription: (id, payload) => api.post(`/subscriptions/${id}/prorate`, payload),
};
