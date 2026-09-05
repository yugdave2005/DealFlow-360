import { verifyAccessToken } from '../services/token/jwt.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
