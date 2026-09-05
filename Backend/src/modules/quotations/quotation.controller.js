import * as quotationService from './quotation.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation({
      salesRepId: req.user.id,
      customerId: req.body.customerId,
      lineItems: req.body.lineItems
    });
    
    sendSuccess(res, 201, 'Quotation created successfully', quotation);
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

export const submitQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.submitQuotation(req.params.id, req.user.id);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};

export const sendQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.sendQuotation(req.params.id);
    sendSuccess(res, 200, 'Quotation dispatched to customer portal', result);
  } catch (err) {
    next(err);
  }
};

export const respondNegotiation = async (req, res, next) => {
  try {
    const result = await quotationService.respondToNegotiation(req.params.id, req.body, req.user.id);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};

export const confirmQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.confirmQuotation(req.params.id, req.user.id);
    sendSuccess(res, 200, 'Quotation confirmed & order created', result);
  } catch (err) {
    next(err);
  }
};
