import { BadRequestError } from '../../utils/errors.js';

export const validateCreatePricing = (body) => {
  if (!body.productId) throw new BadRequestError('productId is required');
  if (body.price === undefined || body.price === null) throw new BadRequestError('price is required');
  if (isNaN(Number(body.price)) || Number(body.price) < 0) throw new BadRequestError('price must be a non-negative number');
};
