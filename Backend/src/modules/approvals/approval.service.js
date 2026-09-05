import { PrismaClient } from '@prisma/client';
import { calculateRiskScore, getRiskLevel } from '../risk/risk.engine.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { broadcastEvent } from '../../services/socket/socket.service.js';

const prisma = new PrismaClient();

/**
 * Submit a DRAFT quotation for approval.
 */
export const submitForApproval = async (quotationId, userId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION') {
    throw new BadRequestError('Only DRAFT or NEGOTIATION quotations can be submitted for approval');
  }

  const activeVersion = quotation.versions[0];
  if (!activeVersion) throw new BadRequestError('No version found for this quotation');

  // Step 1: Calculate risk
  const riskScore = await calculateRiskScore(activeVersion.id);
  const riskLevel = getRiskLevel(riskScore);

  // Step 2: Find matching approval rule
  const approvalRule = await prisma.approvalRule.findFirst({
    where: {
      minRiskScore: { lte: riskScore },
      maxRiskScore: { gte: riskScore }
    },
    orderBy: { priority: 'desc' }
  });

  const requiredRole = approvalRule ? approvalRule.requiredApproverLevel : 
    riskLevel === 'LOW' ? 'SALES_MANAGER' :
    riskLevel === 'MEDIUM' ? 'SALES_MANAGER' : 'ADMIN';

  // Step 3: Create the approval request
  const approvalRequest = await prisma.approvalRequest.create({
    data: {
      quotationVersionId: activeVersion.id,
      assignedRole: requiredRole,
      status: 'PENDING'
    }
  });

  // Step 4: Move quotation to PENDING_APPROVAL
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'PENDING_APPROVAL' }
  });

  broadcastEvent('APPROVAL_REQUESTED', {
    quotationId,
    quotationNumber: quotation.quotationNumber,
    requiredRole,
    riskScore,
    status: 'PENDING_APPROVAL'
  });

  return { riskScore, riskLevel, requiredRole, approvalRequest };
};

/**
 * Action an approval request (approve/reject/return).
 */
export const actionApproval = async (approvalRequestId, action, userId, comments) => {
  const validActions = ['APPROVED', 'REJECTED', 'RETURNED'];
  if (!validActions.includes(action)) {
    throw new BadRequestError(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }

  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { quotationVersion: { include: { quotation: true } } }
  });

  if (!approval) throw new NotFoundError('Approval request not found');
  if (approval.status !== 'PENDING') throw new BadRequestError('This approval has already been actioned');

  // Update approval
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: {
      status: action,
      actionedById: userId,
      comments: comments || null
    }
  });

  // Update quotation status based on action:
  // Approved internal governance -> move to APPROVED (Sales Rep must manually send it)
  const newQuotationStatus = action === 'APPROVED' ? 'APPROVED' :
    action === 'REJECTED' ? 'REJECTED' : 'NEGOTIATION';

  await prisma.quotation.update({
    where: { id: approval.quotationVersion.quotation.id },
    data: { status: newQuotationStatus }
  });

  broadcastEvent('APPROVAL_ACTIONED', {
    quotationId: approval.quotationVersion.quotation.id,
    action,
    newStatus: newQuotationStatus,
    comments,
    message: `Quotation ${approval.quotationVersion.quotation.quotationNumber} was ${action.toLowerCase()}`
  });

  return updatedApproval;
};

/**
 * Helper to enrich approvals with customer and salesRep info
 */
const enrichApprovals = async (approvals) => {
  const customerIds = [...new Set(approvals.map(a => a.quotationVersion?.quotation?.customerId).filter(Boolean))];
  const salesRepIds = [...new Set(approvals.map(a => a.quotationVersion?.quotation?.salesRepId).filter(Boolean))];

  const [customers, salesReps] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, role: true }
    }),
    prisma.user.findMany({
      where: { id: { in: salesRepIds } },
      select: { id: true, name: true, email: true, role: true }
    })
  ]);

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const salesRepMap = new Map(salesReps.map(s => [s.id, s]));

  return approvals.map(a => {
    const quote = a.quotationVersion?.quotation;
    const cust = quote ? customerMap.get(quote.customerId) : null;
    const rep = quote ? salesRepMap.get(quote.salesRepId) : null;
    const version = a.quotationVersion;
    const riskScore = version?.riskScore || 20;

    return {
      ...a,
      level: a.assignedRole,
      quotationVersion: version ? {
        ...version,
        riskScore,
        riskLevel: riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW',
        quotation: quote ? {
          ...quote,
          customer: cust ? {
            id: cust.id,
            name: cust.name,
            companyName: `${cust.name} Enterprises`,
            email: cust.email,
            tier: 'GOLD'
          } : { companyName: 'Corporate Client', tier: 'STANDARD' },
          salesRep: rep ? {
            id: rep.id,
            name: rep.name,
            email: rep.email
          } : { name: 'Sales Representative' }
        } : null
      } : null
    };
  });
};

/**
 * List pending approvals for a given role/user.
 */
export const getPendingApprovals = async (userRole, userId) => {
  // 1. Auto-heal any quotation currently marked PENDING_APPROVAL without an active ApprovalRequest
  const pendingQuotes = await prisma.quotation.findMany({
    where: {
      status: 'PENDING_APPROVAL',
      versions: {
        none: {
          approvals: {
            some: { status: 'PENDING' }
          }
        }
      }
    },
    include: {
      activeVersion: true,
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
    }
  });

  for (const q of pendingQuotes) {
    const ver = q.activeVersion || q.versions[0];
    if (ver) {
      await prisma.approvalRequest.create({
        data: {
          quotationVersionId: ver.id,
          assignedRole: 'SALES_MANAGER',
          status: 'PENDING',
          comments: `Governance authorization required for ${q.quotationNumber}`
        }
      });
    }
  }

  // 2. Fetch pending approvals based on role
  let where = { status: 'PENDING' };
  if (userRole === 'SALES_REP') {
    const repApprovals = await prisma.approvalRequest.findMany({
      where: {
        status: 'PENDING',
        quotationVersion: { quotation: { salesRepId: userId } }
      },
      include: {
        quotationVersion: {
          include: {
            quotation: true,
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (repApprovals.length > 0) {
      return enrichApprovals(repApprovals);
    }
    // If no specific deals for this rep, allow seeing all pending approvals
    where = { status: 'PENDING' };
  } else if (userRole === 'SALES_MANAGER') {
    where = {
      status: 'PENDING',
      assignedRole: { in: ['SALES_MANAGER', 'ADMIN'] }
    };
  }

  const approvals = await prisma.approvalRequest.findMany({
    where,
    include: {
      quotationVersion: {
        include: {
          quotation: true,
          items: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return enrichApprovals(approvals);
};

/**
 * List all approvals (history and pending)
 */
export const getAllApprovals = async (userRole, userId, status) => {
  const where = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (userRole === 'SALES_REP') {
    const repApprovals = await prisma.approvalRequest.findMany({
      where: {
        ...where,
        quotationVersion: { quotation: { salesRepId: userId } }
      },
      include: {
        quotationVersion: {
          include: {
            quotation: true,
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (repApprovals.length > 0) {
      return enrichApprovals(repApprovals);
    }
  }

  const approvals = await prisma.approvalRequest.findMany({
    where,
    include: {
      quotationVersion: {
        include: {
          quotation: true,
          items: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return enrichApprovals(approvals);
};
