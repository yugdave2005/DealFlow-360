import { ForbiddenError } from '../utils/errors.js';

export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(new ForbiddenError('Access denied: Active role check failed.'));
  }
  
  const normalize = (r) => {
    if (r === 'FINANCE' || r === 'OPERATIONS') return 'FINANCE_OPERATIONS';
    return r;
  };

  const userRole = normalize(req.user.role);
  const normalizedAllowed = allowedRoles.map(normalize);

  if (!normalizedAllowed.includes(userRole) && !allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError(`Access denied: Requires one of [${allowedRoles.join(', ')}]`));
  }
  
  next();
};
