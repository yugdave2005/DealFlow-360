import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findByVersionId = (quotationVersionId) =>
  prisma.negotiationMessage.findMany({
    where: { quotationVersionId },
    orderBy: { createdAt: 'asc' }
  });

export const findByQuotationId = async (quotationId) => {
  const versions = await prisma.quotationVersion.findMany({
    where: { quotationId },
    select: { id: true }
  });
  const versionIds = versions.map(v => v.id);
  return prisma.negotiationMessage.findMany({
    where: { quotationVersionId: { in: versionIds } },
    orderBy: { createdAt: 'asc' }
  });
};

export const create = (data) =>
  prisma.negotiationMessage.create({ data });
