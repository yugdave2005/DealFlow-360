import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = () =>
  prisma.payment.findMany({
    include: { invoice: true },
    orderBy: { paidAt: 'desc' }
  });

export const findById = (id) =>
  prisma.payment.findUnique({
    where: { id },
    include: { invoice: { include: { order: true } } }
  });

export const findByInvoice = (invoiceId) =>
  prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paidAt: 'desc' }
  });

export const create = (data) =>
  prisma.payment.create({ data, include: { invoice: true } });

export const findInvoiceById = (id) =>
  prisma.invoice.findUnique({
    where: { id },
    include: { payments: true }
  });

export const updateInvoiceStatus = (id, status) =>
  prisma.invoice.update({
    where: { id },
    data: { status },
    include: { payments: true }
  });
