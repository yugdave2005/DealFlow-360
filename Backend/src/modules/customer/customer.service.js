import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { broadcastEvent } from '../../services/socket/socket.service.js';
import * as quotationService from '../quotations/quotation.service.js';
import { determineApprovalRequirement } from '../../utils/approvalEvaluator.js';
import { calculateRiskScore } from '../risk/risk.engine.js';

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
      versions: { 
        orderBy: { versionNumber: 'desc' }, 
        include: { 
          items: true,
          messages: { orderBy: { createdAt: 'desc' } }
        } 
      },
      activeVersion: { 
        include: { 
          items: true,
          messages: { orderBy: { createdAt: 'desc' } }
        } 
      }
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

  const allVersions = [quotation.activeVersion, ...(quotation.versions || [])].filter(Boolean);
  const productIds = [...new Set(allVersions.flatMap(v => v.items?.map(it => it.productId) || []).filter(Boolean))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  const enrichItems = (ver) => {
    if (!ver || !ver.items) return ver;
    ver.items = ver.items.map((it, idx) => {
      const prod = productMap.get(it.productId);
      const qty = Number(it.quantity || 1);
      const unitPrice = Number(it.unitPrice || 0);
      const disc = Number(it.discountPercentage || 0);
      const lineTotal = (qty * unitPrice) * (1 - disc / 100);
      return {
        ...it,
        quantity: qty,
        unitPrice: unitPrice,
        discountPercentage: disc,
        lineTotal: Math.round(lineTotal * 100) / 100,
        product: prod || { id: it.productId, name: `Commercial Item #${idx + 1}`, category: 'General' }
      };
    });
    return ver;
  };

  if (quotation.activeVersion) enrichItems(quotation.activeVersion);
  if (quotation.versions) quotation.versions.forEach(enrichItems);

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

  // Verify if salesRep exists to prevent FK violation
  const salesRepExists = await prisma.user.findUnique({
    where: { id: quotation.salesRepId }
  });

  // Create a new version for the customer counter-offer
  const newVersion = await prisma.quotationVersion.create({
    data: {
      quotationId,
      versionNumber: newVersionNumber,
      totalAmount,
      totalDiscount: totalDiscountValue,
      internalNotes: `Customer counter-offer: ${discountPct}% discount requested. Notes: ${notes || 'None'}`,
      createdById: salesRepExists ? quotation.salesRepId : null,
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

  const realRiskScore = await calculateRiskScore(newVersion.id);
  
  // Evaluate dynamic governance from DB
  const approvalEval = await determineApprovalRequirement(prisma, realRiskScore);

  if (approvalEval.required) {
    await prisma.approvalRequest.create({
      data: {
        quotationVersionId: newVersion.id,
        assignedRole: approvalEval.role,
        status: 'PENDING',
        comments: `Approval required for customer counter-offer: Discount requested is ${discountPct}%`
      }
    });

    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'PENDING_APPROVAL', activeVersionId: newVersion.id }
    });

    broadcastEvent('QUOTATION_UPDATED', {
      quotationId,
      status: 'PENDING_APPROVAL',
      message: `Customer proposed counter-offer with ${discountPct}% discount - Pending Manager Approval`
    });
  } else {
    // Update master quote status to NEGOTIATION (within limits, sales rep can review)
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'NEGOTIATION', activeVersionId: newVersion.id }
    });

    broadcastEvent('QUOTATION_UPDATED', {
      quotationId,
      status: 'NEGOTIATION',
      message: `Customer proposed counter-offer with ${discountPct}% discount`
    });
  }

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

export const declineQuotation = async (quotationId, customerId, reason = 'Commercial terms declined by customer') => {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
  });
  if (!quotation) throw new NotFoundError('Quotation not found');

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'CANCELLED' }
  });

  const activeVersion = quotation.versions[0];
  if (activeVersion) {
    await prisma.negotiationMessage.create({
      data: {
        quotationVersionId: activeVersion.id,
        authorId: customerId || quotation.customerId,
        senderRole: 'CUSTOMER',
        content: `Customer declined quotation: ${reason}`,
        isCommercialChange: false
      }
    });
  }

  broadcastEvent('QUOTATION_UPDATED', {
    quotationId,
    status: 'CANCELLED',
    message: `Quotation ${quotation.quotationNumber} declined by customer.`
  });

  return updated;
};

export const listCustomerInvoices = async (customerId) => {
  const where = customerId ? { customerId } : {};

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      payments: true,
      order: {
        include: {
          items: true,
          quotation: {
            select: { quotationNumber: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return invoices.map(inv => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(0, Number(inv.totalAmount) - paid);
    const itemsSummary = inv.order?.items?.map(i => `${i.quantity}x ${i.snapshotName}`).join(', ') || 'Commercial Order';
    const quotationNumber = inv.order?.quotation?.quotationNumber || null;
    return {
      ...inv,
      amount: Number(inv.totalAmount || 0),
      amountPaid: paid,
      amountRemaining: remaining,
      orderNumber: inv.order?.orderNumber || `ORD-${inv.orderId?.slice(-4) || '???'}`,
      quotationNumber,
      itemsSummary
    };
  });
};

export const payCustomerInvoice = async (invoiceId, customerId, body = {}) => {
  // Verify the invoice belongs to this customer
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId },
    include: { payments: true }
  });
  if (!invoice) throw new NotFoundError('Invoice not found or not accessible');
  if (invoice.status === 'PAID') throw new BadRequestError('Invoice is already fully paid');

  const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Math.max(0, Number(invoice.totalAmount) - alreadyPaid);

  const paymentAmount = body.amount && Number(body.amount) > 0
    ? Math.min(Number(body.amount), remaining)
    : remaining;

  const paymentMethod = body.paymentMethod || 'BANK_TRANSFER';
  const reference = body.reference || `CUST-TXN-${Math.floor(100000 + Math.random() * 900000)}`;

  await prisma.payment.create({
    data: { invoiceId: invoice.id, amount: paymentAmount, paymentMethod, reference }
  });

  const totalPaid = alreadyPaid + paymentAmount;
  const newStatus = totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: newStatus },
    include: { payments: true }
  });

  broadcastEvent('INVOICE_UPDATED', { invoiceId: invoice.id, status: newStatus, customerId });
  return updated;
};
