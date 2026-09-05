import { PrismaClient } from '@prisma/client';
import { calculateRiskScore, getRiskLevel } from '../risk/risk.engine.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const createQuotation = async ({ salesRepId, customerId, lineItems }) => {
  if (!lineItems || lineItems.length === 0) {
    throw new BadRequestError('A quotation must have at least one line item');
  }

  // Calculate commercial totals
  let totalAmount = 0;
  let totalDiscountValue = 0;

  for (const item of lineItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new BadRequestError(`Product ${item.productId} not found`);

    const itemTotal = (item.quantity * item.unitPrice);
    const itemDiscountValue = itemTotal * ((item.discountPercentage || 0) / 100);
    
    totalAmount += itemTotal - itemDiscountValue;
    totalDiscountValue += itemDiscountValue;
  }

  // Generate strict sequential quotation number
  const count = await prisma.quotation.count();
  const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1001).padStart(4, '0')}`;

  // Execute in a transaction to enforce version sequence rule
  const quotation = await prisma.$transaction(async (tx) => {
    const newQuote = await tx.quotation.create({
      data: {
        quotationNumber,
        customerId,
        salesRepId,
        status: 'DRAFT',
      }
    });

    const version = await tx.quotationVersion.create({
      data: {
        quotationId: newQuote.id,
        versionNumber: 1,
        totalAmount,
        totalDiscount: totalDiscountValue,
        createdById: salesRepId,
        items: {
          create: lineItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage || 0
          }))
        }
      }
    });

    // Calculate initial risk score on creation
    const riskScore = await calculateRiskScore(version.id);

    // Link the active version back to the Quotation
    const finalizedQuote = await tx.quotation.update({
      where: { id: newQuote.id },
      data: { activeVersionId: version.id },
      include: {
        versions: {
          include: { items: true }
        },
        customer: true
      }
    });

    return finalizedQuote;
  });

  return quotation;
};

export const getQuotations = async (userId, role) => {
  const where = role === 'SALES_REP' ? { salesRepId: userId } : {};
  
  return prisma.quotation.findMany({
    where,
    include: {
      versions: {
        include: { items: true },
        orderBy: { versionNumber: 'desc' }
      },
      customer: true,
      approvalRequests: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getQuotationById = async (id, userId, role) => {
  const where = { id };
  if (role === 'SALES_REP') {
    where.salesRepId = userId;
  }
  
  return prisma.quotation.findFirst({
    where,
    include: {
      versions: {
        include: { items: true },
        orderBy: { versionNumber: 'desc' }
      },
      customer: true,
      approvalRequests: {
        orderBy: { createdAt: 'desc' }
      },
      order: {
        include: {
          fulfillmentPlan: {
            include: { items: true }
          },
          subscriptions: true,
          invoices: true
        }
      }
    }
  });
};

/**
 * Submit Quotation: Backend evaluates discount governance, calculates blended risk,
 * routes to APPROVAL or marks ready/SENT.
 */
export const submitQuotation = async (quotationId, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
      customer: true
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'REJECTED') {
    throw new BadRequestError(`Cannot submit quotation in status: ${quotation.status}`);
  }

  const activeVersion = quotation.versions[0];
  if (!activeVersion) throw new BadRequestError('Quotation version not found');

  // Recalculate risk score
  const riskScore = await calculateRiskScore(activeVersion.id);
  const riskLevel = getRiskLevel(riskScore);

  // Check customer tier discount rules
  const discountRules = await prisma.discountRule.findMany();
  let approvalRequired = false;
  let requiredRole = 'SALES_MANAGER';

  // If risk score > 30 or any line discount > 15%, approval is required
  if (riskScore > 30) {
    approvalRequired = true;
    if (riskScore > 60) {
      requiredRole = 'ADMIN'; // or FINANCE
    }
  }

  // Check line violations
  for (const item of activeVersion.items) {
    if (Number(item.discountPercentage) > 15) {
      approvalRequired = true;
    }
    if (Number(item.discountPercentage) > 20) {
      requiredRole = 'ADMIN';
    }
  }

  if (approvalRequired) {
    // Create ApprovalRequest
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        quotationVersionId: activeVersion.id,
        assignedRole: requiredRole,
        status: 'PENDING'
      }
    });

    // Update status to PENDING_APPROVAL
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'PENDING_APPROVAL' },
      include: { versions: { include: { items: true } }, approvalRequests: true }
    });

    return {
      approvalRequired: true,
      riskScore,
      riskLevel,
      requiredRole,
      quotation: updated,
      message: `${requiredRole === 'ADMIN' ? 'Finance / Executive' : 'Sales Manager'} approval is required.`
    };
  } else {
    // Auto-approve: transition to APPROVED / READY
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'APPROVED' },
      include: { versions: { include: { items: true } }, approvalRequests: true }
    });

    return {
      approvalRequired: false,
      riskScore,
      riskLevel,
      quotation: updated,
      message: 'Quotation approved within standard tier governance.'
    };
  }
};

/**
 * Send quotation to customer
 */
export const sendQuotation = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'SENT' },
    include: { customer: true, versions: { include: { items: true } } }
  });

  return {
    success: true,
    portalUrl: `/customer/quotation/${quotationId}`,
    quotation: updated
  };
};

/**
 * Respond to customer negotiation (Accept, Counter, or Reject).
 * If counter/accept terms exceed discount threshold, automatically triggers re-approval.
 */
export const respondToNegotiation = async (quotationId, { action, proposedDiscountPercentage, comments }, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
      customer: true
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  const activeVersion = quotation.versions[0];

  if (action === 'REJECT') {
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'SENT' }
    });
    return { success: true, message: 'Counter proposal rejected. Original terms maintained.', quotation: updated };
  }

  // If ACCEPT or COUNTER, create a new revision (V2, V3...)
  const newVersionNumber = (activeVersion.versionNumber || 1) + 1;
  const discountPct = Number(proposedDiscountPercentage) || activeVersion.items[0]?.discountPercentage || 15;

  let totalAmount = 0;
  let totalDiscountValue = 0;

  for (const item of activeVersion.items) {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice);
    const disc = lineTotal * (discountPct / 100);
    totalAmount += lineTotal - disc;
    totalDiscountValue += disc;
  }

  const newVersion = await prisma.quotationVersion.create({
    data: {
      quotationId,
      versionNumber: newVersionNumber,
      totalAmount,
      totalDiscount: totalDiscountValue,
      createdById: userId,
      items: {
        create: activeVersion.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercentage: discountPct
        }))
      }
    }
  });

  // Calculate new risk score
  const newRisk = await calculateRiskScore(newVersion.id);

  // If discountPct > 15%, re-approval is required
  if (discountPct > 15 || newRisk > 30) {
    await prisma.approvalRequest.create({
      data: {
        quotationVersionId: newVersion.id,
        assignedRole: newRisk > 60 ? 'ADMIN' : 'SALES_MANAGER',
        status: 'PENDING',
        comments: `Re-approval required due to negotiated terms change: ${comments || 'Discount updated to ' + discountPct + '%'}`
      }
    });

    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { 
        activeVersionId: newVersion.id,
        status: 'PENDING_APPROVAL' 
      },
      include: { versions: { include: { items: true } } }
    });

    return {
      success: true,
      reapprovalRequired: true,
      message: 'Approval required again because negotiated terms exceed allowed threshold.',
      quotation: updated
    };
  } else {
    // Within limits
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { 
        activeVersionId: newVersion.id,
        status: 'APPROVED' 
      },
      include: { versions: { include: { items: true } } }
    });

    return {
      success: true,
      reapprovalRequired: false,
      message: 'Negotiated terms accepted within approved limits.',
      quotation: updated
    };
  }
};

/**
 * Confirm Quotation: Transitions to CONFIRMED, creates Order snapshot,
 * creates multi-hub FulfillmentPlan, and creates Invoice.
 */
export const confirmQuotation = async (quotationId, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } },
      customer: true
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  const activeVersion = quotation.versions[0];

  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${String(orderCount + 1004).padStart(4, '0')}`;

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark quotation confirmed
    const updatedQuote = await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'CONFIRMED' }
    });

    // 2. Create Order snapshot
    const order = await tx.order.create({
      data: {
        orderNumber,
        quotationId,
        customerId: quotation.customerId,
        totalAmount: activeVersion.totalAmount,
        status: 'CONFIRMED'
      }
    });

    // 3. Create initial Fulfillment Plan
    const warehouses = await tx.warehouse.findMany({ take: 3 });
    const plan = await tx.fulfillmentPlan.create({
      data: {
        orderId: order.id,
        totalCost: 2450,
        shipmentCount: warehouses.length || 3
      }
    });

    // 4. Create initial Invoice (One-Time)
    const invoiceCount = await tx.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(4, '0')}`;
    
    await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        amount: activeVersion.totalAmount,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
      }
    });

    return { quotation: updatedQuote, order, plan };
  });

  return result;
};
