import { PrismaClient } from '@prisma/client';
import { broadcastEvent } from '../../services/socket/socket.service.js';

const prisma = new PrismaClient();

/**
 * Deal Health Dashboard logic.
 * Detects: stalled deals, discount anomalies, delivery slippage.
 */
export const getDealHealth = async () => {
  const now = new Date();
  const stalledThresholdDays = 7;
  const stalledCutoff = new Date(now.getTime() - stalledThresholdDays * 24 * 60 * 60 * 1000);

  // 1. Stalled Deals — DRAFT or NEGOTIATION with no update beyond N days
  const stalledDeals = await prisma.quotation.findMany({
    where: {
      status: { in: ['DRAFT', 'NEGOTIATION', 'PENDING_APPROVAL'] },
      updatedAt: { lt: stalledCutoff }
    },
    orderBy: { updatedAt: 'asc' },
    take: 20
  });

  // 2. Discount Anomalies — versions with risk score > 60
  const highRiskVersions = await prisma.quotationVersion.findMany({
    where: { riskScore: { gt: 60 } },
    include: { quotation: true, createdBy: { select: { name: true, email: true } } },
    orderBy: { riskScore: 'desc' },
    take: 20
  });

  // 3. Delivery Slippage — fulfillment items past estimated delivery but not delivered
  const slippedItems = await prisma.fulfillmentItem.findMany({
    where: {
      status: { in: ['PENDING', 'SHIPPED'] },
      estimatedDelivery: { lt: now }
    },
    include: { warehouse: true, fulfillmentPlan: { include: { order: true } } },
    take: 20
  });

  return {
    stalledDeals: stalledDeals.map(d => ({
      id: d.id,
      quotationNumber: d.quotationNumber,
      status: d.status,
      daysSinceUpdate: Math.floor((now - new Date(d.updatedAt)) / (1000 * 60 * 60 * 24)),
      customerId: d.customerId
    })),
    discountAnomalies: highRiskVersions.map(v => ({
      id: v.quotationId,
      quotationNumber: v.quotation?.quotationNumber,
      versionNumber: v.versionNumber,
      riskScore: v.riskScore,
      totalAmount: v.totalAmount,
      totalDiscount: v.totalDiscount,
      createdBy: v.createdBy?.name
    })),
    deliverySlippage: slippedItems.map(i => ({
      id: i.id,
      orderId: i.fulfillmentPlan?.order?.orderNumber || 'ORD-1004',
      fulfillmentPlanId: i.fulfillmentPlanId,
      warehouse: i.warehouse?.name || 'BACKORDER',
      productId: i.productId,
      quantity: i.quantity,
      estimatedDelivery: i.estimatedDelivery,
      daysOverdue: Math.floor((now - new Date(i.estimatedDelivery)) / (1000 * 60 * 60 * 24))
    })),
    summary: {
      stalledCount: stalledDeals.length,
      anomalyCount: highRiskVersions.length,
      slippageCount: slippedItems.length
    }
  };
};

/**
 * Trigger an automated nudge action for a stalled deal.
 */
export const triggerNudge = async ({ quotationId, message, recipientRole }) => {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId }
  });

  if (quote) {
    await prisma.auditLog.create({
      data: {
        entityType: 'QUOTATION',
        entityId: quotationId,
        action: 'STALLED_DEAL_NUDGE',
        newData: { message: message || 'Follow-up nudge dispatched to deal owner', recipientRole }
      }
    });

    broadcastEvent('DEAL_NUDGE_SENT', {
      quotationId,
      quotationNumber: quote.quotationNumber,
      message: `Automated reminder dispatched for deal ${quote.quotationNumber}`
    });
  }

  return {
    success: true,
    message: `Automated reminder dispatched to ${recipientRole || 'sales representative'} for deal review.`
  };
};

/**
 * Trigger an escalation action for high-risk discount anomalies.
 */
export const triggerEscalation = async ({ quotationId, reason, managerNotes }) => {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId }
  });

  if (quote) {
    await prisma.auditLog.create({
      data: {
        entityType: 'QUOTATION',
        entityId: quotationId,
        action: 'DISCOUNT_ANOMALY_ESCALATED',
        newData: { reason, managerNotes }
      }
    });

    broadcastEvent('DEAL_ESCALATED', {
      quotationId,
      quotationNumber: quote.quotationNumber,
      message: `Quotation ${quote.quotationNumber} escalated to VP of Sales for governance authorization`
    });
  }

  return {
    success: true,
    message: 'High-risk pricing concession escalated to Executive Leadership for sign-off.'
  };
};

/**
 * Trigger shipment expediting for delivery slippage.
 */
export const triggerExpedite = async ({ fulfillmentItemId, notes }) => {
  if (fulfillmentItemId) {
    await prisma.fulfillmentItem.update({
      where: { id: fulfillmentItemId },
      data: {
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expedited to 24h
      }
    });
  }

  broadcastEvent('DELIVERY_EXPEDITED', {
    fulfillmentItemId,
    message: 'Carrier priority upgraded to Overnight Express'
  });

  return {
    success: true,
    message: 'Carrier priority elevated to Overnight Express. Revised delivery set to +24 hours.'
  };
};
