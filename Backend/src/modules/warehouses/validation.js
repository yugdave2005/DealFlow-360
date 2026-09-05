import { BadRequestError } from '../../utils/errors.js';

export const validateCreateWarehouse = (body) => {
  if (!body.code || typeof body.code !== 'string') throw new BadRequestError('Warehouse code is required');
  if (!body.name || typeof body.name !== 'string') throw new BadRequestError('Warehouse name is required');
};
