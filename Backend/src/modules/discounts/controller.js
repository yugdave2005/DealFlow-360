import * as discountService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await discountService.listDiscountRules();
    sendSuccess(res, 200, 'Discount rules fetched', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = await discountService.createDiscountRule(req.body);
    sendSuccess(res, 201, 'Discount rule created', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await discountService.deleteDiscountRule(req.params.id);
    sendSuccess(res, 200, 'Discount rule deleted');
  } catch (e) { next(e); }
};

export const validate = async (req, res, next) => {
  try {
    const { category, discountPercentage } = req.query;
    const data = await discountService.validateDiscount(category, discountPercentage);
    sendSuccess(res, 200, 'Discount validation result', data);
  } catch (e) { next(e); }
};
