import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const listSubscriptions = async () => {
  return prisma.subscription.findMany({
    include: { order: true },
    orderBy: { createdAt: 'desc' }
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
