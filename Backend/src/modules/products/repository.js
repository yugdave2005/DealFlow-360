import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = (filters = {}) => {
  const where = {};
  if (filters.category) where.category = filters.category;
  if (filters.isSubscription !== undefined) where.isSubscription = filters.isSubscription === 'true';

  return prisma.product.findMany({
    where,
    include: { pricing: { include: { customerTier: true } }, inventory: { include: { warehouse: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const findById = (id) =>
  prisma.product.findUnique({
    where: { id },
    include: { pricing: { include: { customerTier: true } }, inventory: { include: { warehouse: true } } }
  });

export const create = (data) =>
  prisma.product.create({
    data,
    include: { pricing: true }
  });

export const update = (id, data) =>
  prisma.product.update({
    where: { id },
    data,
    include: { pricing: true }
  });

export const remove = async (id) => {
  await prisma.productPricing.deleteMany({ where: { productId: id } });
  await prisma.inventory.deleteMany({ where: { productId: id } });
  return prisma.product.delete({ where: { id } });
};

export const findPricingByProduct = (productId) =>
  prisma.productPricing.findMany({
    where: { productId },
    include: { customerTier: true }
  });

export const upsertBasePricing = async (productId, price) => {
  const existing = await prisma.productPricing.findFirst({
    where: { productId, customerTierId: null }
  });
  if (existing) {
    return prisma.productPricing.update({ where: { id: existing.id }, data: { price } });
  }
  return prisma.productPricing.create({ data: { productId, price } });
};

export const syncProductInventory = async (productId, warehouseStock = []) => {
  if (!Array.isArray(warehouseStock) || warehouseStock.length === 0) return;

  for (const item of warehouseStock) {
    if (!item.warehouseId) continue;
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    await prisma.inventory.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: item.warehouseId,
          productId
        }
      },
      update: {
        availableQuantity: qty
      },
      create: {
        warehouseId: item.warehouseId,
        productId,
        availableQuantity: qty,
        reservedQuantity: 0
      }
    });
  }

  // Update product's quantityOnHand to aggregate sum across all warehouses
  const total = await prisma.inventory.aggregate({
    where: { productId },
    _sum: { availableQuantity: true }
  });

  const totalQty = total._sum.availableQuantity || 0;
  await prisma.product.update({
    where: { id: productId },
    data: { quantityOnHand: totalQty }
  });

  return totalQty;
};

