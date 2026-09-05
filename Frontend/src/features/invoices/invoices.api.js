import { api } from '../../lib/axios';

export const invoicesApi = {
  getInvoices: () => api.get('/invoices'),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  generateFromQuote: (quoteId) => api.post(`/invoices/generate/${quoteId}`)
};
