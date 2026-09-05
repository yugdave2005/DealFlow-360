import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const listInvoices = async () => {
  const invoices = await prisma.invoice.findMany({
    include: {
      payments: true,
      order: {
        include: {
          items: true,
          subscriptions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = [...new Set(invoices.map(i => i.customerId).filter(Boolean))];
  const customers = await prisma.user.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true }
  });
  const custMap = new Map(customers.map(c => [c.id, c]));

  return invoices.map(inv => {
    const cust = custMap.get(inv.customerId);
    const hasSub = (inv.order?.subscriptions?.length > 0) || (inv.order?.items?.some(i => i.isSubscription));
    const itemsSummary = inv.order?.items?.map(i => `${i.quantity}x ${i.snapshotName}`).join(', ') || 'Commercial Hardware';

    return {
      ...inv,
      amount: Number(inv.totalAmount || 0),
      orderNumber: inv.order?.orderNumber || `ORD-${inv.orderId?.slice(-4) || '1004'}`,
      customer: cust ? {
        id: cust.id,
        name: cust.name,
        companyName: `${cust.name} Corp`,
        email: cust.email
      } : {
        companyName: 'Client Enterprise Corp'
      },
      type: hasSub ? 'RECURRING' : 'ONE_TIME',
      itemsSummary
    };
  });
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

export const recordPayment = async (invoiceId, body = {}) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);
  const whereOr = [];
  if (isUuid) whereOr.push({ id: invoiceId });
  whereOr.push({ invoiceNumber: invoiceId });

  const invoice = await prisma.invoice.findFirst({
    where: { OR: whereOr },
    include: { payments: true }
  });
  if (!invoice) throw new NotFoundError('Invoice not found');

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingDue = Math.max(0, Number(invoice.totalAmount) - alreadyPaid);

  const paymentAmount = body.amount !== undefined && !isNaN(Number(body.amount)) && Number(body.amount) > 0
    ? Number(body.amount)
    : remainingDue;

  const paymentMethod = body.paymentMethod || 'BANK_TRANSFER';
  const reference = body.reference || body.paymentReference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

  const totalPaid = alreadyPaid + paymentAmount;
  const newStatus = totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: paymentAmount,
      paymentMethod,
      reference
    }
  });

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: newStatus },
    include: { payments: true }
  });
};

