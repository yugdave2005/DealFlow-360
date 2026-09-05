import { BadRequestError } from '../../utils/errors.js';

export const validateAdjustStock = (body) => {
  if (!body.warehouseId) throw new BadRequestError('warehouseId is required');
  if (!body.productId) throw new BadRequestError('productId is required');
  if (body.availableQuantity === undefined && body.reservedQuantity === undefined) {
    throw new BadRequestError('At least one of availableQuantity or reservedQuantity is required');
  }
};

export const validateReserve = (body) => {
  if (!body.productId) throw new BadRequestError('productId is required');
  if (!body.quantity || body.quantity <= 0) throw new BadRequestError('quantity must be a positive number');
};
