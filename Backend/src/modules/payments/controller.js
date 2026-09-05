import * as paymentService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await paymentService.listPayments();
    sendSuccess(res, 200, 'Payments fetched', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await paymentService.getPayment(req.params.id);
    sendSuccess(res, 200, 'Payment fetched', data);
  } catch (e) { next(e); }
};

export const getByInvoice = async (req, res, next) => {
  try {
    const data = await paymentService.getPaymentsByInvoice(req.params.invoiceId);
    sendSuccess(res, 200, 'Invoice payments fetched', data);
  } catch (e) { next(e); }
};

export const record = async (req, res, next) => {
  try {
    const data = await paymentService.recordPayment(req.body);
    sendSuccess(res, 201, 'Payment recorded', data);
  } catch (e) { next(e); }
};
