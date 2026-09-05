import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

const API = 'http://localhost:5000/api/v1/invoices';
const getToken = () => localStorage.getItem('accessToken');

const fetchInvoices = async () => {
  const res = await fetch(API, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()).data;
};

export default function InvoicesList() {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
  const [payingId, setPayingId] = useState(null);

  const payMutation = useMutation({
    mutationFn: async ({ invoiceId, amount }) => {
      const res = await fetch(`${API}/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ amount, paymentMethod: 'BANK_TRANSFER', reference: `PAY-${Date.now()}` })
      });
      if (!res.ok) throw new Error('Payment failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setPayingId(null); toast.success('Payment recorded'); }
  });

  const statusBadge = (status) => {
    const map = { DRAFT: 'bg-slate-100 text-slate-700', SENT: 'bg-blue-100 text-blue-700', PARTIAL: 'bg-amber-100 text-amber-700', PAID: 'bg-green-100 text-green-700', OVERDUE: 'bg-red-100 text-red-700' };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-500 mt-1">Track invoices and record payments</p>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-500">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
          <p className="text-slate-500 text-lg">No invoices generated yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => {
            const paid = inv.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
            const remaining = Number(inv.totalAmount) - paid;
            return (
              <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{inv.invoiceNumber}</h3>
                    <p className="text-sm text-slate-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusBadge(inv.status)}`}>{inv.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
                    <p className="text-lg font-bold text-slate-900">${parseFloat(inv.totalAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Paid</p>
                    <p className="text-lg font-bold text-green-600">${paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Remaining</p>
                    <p className="text-lg font-bold text-red-600">${remaining.toLocaleString()}</p>
                  </div>
                </div>

                {inv.status !== 'PAID' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => payMutation.mutate({ invoiceId: inv.id, amount: remaining })}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                    >
                      Record Full Payment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
