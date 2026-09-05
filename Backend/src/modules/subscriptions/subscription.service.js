import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

const enrichSubscriptionData = (sub, custMap, prodMap, idx = 0) => {
  const cust = custMap.get(sub.customerId);
  const quoteItems = sub.order?.quotation?.activeVersion?.items || sub.order?.quotation?.versions?.[0]?.items || [];
  
  // Identify subscription item or fallback to first item
  const subItem = quoteItems.find(it => {
    const prod = prodMap.get(it.productId);
    return prod?.isSubscription || prod?.category === 'SUBSCRIPTION';
  }) || quoteItems[0];

  const prod = prodMap.get(subItem?.productId);
  const qty = Number(subItem?.quantity) || 1;
  const unitPrice = Number(subItem?.unitPrice) || 4999;
  const totalAmount = qty * unitPrice;

  const interval = sub.interval || prod?.recurringInterval || 'MONTHLY';
  const mrr = interval === 'YEARLY' ? totalAmount / 12 : interval === 'QUARTERLY' ? totalAmount / 3 : totalAmount;
  const arr = mrr * 12;

  const orderNum = sub.order?.orderNumber || '';
  const subNumber = orderNum
    ? `SUB-2026-${orderNum.replace('ORD-', '')}`
    : `SUB-2026-${String(idx + 1).padStart(4, '0')}`;

  // Generate 3 upcoming billing dates for schedule
  const nextDate = new Date(sub.nextBillingDate || Date.now());
  const schedule = [1, 2, 3].map((step, sIdx) => {
    const d = new Date(nextDate);
    const multiplier = interval === 'YEARLY' ? 365 : interval === 'QUARTERLY' ? 90 : 30;
    d.setDate(d.getDate() + (sIdx * multiplier));
    return {
      date: d.toISOString(),
      amount: totalAmount,
      status: sIdx === 0 ? 'UPCOMING' : 'SCHEDULED'
    };
  });

  return {
    id: sub.id,
    subscriptionNumber: subNumber,
    orderId: sub.orderId,
    customerId: sub.customerId,
    order: sub.order ? {
      id: sub.order.id,
      orderNumber: sub.order.orderNumber,
      status: sub.order.status,
      totalAmount: sub.order.totalAmount
    } : null,
    customer: {
      id: sub.customerId,
      name: cust?.name || 'Customer Organization',
      companyName: cust?.name ? (cust.name.toLowerCase().includes('corp') ? cust.name : cust.name + ' Corp') : 'Client Corporation',
      email: cust?.email || 'client@corp.com',
      tier: 'GOLD'
    },
    product: {
      id: prod?.id || subItem?.productId,
      name: prod?.name || 'Enterprise Cloud & SaaS License',
      category: prod?.category || 'SUBSCRIPTION',
      recurringInterval: interval
    },
    quantity: qty,
    unitPrice: unitPrice,
    amount: totalAmount,
    billingCycle: interval,
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    status: sub.status || 'ACTIVE',
    nextBillingDate: sub.nextBillingDate,
    startDate: sub.createdAt,
    schedule,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt
  };
};

export const listSubscriptions = async () => {
  const subs = await prisma.subscription.findMany({
    include: {
      order: {
        include: {
          quotation: {
            include: {
              activeVersion: { include: { items: true } },
              versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = [...new Set(subs.map(s => s.customerId).filter(Boolean))];
  const allVersionItems = subs.flatMap(s => s.order?.quotation?.activeVersion?.items || s.order?.quotation?.versions?.[0]?.items || []);
  const productIds = [...new Set(allVersionItems.map(i => i.productId).filter(Boolean))];

  const [customers, products] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true }
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } }
    })
  ]);

  const custMap = new Map(customers.map(c => [c.id, c]));
  const prodMap = new Map(products.map(p => [p.id, p]));

  return subs.map((s, idx) => enrichSubscriptionData(s, custMap, prodMap, idx));
};

export const getSubscription = async (id) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereOr = [];
  if (isUuid) {
    whereOr.push({ id });
    whereOr.push({ orderId: id });
  }
  whereOr.push({ order: { orderNumber: id } });

  const sub = await prisma.subscription.findFirst({
    where: { OR: whereOr },
    include: {
      order: {
        include: {
          quotation: {
            include: {
              activeVersion: { include: { items: true } },
              versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
            }
          }
        }
      }
    }
  });

  if (!sub) throw new NotFoundError('Subscription not found');

  const customer = await prisma.user.findUnique({
    where: { id: sub.customerId },
    select: { id: true, name: true, email: true }
  });

  const quoteItems = sub.order?.quotation?.activeVersion?.items || sub.order?.quotation?.versions?.[0]?.items || [];
  const productIds = quoteItems.map(i => i.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  const custMap = new Map(customer ? [[customer.id, customer]] : []);
  const prodMap = new Map(products.map(p => [p.id, p]));

  return enrichSubscriptionData(sub, custMap, prodMap, 0);
};

export const modifySubscription = async (id, { interval, status }) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereOr = [];
  if (isUuid) whereOr.push({ id });
  whereOr.push({ order: { orderNumber: id } });

  const sub = await prisma.subscription.findFirst({ where: { OR: whereOr } });
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

  const updated = await prisma.subscription.update({ where: { id: sub.id }, data });
  return getSubscription(updated.id);
};

export const cancelSubscription = async (id) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereOr = [];
  if (isUuid) whereOr.push({ id });
  whereOr.push({ order: { orderNumber: id } });

  const sub = await prisma.subscription.findFirst({ where: { OR: whereOr } });
  if (!sub) throw new NotFoundError('Subscription not found');
  if (sub.status === 'CANCELLED') throw new BadRequestError('Already cancelled');

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELLED' }
  });

  return getSubscription(updated.id);
};
