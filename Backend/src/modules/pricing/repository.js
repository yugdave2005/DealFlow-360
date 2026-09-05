import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = () =>
  prisma.productPricing.findMany({
    include: { product: true, customerTier: true },
    orderBy: { product: { name: 'asc' } }
  });

export const findByProduct = (productId) =>
  prisma.productPricing.findMany({
    where: { productId },
    include: { customerTier: true }
  });

export const findById = (id) =>
  prisma.productPricing.findUnique({
    where: { id },
    include: { product: true, customerTier: true }
  });

export const create = (data) =>
  prisma.productPricing.create({
    data,
    include: { product: true, customerTier: true }
  });

export const update = (id, data) =>
  prisma.productPricing.update({
    where: { id },
    data,
    include: { product: true, customerTier: true }
  });

export const remove = (id) =>
  prisma.productPricing.delete({ where: { id } });

/**
 * Resolve the effective price for a product + optional customer tier.
 * Tier-specific price takes priority; falls back to base price (null tier).
 */
export const resolveEffectivePrice = async (productId, customerTierId = null) => {
  if (customerTierId) {
    const tierPrice = await prisma.productPricing.findFirst({
      where: { productId, customerTierId }
    });
    if (tierPrice) return tierPrice;
  }
  // Fallback to base price
  return prisma.productPricing.findFirst({
    where: { productId, customerTierId: null }
  });
};
