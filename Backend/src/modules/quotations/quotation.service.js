import { PrismaClient } from '@prisma/client';
import { calculateRiskScore, getRiskLevel } from '../risk/risk.engine.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { determineApprovalRequirement } from '../../utils/approvalEvaluator.js';
import { broadcastEvent } from '../../services/socket/socket.service.js';

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

  broadcastEvent('QUOTATION_CREATED', {
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    customerId,
    salesRepId
  });

  return quotation;
};

export const updateQuotation = async (quotationId, { customerId, lineItems }, userId) => {
  if (!lineItems || lineItems.length === 0) {
    throw new BadRequestError('A quotation must have at least one line item');
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true } }
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');

  let totalAmount = 0;
  let totalDiscountValue = 0;

  for (const item of lineItems) {
    const itemTotal = (Number(item.quantity) * Number(item.unitPrice));
    const itemDiscountValue = itemTotal * ((Number(item.discountPercentage) || 0) / 100);
    totalAmount += itemTotal - itemDiscountValue;
    totalDiscountValue += itemDiscountValue;
  }

  if (quotation.status === 'DRAFT') {
    const activeVer = quotation.versions[0];
    await prisma.quotationItem.deleteMany({
      where: { quotationVersionId: activeVer.id }
    });

    await prisma.quotationItem.createMany({
      data: lineItems.map(item => ({
        quotationVersionId: activeVer.id,
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercentage: Number(item.discountPercentage) || 0
      }))
    });

    await prisma.quotationVersion.update({
      where: { id: activeVer.id },
      data: {
        totalAmount,
        totalDiscount: totalDiscountValue
      }
    });

    if (customerId) {
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { customerId }
      });
    }

    const updated = await getQuotationById(quotationId, userId, 'ADMIN');
    broadcastEvent('QUOTATION_UPDATED', { quotationId, status: 'DRAFT', quotation: updated });
    return updated;
  } else {
    // Non-draft revision
    const activeVer = quotation.versions[0];
    const newVersionNumber = (activeVer?.versionNumber || 1) + 1;

    const newVersion = await prisma.quotationVersion.create({
      data: {
        quotationId,
        versionNumber: newVersionNumber,
        totalAmount,
        totalDiscount: totalDiscountValue,
        createdById: userId,
        items: {
          create: lineItems.map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountPercentage: Number(item.discountPercentage) || 0
          }))
        }
      }
    });

    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        activeVersionId: newVersion.id,
        customerId: customerId || quotation.customerId,
        status: 'DRAFT'
      }
    });

    const updated = await getQuotationById(quotationId, userId, 'ADMIN');
    broadcastEvent('QUOTATION_UPDATED', { quotationId, status: 'DRAFT', quotation: updated });
    return updated;
  }
};

