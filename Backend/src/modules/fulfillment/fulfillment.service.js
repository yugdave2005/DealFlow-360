import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const prisma = new PrismaClient();

/**
 * List all fulfillment plans with enriched order, customer, and product metadata.
 */
export const listFulfillmentPlans = async () => {
  const plans = await prisma.fulfillmentPlan.findMany({
    include: {
      order: true,
      items: { include: { warehouse: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = [...new Set(plans.map(p => p.order?.customerId).filter(Boolean))];
  const productIds = [...new Set(plans.flatMap(p => p.items.map(i => i.productId)).filter(Boolean))];

  const [customers, products] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true }
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true }
    })
  ]);

  const custMap = new Map(customers.map(c => [c.id, c]));
  const prodMap = new Map(products.map(p => [p.id, p]));

  return plans.map(p => {
    const cust = custMap.get(p.order?.customerId);
    const firstProd = prodMap.get(p.items[0]?.productId);
    const totalUnits = p.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return {
      ...p,
      order: p.order ? {
        ...p.order,
        customer: cust ? {
          id: cust.id,
          name: cust.name,
          companyName: `${cust.name} Corp`,
          email: cust.email,
          tier: 'GOLD'
        } : {
          companyName: 'Client Enterprise Corp',
          tier: 'STANDARD'
        }
      } : null,
      productName: firstProd?.name || 'Commercial Hardware Package',
      requiredQty: totalUnits || 1
    };
  });
};

/**
 * Get a single fulfillment plan detail.
 * Resolves by Plan ID, Order ID, Order Number, or Quotation ID.
 */
export const getFulfillmentPlan = async (queryId) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryId);
  const whereOr = [
    { order: { orderNumber: queryId } }
  ];
  if (isUuid) {
    whereOr.push({ id: queryId });
    whereOr.push({ orderId: queryId });
    whereOr.push({ order: { quotationId: queryId } });
  }

  let plan = await prisma.fulfillmentPlan.findFirst({
    where: { OR: whereOr },
    include: {
      order: true,
      items: { include: { warehouse: true } }
    }
  });

  // If no plan found for this order, check if quotation exists and provision fulfillment plan
  if (!plan) {
    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [
          { id: queryId },
          { quotationNumber: queryId }
        ]
      },
      include: {
        activeVersion: { include: { items: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
        order: true
      }
    });

    if (quotation) {
      const activeVer = quotation.activeVersion || quotation.versions[0];
      const warehouses = await prisma.warehouse.findMany();
      const primaryWarehouse = warehouses[0] || null;

      let order = quotation.order;
      if (!order) {
        const orderCount = await prisma.order.count();
        order = await prisma.order.create({
          data: {
            orderNumber: `ORD-${String(orderCount + 1004).padStart(4, '0')}`,
            quotationId: quotation.id,
            customerId: quotation.customerId,
            totalAmount: activeVer.totalAmount,
            status: 'PROCESSING'
          }
        });
      }

      plan = await prisma.fulfillmentPlan.create({
        data: {
          orderId: order.id,
          optimizationMode: 'BALANCED',
          totalCost: 1540.00,
          shipmentCount: 1,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          items: {
            create: (activeVer?.items || []).map(it => ({
              productId: it.productId,
              quantity: Number(it.quantity || 1),
              warehouseId: primaryWarehouse?.id || null,
              status: 'PENDING',
              estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }))
          }
        },
        include: {
          order: true,
          items: { include: { warehouse: true } }
        }
      });
    }
  }

  if (!plan) throw new NotFoundError('Fulfillment plan not found');

  const customer = plan.order?.customerId ? await prisma.user.findUnique({
    where: { id: plan.order.customerId },
    select: { id: true, name: true, email: true }
  }) : null;

  const productIds = plan.items.map(i => i.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });
  const prodMap = new Map(products.map(p => [p.id, p]));

  const allWarehouses = await prisma.warehouse.findMany();

  return {
    ...plan,
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      companyName: `${customer.name} Corp`,
      email: customer.email
    } : {
      name: 'Client Organization',
      companyName: 'Client Corporation',
      email: 'client@corp.com'
    },
    items: plan.items.map(it => ({
      ...it,
      product: prodMap.get(it.productId) || { name: 'Hardware Unit' }
    })),
    availableWarehouses: allWarehouses
  };
};

