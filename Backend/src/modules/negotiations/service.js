import * as repo from './repository.js';
import { validateCreateMessage } from './validation.js';

export const getMessagesByVersion = (quotationVersionId) =>
  repo.findByVersionId(quotationVersionId);

export const getMessagesByQuotation = (quotationId) =>
  repo.findByQuotationId(quotationId);

export const createMessage = async (body) => {
  validateCreateMessage(body);
  return repo.create({
    quotationVersionId: body.quotationVersionId,
    authorId: body.authorId,
    senderRole: body.senderRole || 'SALES_REP',
    content: body.content.trim(),
    proposedDiscount: body.proposedDiscount !== undefined ? Number(body.proposedDiscount) : null,
    isCommercialChange: body.isCommercialChange === true
  });
};
