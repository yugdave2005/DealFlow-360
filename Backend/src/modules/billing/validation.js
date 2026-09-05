import { BadRequestError } from '../../utils/errors.js';

export const validateCustomerId = (customerId) => {
  if (!customerId) throw new BadRequestError('customerId is required');
};
