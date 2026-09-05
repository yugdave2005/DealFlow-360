import { PrismaClient } from '@prisma/client';

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
      quotationNumber: v.quotation?.quotationNumber,
      versionNumber: v.versionNumber,
      riskScore: v.riskScore,
      totalAmount: v.totalAmount,
      totalDiscount: v.totalDiscount,
      createdBy: v.createdBy?.name
    })),
    deliverySlippage: slippedItems.map(i => ({
      orderId: i.fulfillmentPlan?.order?.orderNumber,
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

export const escalateIssue = async ({ itemId, type, notes }) => {
  // Normally you would integrate with an SMTP Service (Brevo/SendGrid) here
  // or create a task in a CRM system. 
  // We use the real-time notification socket to push an alert to specific roles.

  import('../../services/socket/socket.service.js').then(({ broadcastEvent }) => {
    broadcastEvent('DEAL_HEALTH_ESCALATION', {
      itemId,
      type,
      notes,
      timestamp: new Date(),
      message: `System Escalation: A ${type} issue has been manually escalated.`
    });
  });

  return { success: true, message: 'Notification dispatched to relevant stakeholders.' };
};
