import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const getCustomerQuotation = async (quotationId, customerId) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, customerId: customerId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  return quotation;
};

export const negotiateQuotation = async (quotationId, customerId, { notes, counterDiscount }) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, customerId: customerId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== 'SENT' && quotation.status !== 'NEGOTIATION') {
    throw new BadRequestError('Quotation is not in a negotiable state');
  }

  // Create a new version for the counter-offer
  const activeVersion = quotation.versions[0];
  const newVersion = await prisma.quotationVersion.create({
    data: {
      quotationId,
      versionNumber: activeVersion.versionNumber + 1,
      totalAmount: activeVersion.totalAmount, // In a real app, calculate exact line item counters
      totalDiscount: counterDiscount ? counterDiscount : activeVersion.totalDiscount,
      riskScore: activeVersion.riskScore, // Re-calc would happen here if lines changed
      internalNotes: `Customer requested counter discount of ${counterDiscount || 'N/A'}. Notes: ${notes}`,
      createdById: quotation.salesRepId // Fallback to rep since customer is submitting
    }
  });

  // Update master quote status
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'NEGOTIATION', activeVersionId: newVersion.id }
  });

  return newVersion;
};

export const acceptQuotation = async (quotationId, customerId) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, customerId: customerId }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== 'SENT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'APPROVED') {
    throw new BadRequestError('Quotation cannot be accepted in current state');
  }

  // If terms changed significantly, it would normally go to PENDING_APPROVAL. 
  // For demo, we just CONFIRM it directly if they accept.
  return prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'CONFIRMED' }
  });
};
