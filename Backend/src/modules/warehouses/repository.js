import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAll = () =>
  prisma.warehouse.findMany({
    include: { inventory: { include: { product: true } } }
  });

export const findById = (id) =>
  prisma.warehouse.findUnique({
    where: { id },
    include: { inventory: { include: { product: true } } }
  });

export const findByCode = (code) =>
  prisma.warehouse.findUnique({ where: { code } });

export const create = (data) =>
  prisma.warehouse.create({ data });

export const update = (id, data) =>
  prisma.warehouse.update({ where: { id }, data });

export const upsertByCode = (code, data) =>
  prisma.warehouse.upsert({
    where: { code },
    update: {},
    create: { code, ...data }
  });

export const remove = async (id) => {
  await prisma.inventory.deleteMany({ where: { warehouseId: id } });
  await prisma.fulfillmentItem.updateMany({
    where: { warehouseId: id },
    data: { warehouseId: null }
  });
  return prisma.warehouse.delete({ where: { id } });
};

