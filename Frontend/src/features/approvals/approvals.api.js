import { api } from '../../lib/axios';

export const approvalsApi = {
  // Existing queue API
  getPendingApprovals: () => api.get('/approvals/pending'),
  getAllApprovals: () => api.get('/approvals'),
  submitAction: (approvalId, data) => api.post(`/approvals/${approvalId}/action`, data),

  // Rules API (still managed via admin module backend context)
  getApprovalRules: () => api.get('/admin/approval-rules'),
  createApprovalRule: (data) => api.post('/admin/approval-rules', data),
  deleteApprovalRule: (id) => api.delete(`/admin/approval-rules/${id}`),
};
