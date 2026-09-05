import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../../utils/response.js';

const prisma = new PrismaClient();

export const getSalesDashboard = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Compute aggregations using true Postgres queries
    let quotationsQuery = { status: { in: ['DRAFT', 'NEGOTIATION', 'SENT', 'PENDING_APPROVAL'] } };
    
    // For standard sales reps, restrict vision to their own deals
    if (userRole === 'SALES_REP') {
      quotationsQuery.salesRepId = userId;
    }

    const activeQuotations = await prisma.quotation.count({ where: quotationsQuery });
    
    // Find pending approvals (e.g. status PENDING in ApprovalRequest)
    // Could optionally filter by role if the request target is this current user's role
    const pendingApprovals = await prisma.approvalRequest.count({
      where: {
        status: 'PENDING',
        ...(userRole !== 'ADMIN' && { assignedRole: userRole })
      }
    });

    // Find at risk deals: e.g. QuotationVersions with risk > 50 
    // Wait, risk logic is not completely finalized physically in DB counts, but we can query by riskScore
    const atRiskDeals = await prisma.quotationVersion.count({
      where: {
        riskScore: { gt: 50 },
        quotation: quotationsQuery
      }
    });

    sendSuccess(res, 200, 'Sales dashboard metrics', {
      activeQuotations,
      pendingApprovals,
      atRiskDeals
    });
  } catch (err) {
    next(err);
  }
};
