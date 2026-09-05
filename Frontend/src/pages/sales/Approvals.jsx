import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/v1/approvals';
const getToken = () => localStorage.getItem('accessToken');

const fetchPendingApprovals = async () => {
  const res = await fetch(`${API}/pending`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch approvals');
  const data = await res.json();
  return data.data;
};

export default function Approvals() {
  const queryClient = useQueryClient();
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: fetchPendingApprovals
  });

  const actionMutation = useMutation({
    mutationFn: async ({ approvalId, action, comments }) => {
      const res = await fetch(`${API}/${approvalId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ action, comments })
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      toast.success('Approval actioned successfully');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAction = (approvalId, action) => {
    const comments = action === 'REJECTED' ? prompt('Reason for rejection:') : '';
    actionMutation.mutate({ approvalId, action, comments });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 mt-1">Review and action deal approvals assigned to your role</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-500">Loading…</div>
        ) : approvals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-slate-500 text-lg">No pending approvals at this time.</p>
          </div>
        ) : (
          approvals.map(approval => {
            const version = approval.quotationVersion;
            const quote = version?.quotation;
            return (
              <div key={approval.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{quote?.quotationNumber || 'N/A'}</h3>
                      <p className="text-sm text-slate-500">Version {version?.versionNumber} · Risk Score: <span className={`font-bold ${version?.riskScore > 60 ? 'text-red-600' : version?.riskScore > 30 ? 'text-amber-600' : 'text-green-600'}`}>{version?.riskScore}</span></p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full tracking-wider">
                      PENDING
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Total Amount</p>
                      <p className="text-lg font-bold text-slate-900">${parseFloat(version?.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Total Discount</p>
                      <p className="text-lg font-bold text-red-600">-${parseFloat(version?.totalDiscount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Line Items</p>
                      <p className="text-lg font-bold text-slate-900">{version?.items?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleAction(approval.id, 'RETURNED')}
                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                    >
                      Return for Revision
                    </button>
                    <button
                      onClick={() => handleAction(approval.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(approval.id, 'APPROVED')}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
