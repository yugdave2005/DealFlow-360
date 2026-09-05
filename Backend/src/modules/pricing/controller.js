import * as pricingService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await pricingService.listPricing();
    sendSuccess(res, 200, 'Pricing fetched', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await pricingService.getPricingById(req.params.id);
    sendSuccess(res, 200, 'Pricing fetched', data);
  } catch (e) { next(e); }
};

export const getByProduct = async (req, res, next) => {
  try {
    const data = await pricingService.getPricingByProduct(req.params.productId);
    sendSuccess(res, 200, 'Product pricing fetched', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = await pricingService.createPricing(req.body);
    sendSuccess(res, 201, 'Pricing created', data);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const data = await pricingService.updatePricing(req.params.id, req.body);
    sendSuccess(res, 200, 'Pricing updated', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await pricingService.deletePricing(req.params.id);
    sendSuccess(res, 200, 'Pricing deleted');
  } catch (e) { next(e); }
};

export const resolvePrice = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { tierId } = req.query;
    const data = await pricingService.getEffectivePrice(productId, tierId || null);
    sendSuccess(res, 200, 'Effective price resolved', data);
  } catch (e) { next(e); }
};
