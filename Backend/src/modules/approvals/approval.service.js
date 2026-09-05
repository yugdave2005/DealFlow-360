import { PrismaClient } from '@prisma/client';
import { calculateRiskScore, getRiskLevel } from '../risk/risk.engine.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const prisma = new PrismaClient();

/**
 * Submit a DRAFT quotation for approval.
 * 1. Calculate risk score
 * 2. Match against ApprovalRules to determine required approver
 * 3. Create ApprovalRequest
 * 4. Update quotation status to PENDING_APPROVAL
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

  // Update quotation status based on action
  const newQuotationStatus = action === 'APPROVED' ? 'CONFIRMED' :
    action === 'REJECTED' ? 'REJECTED' : 'NEGOTIATION';

  await prisma.quotation.update({
    where: { id: approval.quotationVersion.quotation.id },
    data: { status: newQuotationStatus }
  });

  return updatedApproval;
};

/**
 * List pending approvals for a given role.
 */
export const getPendingApprovals = async (userRole) => {
  return prisma.approvalRequest.findMany({
    where: {
      status: 'PENDING',
      assignedRole: userRole
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
};
