import * as approvalService from './approval.service.js';
import { sendSuccess } from '../../utils/response.js';

export const submitForApproval = async (req, res, next) => {
  try {
    const result = await approvalService.submitForApproval(req.params.quotationId, req.user.id);
    sendSuccess(res, 200, 'Quotation submitted for approval', result);
  } catch (err) {
    next(err);
  }
};

export const actionApproval = async (req, res, next) => {
  try {
    const { action, comments } = req.body;
    const result = await approvalService.actionApproval(req.params.approvalId, action, req.user.id, comments);
    sendSuccess(res, 200, `Approval ${action.toLowerCase()}`, result);
  } catch (err) {
    next(err);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await approvalService.getPendingApprovals(req.user.role);
    sendSuccess(res, 200, 'Pending approvals retrieved', approvals);
  } catch (err) {
    next(err);
  }
};
