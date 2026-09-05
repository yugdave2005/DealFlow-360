import * as invoiceService from './invoice.service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Invoices', await invoiceService.listInvoices()); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Invoice', await invoiceService.getInvoice(req.params.id)); } catch (e) { next(e); }
};
export const generate = async (req, res, next) => {
  try { sendSuccess(res, 201, 'Invoice created', await invoiceService.generateInvoice(req.body.orderId)); } catch (e) { next(e); }
};
export const recordPayment = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Payment recorded', await invoiceService.recordPayment(req.params.id, req.body)); } catch (e) { next(e); }
};
