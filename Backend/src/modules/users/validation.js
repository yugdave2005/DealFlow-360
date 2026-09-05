import { BadRequestError } from '../../utils/errors.js';

export const validateUpdateUser = (body) => {
  const validRoles = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER'];
  if (body.role !== undefined && !validRoles.includes(body.role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
};
