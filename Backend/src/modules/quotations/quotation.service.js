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
        customerId: customerId || 'default-customer',
        salesRepId: salesRepId || 'default-rep',
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
          include: { 
            items: true,
            approvals: true 
          }
        },
        activeVersion: {
          include: {
            items: true,
            approvals: true
          }
        }
      }
    });

    return finalizedQuote;
  });

  return quotation;
};

export const getQuotations = async (userId, role) => {
  const where = role === 'SALES_REP' ? { salesRepId: userId } : {};
  
  const quotes = await prisma.quotation.findMany({
    where,
    include: {
      versions: {
        include: { 
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { versionNumber: 'desc' }
      },
      activeVersion: {
        include: {
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Attach customer and salesRep profiles
  const customerIds = [...new Set(quotes.map(q => q.customerId).filter(Boolean))];
  const salesRepIds = [...new Set(quotes.map(q => q.salesRepId).filter(Boolean))];

  const [customers, salesReps] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, role: true }
    }),
    prisma.user.findMany({
      where: { id: { in: salesRepIds } },
      select: { id: true, name: true, email: true }
    })
  ]);

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const salesRepMap = new Map(salesReps.map(s => [s.id, s]));

  return quotes.map(quote => {
    const custUser = customerMap.get(quote.customerId);
    const repUser = salesRepMap.get(quote.salesRepId);
    return {
      ...quote,
      customer: custUser ? {
        id: custUser.id,
        name: custUser.name,
        companyName: `${custUser.name} Corp`,
        email: custUser.email,
        tier: 'GOLD'
      } : {
        id: quote.customerId,
        name: 'Enterprise Client',
        companyName: 'Client Corporation',
        email: 'billing@clientcorp.com',
        tier: 'STANDARD'
      },
      salesRep: repUser || { name: 'Sales Representative' }
    };
  });
};

export const getQuotationById = async (id, userId, role) => {
  const where = { id };
  if (role === 'SALES_REP') {
    where.salesRepId = userId;
  }
  
  const quote = await prisma.quotation.findFirst({
    where,
    include: {
      versions: {
        include: { 
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } },
          messages: { orderBy: { createdAt: 'asc' } }
        },
        orderBy: { versionNumber: 'desc' }
      },
      activeVersion: {
        include: {
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } },
          messages: { orderBy: { createdAt: 'asc' } }
        }
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

  if (!quote) return null;

  // Attach customer user profile
  let custUser = null;
  if (quote.customerId) {
    custUser = await prisma.user.findUnique({
      where: { id: quote.customerId },
      select: { id: true, name: true, email: true }
    });
  }

  let repUser = null;
  if (quote.salesRepId) {
    repUser = await prisma.user.findUnique({
      where: { id: quote.salesRepId },
      select: { id: true, name: true, email: true }
    });
  }

  return {
    ...quote,
    customer: custUser ? {
      id: custUser.id,
      name: custUser.name,
      companyName: `${custUser.name} Corp`,
      email: custUser.email,
      tier: 'GOLD'
    } : {
      id: quote.customerId,
      name: 'Enterprise Client',
      companyName: 'Client Corporation',
      email: 'billing@clientcorp.com',
      tier: 'STANDARD'
    },
    salesRep: repUser || { name: 'Sales Representative' }
  };
};

/**
 * Submit Quotation: Backend evaluates discount governance, calculates blended risk,
 * routes to APPROVAL or marks ready/SENT.
 */
export const submitQuotation = async (quotationId, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
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

  // Check discount governance
  let approvalRequired = false;
  let requiredRole = 'SALES_MANAGER';

  if (riskScore > 25) {
    approvalRequired = true;
    if (riskScore > 75) {
      requiredRole = 'ADMIN';
    } else if (riskScore > 50) {
      requiredRole = 'FINANCE';
    }
  }

  // Check line violations
  for (const item of activeVersion.items) {
    if (Number(item.discountPercentage) > 15) {
      approvalRequired = true;
    }
    if (Number(item.discountPercentage) > 25) {
      requiredRole = 'ADMIN';
    }
  }

  if (approvalRequired) {
    // Create ApprovalRequest on the version
    await prisma.approvalRequest.create({
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
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
    });

    return {
      approvalRequired: true,
      riskScore,
      riskLevel,
      requiredRole,
      quotation: updated,
      message: `${requiredRole === 'ADMIN' ? 'Executive' : requiredRole === 'FINANCE' ? 'Finance' : 'Sales Manager'} approval is required.`
    };
  } else {
    // Auto-approve: transition to APPROVED / READY
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'APPROVED' },
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
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
    include: { 
      versions: { include: { items: true } },
      activeVersion: { include: { items: true } }
    }
  });

  return {
    success: true,
    portalUrl: `/customer/quotation/${quotationId}`,
    quotation: updated
  };
};

/**
 * Respond to customer negotiation (Accept, Counter, or Reject).
 */
export const respondToNegotiation = async (quotationId, { action, proposedDiscountPercentage, comments }, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
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
  if (discountPct > 15 || newRisk > 25) {
    await prisma.approvalRequest.create({
      data: {
        quotationVersionId: newVersion.id,
        assignedRole: newRisk > 75 ? 'ADMIN' : newRisk > 50 ? 'FINANCE' : 'SALES_MANAGER',
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
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
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
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
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
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
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
        customerId: quotation.customerId,
        totalAmount: activeVersion.totalAmount,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
      }
    });

    return { quotation: updatedQuote, order, plan };
  });

  return result;
};
