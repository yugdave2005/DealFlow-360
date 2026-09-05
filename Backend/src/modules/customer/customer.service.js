import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { broadcastEvent } from '../../services/socket/socket.service.js';
import * as quotationService from '../quotations/quotation.service.js';

const prisma = new PrismaClient();

export const listCustomerQuotations = async (customerId) => {
  const where = customerId ? {
    OR: [
      { customerId },
      { status: { in: ['SENT', 'NEGOTIATION', 'APPROVED', 'CONFIRMED'] } }
    ]
  } : {};

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
      activeVersion: { include: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = [...new Set(quotations.map(q => q.customerId).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return quotations.map(q => {
    const cust = userMap.get(q.customerId);
    return {
      ...q,
      customer: cust ? {
        id: cust.id,
        name: cust.name,
        companyName: `${cust.name} Corp`,
        email: cust.email
      } : {
        companyName: 'Client Enterprise Corp'
      }
    };
  });
};

export const getCustomerQuotation = async (quotationId, customerId) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: {
      versions: { 
        orderBy: { versionNumber: 'desc' }, 
        take: 1, 
        include: { 
          items: true,
          messages: { orderBy: { createdAt: 'asc' } }
        } 
      },
      activeVersion: {
        include: {
          items: true,
          messages: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');

  const activeVer = quotation.activeVersion || quotation.versions[0];
  if (activeVer && activeVer.items) {
    const productIds = activeVer.items.map(it => it.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(products.map(p => [p.id, p]));
    activeVer.items = activeVer.items.map(it => ({
      ...it,
      product: productMap.get(it.productId) || { name: 'Commercial Line Item', category: 'General' }
    }));
  }

  let custUser = null;
  if (quotation.customerId) {
    custUser = await prisma.user.findUnique({
      where: { id: quotation.customerId },
      select: { id: true, name: true, email: true }
    });
  }

  return {
    ...quotation,
    customer: custUser ? {
      id: custUser.id,
      name: custUser.name,
      companyName: `${custUser.name} Corp`,
      email: custUser.email
    } : {
      id: quotation.customerId,
      name: 'Client Organization',
      companyName: 'Client Corporation',
      email: 'client@example.com'
    }
  };
};

export const negotiateQuotation = async (quotationId, customerId, { notes, counterDiscount }) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: { 
      versions: { 
        orderBy: { versionNumber: 'desc' }, 
        take: 1,
        include: { items: true }
      } 
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== 'SENT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'APPROVED') {
    throw new BadRequestError(`Quotation cannot be negotiated in current state (${quotation.status})`);
  }

  const activeVersion = quotation.versions[0];
  const newVersionNumber = (activeVersion?.versionNumber || 1) + 1;
  const discountPct = Number(counterDiscount) || 20;

  let totalAmount = 0;
  let totalDiscountValue = 0;
  for (const item of (activeVersion?.items || [])) {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice);
    const disc = lineTotal * (discountPct / 100);
    totalAmount += lineTotal - disc;
    totalDiscountValue += disc;
  }

  // Create a new version for the customer counter-offer
  const newVersion = await prisma.quotationVersion.create({
    data: {
      quotationId,
      versionNumber: newVersionNumber,
      totalAmount,
      totalDiscount: totalDiscountValue,
      riskScore: activeVersion ? Math.min(100, (activeVersion.riskScore || 25) + 15) : 40,
      internalNotes: `Customer counter-offer: ${discountPct}% discount requested. Notes: ${notes || 'None'}`,
      createdById: quotation.salesRepId,
      items: {
        create: (activeVersion?.items || []).map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercentage: discountPct
        }))
      }
    }
  });

  // Create negotiation message using correct schema fields
  await prisma.negotiationMessage.create({
    data: {
      quotationVersionId: newVersion.id,
      authorId: customerId || quotation.customerId,
      senderRole: 'CUSTOMER',
      content: notes || `Requested revised discount of ${discountPct}%`,
      proposedDiscount: discountPct,
      isCommercialChange: true
    }
  });

  // Update master quote status to NEGOTIATION
  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'NEGOTIATION', activeVersionId: newVersion.id }
  });

  broadcastEvent('QUOTATION_UPDATED', {
    quotationId,
    status: 'NEGOTIATION',
    message: `Customer proposed counter-offer with ${discountPct}% discount`
  });

  return newVersion;
};

export const acceptQuotation = async (quotationId, customerId) => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { approvals: true } }
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  
  // Only SENT quotations (approved and dispatched) can be accepted
  if (quotation.status !== 'SENT' && quotation.status !== 'APPROVED') {
    throw new BadRequestError(`Quotation cannot be accepted in current state (${quotation.status}). Must be SENT or APPROVED.`);
  }

  // Check no pending approvals remain
  const activeVersion = quotation.versions[0];
  if (activeVersion) {
    const pendingApprovals = (activeVersion.approvals || []).filter(a => a.status === 'PENDING');
    if (pendingApprovals.length > 0) {
      throw new BadRequestError('Cannot accept: quotation has pending approvals.');
    }
  }

  // Confirm quotation and generate order & fulfillment plan
  const result = await quotationService.confirmQuotation(quotationId, quotation.salesRepId);

  broadcastEvent('QUOTATION_UPDATED', {
    quotationId,
    status: 'CONFIRMED',
    orderNumber: result?.order?.orderNumber,
    message: `Quotation ${quotation.quotationNumber} confirmed by customer!`
  });

  return result;
};

