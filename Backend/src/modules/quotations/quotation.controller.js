import * as quotationService from './quotation.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation({
      salesRepId: req.user.id,
      customerId: req.body.customerId,
      lineItems: req.body.lineItems
    });
    
    sendSuccess(res, 201, 'Quotation formulated successfully', quotation);
  } catch (err) {
    next(err);
  }
};

export const listQuotations = async (req, res, next) => {
  try {
    const quotations = await quotationService.getQuotations(req.user.id, req.user.role);
    sendSuccess(res, 200, 'Quotations retrieved', quotations);
  } catch (err) {
    next(err);
  }
};

export const getQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id, req.user.id, req.user.role);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    sendSuccess(res, 200, 'Quotation retrieved', quotation);
  } catch (err) {
    next(err);
  }
};
