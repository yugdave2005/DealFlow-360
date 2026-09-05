import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = () =>
  prisma.discountRule.findMany({
    include: { targetTier: true },
    orderBy: { maxDiscountPercentage: 'asc' }
  });

export const findById = (id) =>
  prisma.discountRule.findUnique({
    where: { id },
    include: { targetTier: true }
  });

export const findByCategory = (category) =>
  prisma.discountRule.findFirst({
    where: {
      appliedTo: 'CATEGORY',
      productCategory: { equals: category, mode: 'insensitive' }
    }
  });

export const create = (data) =>
  prisma.discountRule.create({
    data,
    include: { targetTier: true }
  });

export const remove = (id) =>
  prisma.discountRule.delete({ where: { id } });

export const findTierById = (id) =>
  prisma.customerTier.findUnique({ where: { id } });

export const findFirstTier = () =>
  prisma.customerTier.findFirst();
