import * as repo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';
import { validateCreatePricing } from './validation.js';

export const listPricing = () => repo.findAll();

export const getPricingById = async (id) => {
  const pricing = await repo.findById(id);
  if (!pricing) throw new NotFoundError('Pricing record not found');
  return pricing;
};

export const getPricingByProduct = (productId) => repo.findByProduct(productId);

export const createPricing = async (body) => {
  validateCreatePricing(body);
  return repo.create({
    productId: body.productId,
    customerTierId: body.customerTierId || null,
    price: Number(body.price)
  });
};

export const updatePricing = async (id, body) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Pricing record not found');
  const data = {};
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.customerTierId !== undefined) data.customerTierId = body.customerTierId || null;
  return repo.update(id, data);
};

export const deletePricing = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Pricing record not found');
  await repo.remove(id);
  return { deleted: true };
};

/**
 * Returns the effective price for a product + customer tier combination.
 * Used by the Quotation Builder to resolve actual prices.
 */
export const getEffectivePrice = async (productId, customerTierId = null) => {
  const pricing = await repo.resolveEffectivePrice(productId, customerTierId);
  return pricing ? { price: Number(pricing.price), tierId: pricing.customerTierId } : null;
};
