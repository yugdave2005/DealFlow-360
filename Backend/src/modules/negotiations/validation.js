import { BadRequestError } from '../../utils/errors.js';

export const validateCreateMessage = (body) => {
  if (!body.quotationVersionId) throw new BadRequestError('quotationVersionId is required');
  if (!body.authorId) throw new BadRequestError('authorId is required');
  if (!body.content || body.content.trim().length === 0) throw new BadRequestError('content is required');
};
