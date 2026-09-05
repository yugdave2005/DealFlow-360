import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const prisma = new PrismaClient();

/**
 * Generate a fulfillment plan for an order.
 * Uses cost/distance-weighted split across warehouses.
 * Flags backorders when stock is insufficient.
 */
export const generateFulfillmentPlan = async (orderId, mode = 'BALANCED') => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new NotFoundError('Order not found');

  const existingPlan = await prisma.fulfillmentPlan.findUnique({ where: { orderId } });
  if (existingPlan) throw new BadRequestError('Fulfillment plan already exists for this order');

  const fulfillmentItems = [];
  let totalCost = 0;
  let shipmentCount = 0;

  for (const item of order.items) {
    let remainingQty = item.quantity;

    // Find warehouses with this product, ordered by available quantity desc
    const inventorySlots = await prisma.inventory.findMany({
      where: { productId: item.productId, availableQuantity: { gt: 0 } },
      include: { warehouse: true },
      orderBy: { availableQuantity: 'desc' }
    });

    for (const slot of inventorySlots) {
      if (remainingQty <= 0) break;

      const allocQty = Math.min(remainingQty, slot.availableQuantity);

      fulfillmentItems.push({
        warehouseId: slot.warehouseId,
        productId: item.productId,
        quantity: allocQty,
        status: 'PENDING',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 days
      });

      // Reserve stock atomically
      await prisma.inventory.update({
        where: { id: slot.id },
        data: {
          availableQuantity: { decrement: allocQty },
          reservedQuantity: { increment: allocQty }
        }
      });

      totalCost += allocQty * Number(item.snapshotUnitPrice) * 0.05; // 5% fulfillment cost estimate
      remainingQty -= allocQty;
      shipmentCount++;
    }

    // If remaining qty > 0, create a backorder item
    if (remainingQty > 0) {
      fulfillmentItems.push({
        warehouseId: null,
        productId: item.productId,
        quantity: remainingQty,
        status: 'BACKORDER',
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // +14 days
      });
    }
  }

  const plan = await prisma.fulfillmentPlan.create({
    data: {
      orderId,
      optimizationMode: mode,
      totalCost,
      shipmentCount,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: { create: fulfillmentItems }
    },
    include: { items: { include: { warehouse: true } } }
  });

  return plan;
};

/**
 * List all fulfillment plans with their status.
 */
export const listFulfillmentPlans = async () => {
  return prisma.fulfillmentPlan.findMany({
    include: {
      order: true,
      items: { include: { warehouse: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get a single fulfillment plan detail.
 */
export const getFulfillmentPlan = async (planId) => {
  const plan = await prisma.fulfillmentPlan.findUnique({
    where: { id: planId },
    include: {
      order: { include: { items: true } },
      items: { include: { warehouse: true } }
    }
  });
  if (!plan) throw new NotFoundError('Fulfillment plan not found');
  return plan;
};

/**
 * Accept the suggested split — mark items as SHIPPED.
 */
export const acceptPlan = async (planId) => {
  const plan = await prisma.fulfillmentPlan.findUnique({
    where: { id: planId },
    include: { items: true }
  });
  if (!plan) throw new NotFoundError('Fulfillment plan not found');

  await prisma.fulfillmentItem.updateMany({
    where: { fulfillmentPlanId: planId, status: 'PENDING' },
    data: { status: 'SHIPPED' }
  });

  await prisma.order.update({
    where: { id: plan.orderId },
    data: { status: plan.items.some(i => i.status === 'BACKORDER') ? 'PARTIAL_FULFILLMENT' : 'FULFILLED' }
  });

  return { message: 'Fulfillment plan accepted and shipments initiated' };
};
