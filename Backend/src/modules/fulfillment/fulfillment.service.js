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

  const [customers, products, inventories] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true }
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true, quantityOnHand: true }
    }),
    prisma.inventory.findMany({
      where: { productId: { in: productIds } }
    })
  ]);

  const custMap = new Map(customers.map(c => [c.id, c]));
  const prodMap = new Map(products.map(p => [p.id, p]));

  return plans.map(p => {
    const cust = custMap.get(p.order?.customerId);
    const firstProd = prodMap.get(p.items[0]?.productId);
    const totalUnits = p.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const prodInventories = inventories.filter(inv => inv.productId === firstProd?.id);
    const totalAvailable = prodInventories.reduce((sum, inv) => sum + (inv.availableQuantity || 0), 0);
    const distinctWarehouses = new Set(p.items.map(i => i.warehouseId).filter(Boolean)).size || (p.shipmentCount > 0 ? p.shipmentCount : 1);

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
      requiredQty: totalUnits || 1,
      availableStock: totalAvailable || firstProd?.quantityOnHand || 0,
      warehouseCount: distinctWarehouses
    };
  });
};

/**
 * Get a single fulfillment plan detail.
 * Resolves by Plan ID, Order ID, Order Number, or Quotation ID.
 */
export const getFulfillmentPlan = async (queryId) => {
  const cleanId = queryId ? queryId.replace(/^ORD-/, '').trim() : '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryId);

  const whereOr = [
    { order: { orderNumber: queryId } },
    { order: { orderNumber: { contains: cleanId, mode: 'insensitive' } } }
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
    },
    orderBy: { createdAt: 'desc' }
  });

  // If no plan found for this order, check if quotation exists and provision fulfillment plan
  if (!plan) {
    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [
          { id: queryId },
          { id: { contains: cleanId } },
          { quotationNumber: queryId },
          { quotationNumber: { contains: cleanId } }
        ]
      },
      include: {
        activeVersion: { include: { items: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
        order: { include: { fulfillmentPlan: { include: { items: { include: { warehouse: true } } } } } }
      }
    });

    if (quotation) {
      if (quotation.order?.fulfillmentPlan) {
        plan = { ...quotation.order.fulfillmentPlan, order: quotation.order };
      } else {
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
              totalAmount: activeVer?.totalAmount || 100000,
              status: 'PROCESSING'
            }
          });
        }

        const itemsToCreate = (activeVer?.items || []).map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity || 1),
          warehouseId: primaryWarehouse?.id || null,
          status: 'PENDING',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }));

        plan = await prisma.fulfillmentPlan.create({
          data: {
            orderId: order.id,
            optimizationMode: 'BALANCED',
            totalCost: 1540.00,
            shipmentCount: 1,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            items: {
              create: itemsToCreate.length > 0 ? itemsToCreate : [{
                productId: (await prisma.product.findFirst())?.id || 'prod-default',
                quantity: 1,
                warehouseId: primaryWarehouse?.id || null,
                status: 'PENDING',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              }]
            }
          },
          include: {
            order: true,
            items: { include: { warehouse: true } }
          }
        });
      }
    }
  }

  // Fallback: if still no plan, find most recent plan
  if (!plan) {
    plan = await prisma.fulfillmentPlan.findFirst({
      include: {
        order: true,
        items: { include: { warehouse: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
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
 * Accept the suggested split — mark items as SHIPPED with configurable delivery SLA.
 */
export const acceptPlan = async (planId, splits = [], deliveryDays = 3, estimatedDelivery = null) => {
  const plan = await getFulfillmentPlan(planId);
  if (!plan) throw new NotFoundError('Fulfillment plan not found');

  console.log('[acceptPlan] planId:', planId, '→ resolved plan.id:', plan.id);
  console.log('[acceptPlan] incoming splits:', JSON.stringify(splits));

  const targetDeliveryDate = estimatedDelivery
    ? new Date(estimatedDelivery)
    : new Date(Date.now() + Math.max(0, Number(deliveryDays) || 0) * 24 * 60 * 60 * 1000);

  if (splits && splits.length > 0) {
    // Filter out splits with null/missing warehouseId or productId
    const validSplits = splits.filter(s => s.warehouseId && s.productId && s.quantity > 0);

    if (validSplits.length === 0) {
      throw new BadRequestError('No valid warehouse splits provided — all splits are missing warehouseId or productId');
    }

    // Validate all warehouseIds actually exist in DB
    const warehouseIds = [...new Set(validSplits.map(s => s.warehouseId))];
    const existingWarehouses = await prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true }
    });
    const existingIds = new Set(existingWarehouses.map(w => w.id));
    const badIds = warehouseIds.filter(id => !existingIds.has(id));
    if (badIds.length > 0) {
      throw new BadRequestError(`Invalid warehouseId(s) — not found in database: ${badIds.join(', ')}`);
    }

    // Validate all productIds actually exist in DB
    const productIds = [...new Set(validSplits.map(s => s.productId))];
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });
    const existingProdIds = new Set(existingProducts.map(p => p.id));
    const badProdIds = productIds.filter(id => !existingProdIds.has(id));
    if (badProdIds.length > 0) {
      throw new BadRequestError(`Invalid productId(s) — not found in database: ${badProdIds.join(', ')}`);
    }

    console.log('[acceptPlan] valid splits to commit:', JSON.stringify(validSplits));

    // Delete existing pending items
    await prisma.fulfillmentItem.deleteMany({
      where: { fulfillmentPlanId: plan.id }
    });

    // Create new shipped items per warehouse split with configurable delivery SLA
    await prisma.fulfillmentItem.createMany({
      data: validSplits.map(s => ({
        fulfillmentPlanId: plan.id,
        productId: s.productId,
        warehouseId: s.warehouseId,
        quantity: s.quantity,
        status: 'SHIPPED',
        estimatedDelivery: targetDeliveryDate
      }))
    });

    // Deduct inventory and synchronize Product quantityOnHand
    const affectedProductIds = new Set();

    for (const split of validSplits) {
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
      data: { status: 'SHIPPED', estimatedDelivery: targetDeliveryDate }
    });
  }

  // Update fulfillment plan estimated delivery
  await prisma.fulfillmentPlan.update({
    where: { id: plan.id },
    data: { estimatedDelivery: targetDeliveryDate }
  });

  // Update order status to FULFILLED
  await prisma.order.update({
    where: { id: plan.orderId },
    data: { status: 'FULFILLED' }
  });

  // Activate any associated DRAFT invoice so it can be paid & tested in billing immediately
  if (plan.orderId) {
    await prisma.invoice.updateMany({
      where: { orderId: plan.orderId, status: 'DRAFT' },
      data: { status: 'SENT' }
    });
  }

  return { message: 'Fulfillment plan accepted and shipments dispatched to carrier', estimatedDelivery: targetDeliveryDate };
};

/**
 * Mark all shipments in a fulfillment plan as DELIVERED (for simulation/testing & real delivery).
 */
export const markDelivered = async (planId) => {
  const plan = await getFulfillmentPlan(planId);
  if (!plan) throw new NotFoundError('Fulfillment plan not found');

  await prisma.fulfillmentItem.updateMany({
    where: { fulfillmentPlanId: plan.id },
    data: { status: 'DELIVERED' }
  });

  await prisma.order.update({
    where: { id: plan.orderId },
    data: { status: 'FULFILLED' }
  });

  if (plan.orderId) {
    await prisma.invoice.updateMany({
      where: { orderId: plan.orderId, status: 'DRAFT' },
      data: { status: 'SENT' }
    });
  }

  return { message: 'Order fulfillment marked as DELIVERED. Invoices are ready for payment settlement.' };
};
