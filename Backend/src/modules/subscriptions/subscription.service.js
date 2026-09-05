import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const listSubscriptions = async () => {
  const subs = await prisma.subscription.findMany({
    include: { 
      order: { 
        include: { items: true } 
      } 
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = [...new Set(subs.map(s => s.customerId).filter(Boolean))];
  const customers = await prisma.user.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true }
  });
  const custMap = new Map(customers.map(c => [c.id, c]));

  return subs.map(sub => {
    const cust = custMap.get(sub.customerId);
    const subItem = sub.order?.items?.find(i => i.isSubscription) || null;
    return {
      ...sub,
      customer: cust ? { companyName: `${cust.name} Corp`, tier: 'Standard' } : null,
      product: { name: subItem?.snapshotName || 'Software License' },
      quantity: subItem?.quantity || 1,
      amount: subItem ? (Number(subItem.snapshotUnitPrice) * (1 - Number(subItem.snapshotDiscount)/100)) * Number(subItem.quantity) : 0,
    };
  });
};

export const getSubscription = async (id) => {
  const sub = await prisma.subscription.findUnique({ where: { id }, include: { order: { include: { items: true } } } });
  if (!sub) throw new NotFoundError('Subscription not found');
  return sub;
};

export const modifySubscription = async (id, { interval, status }) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new NotFoundError('Subscription not found');

  const data = {};
  if (interval) data.interval = interval;
  if (status) data.status = status;

  // Recalculate next billing date if interval changes
  if (interval) {
    const now = new Date();
    const intervalDays = interval === 'MONTHLY' ? 30 : interval === 'QUARTERLY' ? 90 : 365;
    data.nextBillingDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  return prisma.subscription.update({ where: { id }, data });
};

export const cancelSubscription = async (id) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new NotFoundError('Subscription not found');
  if (sub.status === 'CANCELLED') throw new BadRequestError('Already cancelled');

  return prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
};

export const processProration = async (id, { newQuantity, oldQuantity, MRR }) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new NotFoundError('Subscription not found');
  
  const now = new Date();
  const nextBilling = new Date(sub.nextBillingDate);
  const remainingDays = Math.max(0, Math.floor((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const intervalDays = sub.interval === 'MONTHLY' ? 30 : sub.interval === 'QUARTERLY' ? 90 : 365;
  const perDayRate = Number(MRR) / intervalDays;
  
  const quantityDiff = Number(newQuantity) - Number(oldQuantity);
  const proratedAmount = quantityDiff * perDayRate * remainingDays;

  // Create a partial invoice for the difference
  if (proratedAmount > 0) {
    const invoiceNumber = `PR-INV-${Date.now().toString(36).toUpperCase()}`;
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: sub.orderId,
        customerId: sub.customerId,
        status: 'SENT',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // Due in 15 days
        totalAmount: proratedAmount
      }
    });
  }
  
  return { success: true, proratedAmount, remainingDays, intervalDays };
};
