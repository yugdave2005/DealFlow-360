import * as repo from './repository.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { validateCreateRule } from './validation.js';

export const listDiscountRules = async () => {
  let rules = await repo.findAll();
  // Auto-seed default rules if empty
  if (rules.length === 0) {
    const defaults = [
      { appliedTo: 'CATEGORY', productCategory: 'Hardware', maxDiscountPercentage: 15 },
      { appliedTo: 'CATEGORY', productCategory: 'Services', maxDiscountPercentage: 20 },
      { appliedTo: 'CATEGORY', productCategory: 'Subscriptions', maxDiscountPercentage: 25 },
      { appliedTo: 'CATEGORY', productCategory: 'Cloud', maxDiscountPercentage: 12 }
    ];
    for (const r of defaults) {
      await repo.create(r);
    }
    rules = await repo.findAll();
  }
  return rules;
};

export const createDiscountRule = async (body) => {
  validateCreateRule(body);

  let validTierId = body.targetTierId;
  if (body.appliedTo === 'TIER' && body.targetTierId) {
    const exists = await repo.findTierById(body.targetTierId);
    if (!exists) {
      const firstTier = await repo.findFirstTier();
      validTierId = firstTier ? firstTier.id : null;
    }
  }

  return repo.create({
    appliedTo: body.appliedTo,
    targetTierId: body.appliedTo === 'TIER' ? validTierId : null,
    productCategory: body.appliedTo === 'CATEGORY' ? body.productCategory : null,
    maxDiscountPercentage: parseFloat(body.maxDiscountPercentage) || 0
  });
};

export const deleteDiscountRule = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Discount rule not found');
  await repo.remove(id);
  return { deleted: true };
};

/**
 * Validate whether a discount percentage is allowed for a given product category.
 * Returns { valid, maxAllowed, violation }
 */
export const validateDiscount = async (productCategory, discountPercentage) => {
  const rule = await repo.findByCategory(productCategory);
  const maxAllowed = rule ? Number(rule.maxDiscountPercentage) : 30; // default fallback
  const pct = Number(discountPercentage);
  return {
    valid: pct <= maxAllowed,
    maxAllowed,
    applied: pct,
    violation: pct > maxAllowed ? `Discount ${pct}% exceeds maximum ${maxAllowed}% for category ${productCategory}` : null
  };
};
