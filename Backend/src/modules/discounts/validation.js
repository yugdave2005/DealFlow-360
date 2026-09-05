import { BadRequestError } from '../../utils/errors.js';

export const validateCreateRule = (body) => {
  if (!body.appliedTo || !['TIER', 'CATEGORY'].includes(body.appliedTo)) {
    throw new BadRequestError('appliedTo must be TIER or CATEGORY');
  }
  if (body.appliedTo === 'CATEGORY' && !body.productCategory) {
    throw new BadRequestError('productCategory is required when appliedTo is CATEGORY');
  }
  if (body.maxDiscountPercentage === undefined || isNaN(Number(body.maxDiscountPercentage))) {
    throw new BadRequestError('maxDiscountPercentage is required and must be numeric');
  }
};
