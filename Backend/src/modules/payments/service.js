import * as repo from './repository.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { validateRecordPayment } from './validation.js';

export const listPayments = () => repo.findAll();

export const getPayment = async (id) => {
  const payment = await repo.findById(id);
  if (!payment) throw new NotFoundError('Payment not found');
  return payment;
};

export const getPaymentsByInvoice = (invoiceId) => repo.findByInvoice(invoiceId);

/**
 * Record a payment against an invoice.
 * Automatically calculates whether invoice is PARTIAL or PAID.
 */
export const recordPayment = async (body) => {
  validateRecordPayment(body);

  const invoice = await repo.findInvoiceById(body.invoiceId);
  if (!invoice) throw new NotFoundError('Invoice not found');

  const existingPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const newTotal = existingPaid + Number(body.amount);
  const newStatus = newTotal >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

  await repo.create({
    invoiceId: body.invoiceId,
    amount: Number(body.amount),
    paymentMethod: body.paymentMethod,
    reference: body.reference || null
  });

  return repo.updateInvoiceStatus(body.invoiceId, newStatus);
};
