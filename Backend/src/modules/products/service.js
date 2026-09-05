import * as repo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';
import { validateCreateProduct, validateUpdateProduct } from './validation.js';

export const listProducts = async (filters = {}) => {
  return repo.findAll(filters);
};

export const getProductById = async (id) => {
  const product = await repo.findById(id);
  if (!product) throw new NotFoundError('Product not found');
  return product;
};

export const createProduct = async (body) => {
  validateCreateProduct(body);

  const isSub = body.isSubscription === true || body.isSubscription === 'true';
  const basePrice = body.price !== undefined
    ? Number(body.price)
    : (body.pricing?.[0]?.price !== undefined ? Number(body.pricing[0].price) : 0);

  const product = await repo.create({
    name: body.name.trim(),
    category: body.category || 'Hardware',
    isSubscription: isSub,
    recurringInterval: isSub ? (body.recurringInterval || 'Monthly') : null,
    quantityOnHand: parseInt(body.quantityOnHand, 10) || 0,
    variantAttributes: body.variantAttributes || null,
    pricing: {
      create: [{ price: isNaN(basePrice) ? 0 : basePrice }]
    }
  });

  return product;
};

export const updateProduct = async (id, body) => {
  validateUpdateProduct(body);

  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Product not found');

  const isSub = body.isSubscription !== undefined
    ? (body.isSubscription === true || body.isSubscription === 'true')
    : undefined;

  const updateData = {};
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.category !== undefined) updateData.category = body.category;
  if (isSub !== undefined) updateData.isSubscription = isSub;
  if (body.recurringInterval !== undefined) updateData.recurringInterval = isSub ? body.recurringInterval : null;
  if (body.quantityOnHand !== undefined) updateData.quantityOnHand = parseInt(body.quantityOnHand, 10) || 0;
  if (body.variantAttributes !== undefined) updateData.variantAttributes = body.variantAttributes;

  await repo.update(id, updateData);

  // Handle pricing update
  const rawPrice = body.price !== undefined ? body.price : body.pricing?.[0]?.price;
  if (rawPrice !== undefined) {
    const numPrice = Number(rawPrice);
    if (!isNaN(numPrice)) {
      await repo.upsertBasePricing(id, numPrice);
    }
  }

  return repo.findById(id);
};

export const deleteProduct = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Product not found');
  await repo.remove(id);
  return { deleted: true };
};
