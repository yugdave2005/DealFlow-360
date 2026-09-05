import { BadRequestError } from '../../utils/errors.js';

export const validateRecordPayment = (body) => {
  if (!body.invoiceId) throw new BadRequestError('invoiceId is required');
  if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    throw new BadRequestError('amount must be a positive number');
  }
  if (!body.paymentMethod) throw new BadRequestError('paymentMethod is required');
};
