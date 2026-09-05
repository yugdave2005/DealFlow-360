import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const listInvoices = async () => {
  return prisma.invoice.findMany({ include: { payments: true, order: true }, orderBy: { createdAt: 'desc' } });
};

export const getInvoice = async (id) => {
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { payments: true, order: { include: { items: true } } } });
  if (!inv) throw new NotFoundError('Invoice not found');
  return inv;
};

export const generateInvoice = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new NotFoundError('Order not found');

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      customerId: order.customerId,
      status: 'DRAFT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: order.totalAmount
    }
  });
};

export const recordPayment = async (invoiceId, { amount, paymentMethod, reference }) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  if (!invoice) throw new NotFoundError('Invoice not found');

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount);
  const newStatus = totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

  await prisma.payment.create({
    data: { invoiceId, amount, paymentMethod, reference }
  });

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
    include: { payments: true }
  });
};
