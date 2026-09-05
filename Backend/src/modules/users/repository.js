import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = () =>
  prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' }
  });

export const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });

export const update = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });

export const remove = (id) =>
  prisma.user.delete({ where: { id } });

export const deactivate = (id) =>
  prisma.user.update({ where: { id }, data: { isActive: false } });
