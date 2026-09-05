import { BadRequestError } from '../../utils/errors.js';

export const validateCreateProduct = (body) => {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw new BadRequestError('Product name is required');
  }
  if (!body.category || typeof body.category !== 'string') {
    throw new BadRequestError('Product category is required');
  }
};

export const validateUpdateProduct = (body) => {
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    throw new BadRequestError('Product name must be a non-empty string');
  }
};
