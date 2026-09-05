import * as customerService from './customer.service.js';
import { sendSuccess } from '../../utils/response.js';

export const listQuotations = async (req, res, next) => {
  try {
    const customerId = req.query.customerId || req.user?.id;
    const quotes = await customerService.listCustomerQuotations(customerId);
    sendSuccess(res, 200, 'Customer Quotations', quotes);
  } catch (err) { next(err); }
};

export const getQuotation = async (req, res, next) => {
  try {
    const customerId = req.query.customerId || req.user?.id; 
    const quote = await customerService.getCustomerQuotation(req.params.id, customerId);
    sendSuccess(res, 200, 'Customer Quotation', quote);
  } catch (err) { next(err); }
};

export const negotiate = async (req, res, next) => {
  try {
    const customerId = req.body.customerId || req.user?.id;
    const result = await customerService.negotiateQuotation(req.params.id, customerId, req.body);
    sendSuccess(res, 200, 'Negotiation submitted', result);
  } catch (err) { next(err); }
};

export const accept = async (req, res, next) => {
  try {
    const customerId = req.body.customerId || req.user?.id;
    const result = await customerService.acceptQuotation(req.params.id, customerId);
    sendSuccess(res, 200, 'Quotation accepted', result);
  } catch (err) { next(err); }
};
