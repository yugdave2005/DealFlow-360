import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = (filters = {}) => {
  const where = {};
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.productId) where.productId = filters.productId;

  return prisma.inventory.findMany({
    where,
    include: { warehouse: true, product: true },
    orderBy: { warehouse: { name: 'asc' } }
  });
};

export const findById = (id) =>
  prisma.inventory.findUnique({
    where: { id },
    include: { warehouse: true, product: true }
  });

export const findByWarehouseProduct = (warehouseId, productId) =>
  prisma.inventory.findUnique({
    where: { warehouseId_productId: { warehouseId, productId } },
    include: { warehouse: true, product: true }
  });

export const upsert = (warehouseId, productId, data) =>
  prisma.inventory.upsert({
    where: { warehouseId_productId: { warehouseId, productId } },
    create: { warehouseId, productId, ...data },
    update: data,
    include: { warehouse: true, product: true }
  });

export const update = (id, data) =>
  prisma.inventory.update({
    where: { id },
    data,
    include: { warehouse: true, product: true }
  });

export const findAvailableForProduct = (productId) =>
  prisma.inventory.findMany({
    where: { productId, availableQuantity: { gt: 0 } },
    include: { warehouse: true },
    orderBy: { availableQuantity: 'desc' }
  });
