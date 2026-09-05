import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findInvoicesByCustomer = (customerId) =>
  prisma.invoice.findMany({
    where: { customerId },
    include: { payments: true, order: true },
    orderBy: { createdAt: 'desc' }
  });

export const findSubscriptionsByCustomer = (customerId) =>
  prisma.subscription.findMany({
    where: { customerId },
    include: { order: { include: { items: true } } },
    orderBy: { createdAt: 'desc' }
  });

export const findPaymentsByCustomer = async (customerId) => {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    select: { id: true }
  });
  const invoiceIds = invoices.map(i => i.id);
  return prisma.payment.findMany({
    where: { invoiceId: { in: invoiceIds } },
    include: { invoice: true },
    orderBy: { paidAt: 'desc' }
  });
};
