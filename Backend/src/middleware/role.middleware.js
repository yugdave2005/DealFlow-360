import { ForbiddenError } from '../utils/errors.js';

export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(new ForbiddenError('Access denied: Active role check failed.'));
  }
  
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError(`Access denied: Requires one of [${allowedRoles.join(', ')}]`));
  }
  
  next();
};