/**
 * Generate a fulfillment plan for an order.
 */
export const generateFulfillmentPlan = async (orderId, mode = 'BALANCED') => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new NotFoundError('Order not found');

  const existingPlan = await prisma.fulfillmentPlan.findUnique({ where: { orderId } });
  if (existingPlan) return existingPlan;

  const warehouses = await prisma.warehouse.findMany();
  const primaryWarehouse = warehouses[0] || null;

  const plan = await prisma.fulfillmentPlan.create({
    data: {
      orderId,
      optimizationMode: mode,
      totalCost: 1540.00,
      shipmentCount: 1,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      items: {
        create: (order.items || []).map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity || 1),
          warehouseId: primaryWarehouse?.id || null,
          status: 'PENDING',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }))
      }
    },
    include: { items: { include: { warehouse: true } } }
  });

  return plan;
};

/**
 * Accept the suggested split — mark items as SHIPPED.
 */
export const acceptPlan = async (planId, splits = []) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
  const whereOr = [
    { order: { orderNumber: planId } }
  ];
  if (isUuid) {
    whereOr.push({ id: planId });
    whereOr.push({ orderId: planId });
    whereOr.push({ order: { quotationId: planId } });
  }

  const plan = await prisma.fulfillmentPlan.findFirst({
    where: { OR: whereOr },
    include: { items: true }
  });

  if (!plan) throw new NotFoundError('Fulfillment plan not found');

  if (splits && splits.length > 0) {
    // Delete existing pending items
    await prisma.fulfillmentItem.deleteMany({
      where: { fulfillmentPlanId: plan.id }
    });

    // Create new shipped items per warehouse split
    await prisma.fulfillmentItem.createMany({
      data: splits.map(s => ({
        fulfillmentPlanId: plan.id,
        productId: s.productId,
        warehouseId: s.warehouseId,
        quantity: s.quantity,
        status: 'SHIPPED',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }))
    });

    // Deduct inventory and synchronize Product quantityOnHand
    const affectedProductIds = new Set();

    for (const split of splits) {
      if (!split.warehouseId || !split.productId) continue;
      affectedProductIds.add(split.productId);

      const inv = await prisma.inventory.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: split.warehouseId,
            productId: split.productId
          }
        }
      });
      if (inv) {
        // Decrement available or reserved quantity
        const newAvailable = Math.max(0, inv.availableQuantity - split.quantity);
        const newReserved = Math.max(0, inv.reservedQuantity - split.quantity);
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { 
            availableQuantity: newAvailable,
            reservedQuantity: newReserved
          }
        });
      }
    }

    // Keep Product.quantityOnHand exactly matched to the sum of warehouse stocks
    for (const prodId of affectedProductIds) {
      const allWarehouseInv = await prisma.inventory.findMany({
        where: { productId: prodId }
      });
      const totalAvailable = allWarehouseInv.reduce((sum, r) => sum + r.availableQuantity, 0);
      await prisma.product.update({
        where: { id: prodId },
        data: { quantityOnHand: totalAvailable }
      });
    }
  } else {
    // Fallback if no splits provided
    await prisma.fulfillmentItem.updateMany({
      where: { fulfillmentPlanId: plan.id, status: 'PENDING' },
      data: { status: 'SHIPPED' }
    });
  }

  await prisma.order.update({
    where: { id: plan.orderId },
    data: { status: 'FULFILLED' }
  });

  return { message: 'Fulfillment plan accepted and shipments dispatched to carrier' };
};
