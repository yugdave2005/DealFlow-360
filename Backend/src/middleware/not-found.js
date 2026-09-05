import { NotFoundError } from '../utils/errors.js';

export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};
