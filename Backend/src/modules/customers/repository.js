import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAllCustomerUsers = () =>
  prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

export const findAllQuotations = () =>
  prisma.quotation.findMany({ include: { activeVersion: true } });

export const findAllTiers = () =>
  prisma.customerTier.findMany();