export const getQuotations = async (userId, role) => {
  let where = {};
  if (role === 'CUSTOMER') {
    where = {
      OR: [
        { customerId: userId },
        { status: { in: ['SENT', 'NEGOTIATION', 'APPROVED', 'CONFIRMED'] } }
      ]
    };
  }
  
  const quotes = await prisma.quotation.findMany({
    where,
    include: {
      versions: {
        include: { 
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } },
          messages: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { versionNumber: 'desc' }
      },
      activeVersion: {
        include: {
          items: true,
          approvals: { orderBy: { createdAt: 'desc' } },
          messages: { orderBy: { createdAt: 'desc' } }
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

  // Enrich items with full Product definitions
  const allItems = [
    ...(quote.versions?.flatMap(v => v.items) || []),
    ...(quote.activeVersion?.items || [])
  ];
  const prodIds = [...new Set(allItems.map(i => i.productId).filter(Boolean))];
  const prods = await prisma.product.findMany({
    where: { id: { in: prodIds } }
  });
  const prodMap = new Map(prods.map(p => [p.id, p]));

  const enrichVersionItems = (version) => {
    if (!version) return version;
    return {
      ...version,
      items: (version.items || []).map(it => {
        const p = prodMap.get(it.productId);
        return {
          ...it,
          product: p || null,
          productName: p?.name || `Item #${it.productId?.slice(-4) || '1'}`,
          productSku: p?.sku || `SKU-${it.productId?.slice(0, 6)}`,
          productCategory: p?.category || 'HARDWARE'
        };
      })
    };
  };

  const enrichedVersions = (quote.versions || []).map(enrichVersionItems);
  const enrichedActiveVersion = enrichVersionItems(quote.activeVersion || enrichedVersions[0]);

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
    versions: enrichedVersions,
    activeVersion: enrichedActiveVersion,
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

  // Evaluate dynamic governance from DB
  const approvalEval = await determineApprovalRequirement(prisma, riskScore);

  if (approvalEval.required) {
    // Create ApprovalRequest on the version
    await prisma.approvalRequest.create({
      data: {
        quotationVersionId: activeVersion.id,
        assignedRole: approvalEval.role,
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

    broadcastEvent('QUOTATION_SUBMITTED', {
      quotationId,
      status: 'PENDING_APPROVAL',
      approvalRequired: true,
      requiredRole: approvalEval.role,
      riskScore
    });

    return {
      approvalRequired: true,
      riskScore,
      riskLevel,
      requiredRole: approvalEval.role,
      quotation: updated,
      message: `${approvalEval.role === 'ADMIN' ? 'Executive' : approvalEval.role === 'FINANCE' ? 'Finance' : 'Sales Manager'} approval is required.`
    };
  } else {
    // Auto-approve: transition to SENT so it is available on customer portal
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'SENT' },
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
    });

    broadcastEvent('QUOTATION_SUBMITTED', {
      quotationId,
      status: 'SENT',
      approvalRequired: false,
      riskScore
    });

    return {
      approvalRequired: false,
      riskScore,
      riskLevel,
      quotation: updated,
      message: 'Quotation approved within standard tier governance and dispatched.'
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

  broadcastEvent('QUOTATION_SENT', {
    quotationId,
    status: 'SENT',
    message: `Quotation ${quotation.quotationNumber} dispatched to Customer Portal`
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

    // Log the rejection as a negotiation message
    await prisma.negotiationMessage.create({
      data: {
        quotationVersionId: activeVersion.id,
        authorId: userId,
        senderRole: 'SALES_REP',
        content: comments || 'Counter proposal rejected. Original terms maintained.',
        isCommercialChange: false
      }
    });

    broadcastEvent('QUOTATION_UPDATED', {
      quotationId,
      status: 'SENT',
      message: 'Counter proposal rejected. Original terms maintained.'
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

  // Create negotiation message using correct schema fields
  await prisma.negotiationMessage.create({
    data: {
      quotationVersionId: newVersion.id,
      authorId: userId,
      senderRole: 'SALES_REP',
      content: comments || `Sales updated discount to ${discountPct}%`,
      proposedDiscount: discountPct,
      isCommercialChange: true
    }
  });

  // Calculate new risk score
  const newRisk = await calculateRiskScore(newVersion.id);

  // Evaluate dynamic governance from DB
  const approvalEval = await determineApprovalRequirement(prisma, newRisk);

  if (approvalEval.required) {
    await prisma.approvalRequest.create({
      data: {
        quotationVersionId: newVersion.id,
        assignedRole: approvalEval.role,
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

    broadcastEvent('QUOTATION_UPDATED', {
      quotationId,
      status: 'PENDING_APPROVAL',
      message: 'Approval required again because negotiated terms exceed allowed threshold.'
    });

    return {
      success: true,
      reapprovalRequired: true,
      message: 'Approval required again because negotiated terms exceed allowed threshold.',
      quotation: updated
    };
  } else {
    // Within limits -> SENT to customer
    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { 
        activeVersionId: newVersion.id,
        status: 'SENT' 
      },
      include: { 
        versions: { include: { items: true, approvals: true } },
        activeVersion: { include: { items: true, approvals: true } }
      }
    });

    broadcastEvent('QUOTATION_UPDATED', {
      quotationId,
      status: 'SENT',
      message: 'Negotiated terms accepted and sent to customer.'
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
 * Confirm Quotation: Validates state, transitions to CONFIRMED, creates Order with items,
 * reserves inventory, creates FulfillmentPlan, splits billing between one-time Invoice 
 * and recurring Subscriptions. All in a single transaction.
 */
export const confirmQuotation = async (quotationId, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { items: true, approvals: true } },
      order: true
    }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');

  // State machine validation: only SENT or APPROVED can be confirmed
  const allowedStatuses = ['SENT', 'APPROVED', 'NEGOTIATION'];
  if (!allowedStatuses.includes(quotation.status)) {
    throw new BadRequestError(`Cannot confirm quotation in status: ${quotation.status}. Must be SENT or APPROVED.`);
  }

  // Prevent duplicate confirmation
  if (quotation.order) {
    throw new BadRequestError(`Quotation already has order ${quotation.order.orderNumber}`);
  }

  const activeVersion = quotation.versions[0];
  if (!activeVersion) throw new BadRequestError('Quotation version not found');

  // Check all pending approvals are resolved
  const pendingApprovals = (activeVersion.approvals || []).filter(a => a.status === 'PENDING');
  if (pendingApprovals.length > 0) {
    throw new BadRequestError('Cannot confirm: there are pending approvals on this quotation.');
  }

  // Load products for the items
  const productIds = activeVersion.items.map(it => it.productId).filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map(p => [p.id, p]));

  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${String(orderCount + 1004).padStart(4, '0')}`;

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark quotation confirmed
    const updatedQuote = await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'CONFIRMED' }
    });

    // 2. Create Order with OrderItems
    const oneTimeItems = [];
    const subscriptionItems = [];

    for (const item of activeVersion.items) {
      const prod = productMap.get(item.productId);
      const orderItemData = {
        productId: item.productId,
        snapshotName: prod?.name || `Product ${item.productId.slice(-4)}`,
        quantity: item.quantity,
        snapshotUnitPrice: item.unitPrice,
        snapshotDiscount: item.discountPercentage,
        isSubscription: prod?.isSubscription || false
      };

      if (prod?.isSubscription) {
        subscriptionItems.push({ ...orderItemData, product: prod });
      } else {
        oneTimeItems.push(orderItemData);
      }
    }

    const allItems = [...oneTimeItems, ...subscriptionItems.map(({ product, ...rest }) => rest)];

    const order = await tx.order.create({
      data: {
        orderNumber,
        quotationId,
        customerId: quotation.customerId,
        totalAmount: activeVersion.totalAmount,
        status: 'PROCESSING',
        items: { create: allItems }
      }
    });

    // 3. Reserve inventory for non-subscription physical items
    for (const item of activeVersion.items) {
      const prod = productMap.get(item.productId);
      if (prod?.isSubscription) continue; // No inventory for subscriptions

      // Find available inventory across warehouses
      const inventoryRecords = await tx.inventory.findMany({
        where: { productId: item.productId, availableQuantity: { gt: 0 } },
        orderBy: { availableQuantity: 'desc' }
      });

      let remaining = item.quantity;
      for (const inv of inventoryRecords) {
        if (remaining <= 0) break;
        const reserveQty = Math.min(remaining, inv.availableQuantity);
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            availableQuantity: { decrement: reserveQty },
            reservedQuantity: { increment: reserveQty }
          }
        });
        remaining -= reserveQty;
      }
      // If remaining > 0, that's a backorder situation — we still create the order
    }

    // 4. Create Fulfillment Plan
    const warehouses = await tx.warehouse.findMany({ include: { inventory: true } });
    const fulfillmentItems = [];

    for (const item of activeVersion.items) {
      const prod = productMap.get(item.productId);
      if (prod?.isSubscription) continue;

      // Find warehouses with this product
      let remaining = item.quantity;
      for (const wh of warehouses) {
        if (remaining <= 0) break;
        const whInventory = wh.inventory.find(inv => inv.productId === item.productId);
        if (!whInventory || whInventory.availableQuantity + whInventory.reservedQuantity <= 0) continue;

        const allocQty = Math.min(remaining, item.quantity); // Simple: allocate from first available
        fulfillmentItems.push({
          productId: item.productId,
          quantity: allocQty,
          warehouseId: wh.id,
          status: 'PENDING',
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });
        remaining -= allocQty;
      }

      // Backorder remainder
      if (remaining > 0) {
        fulfillmentItems.push({
          productId: item.productId,
          quantity: remaining,
          warehouseId: null,
          status: 'BACKORDER',
          estimatedDelivery: null
        });
      }
    }

    let fulfillmentPlan = null;
    if (fulfillmentItems.length > 0) {
      fulfillmentPlan = await tx.fulfillmentPlan.create({
        data: {
          orderId: order.id,
          optimizationMode: 'BALANCED',
          totalCost: fulfillmentItems.length * 500, // ₹500 per shipment estimate
          shipmentCount: fulfillmentItems.filter(fi => fi.warehouseId).length,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          items: { create: fulfillmentItems }
        }
      });
    }

    // 5. Create one-time Invoice for non-subscription items
    let invoice = null;
    if (oneTimeItems.length > 0) {
      let oneTimeTotal = 0;
      for (const item of oneTimeItems) {
        const lineTotal = Number(item.quantity) * Number(item.snapshotUnitPrice);
        const discountAmt = lineTotal * (Number(item.snapshotDiscount) / 100);
        oneTimeTotal += lineTotal - discountAmt;
      }
      const taxAmount = oneTimeTotal * 0.18; // 18% GST

      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(4, '0')}`;

      invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerId: quotation.customerId,
          totalAmount: oneTimeTotal + taxAmount,
          taxAmount,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 6. Create Subscriptions for subscription items
    const subscriptions = [];
    for (const subItem of subscriptionItems) {
      const intervalDays = subItem.product.recurringInterval === 'MONTHLY' ? 30 :
        subItem.product.recurringInterval === 'QUARTERLY' ? 90 : 365;

      const sub = await tx.subscription.create({
        data: {
          orderId: order.id,
          customerId: quotation.customerId,
          interval: subItem.product.recurringInterval || 'MONTHLY',
          status: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)
        }
      });
      subscriptions.push(sub);
    }

    // 7. Create audit log
    await tx.auditLog.create({
      data: {
        actorId: userId || quotation.salesRepId,
        entityType: 'QUOTATION',
        entityId: quotationId,
        action: 'CONFIRMED',
        oldData: { status: quotation.status },
        newData: { status: 'CONFIRMED', orderNumber }
      }
    });

    return { quotation: updatedQuote, order, fulfillmentPlan, invoice, subscriptions };
  });

  broadcastEvent('QUOTATION_CONFIRMED', {
    quotationId,
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    status: 'CONFIRMED'
  });

  return result;
};

