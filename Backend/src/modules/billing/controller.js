import * as billingService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const summary = async (req, res, next) => {
  try {
    const customerId = req.params.customerId || req.user?.id;
    const data = await billingService.getBillingSummary(customerId);
    sendSuccess(res, 200, 'Billing summary', data);
  } catch (e) { next(e); }
};

export const tax = async (req, res, next) => {
  try {
    const data = billingService.calculateTax(req.query.subtotal || 0);
    sendSuccess(res, 200, 'Tax calculation', data);
  } catch (e) { next(e); }
};

export const proration = async (req, res, next) => {
  try {
    const { currentInterval, newInterval, daysRemaining, currentPrice } = req.query;
    const data = billingService.calculateProration(currentInterval, newInterval, Number(daysRemaining), Number(currentPrice));
    sendSuccess(res, 200, 'Proration calculation', data);
  } catch (e) { next(e); }
};
