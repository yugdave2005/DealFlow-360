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

export const updateCustomer = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });

export const deleteCustomer = async (id) => {
  const [quotesCount, ordersCount] = await Promise.all([
    prisma.quotation.count({ where: { customerId: id } }),
    prisma.order.count({ where: { customerId: id } })
  ]);

  if (quotesCount > 0 || ordersCount > 0) {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return { deactivated: true, message: 'Customer has transaction history and was deactivated' };
  } else {
    await prisma.auditLog.deleteMany({ where: { actorId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } });
    return { deleted: true, message: 'Customer deleted successfully' };
  }
};
