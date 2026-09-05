import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'An error occurred');

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, {
      code: err.code,
      details: err.details
    });
  }

  // Handle generic errors
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  sendError(res, statusCode, message, { code: 'INTERNAL_ERROR' });
};
