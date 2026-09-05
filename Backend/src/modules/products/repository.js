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
