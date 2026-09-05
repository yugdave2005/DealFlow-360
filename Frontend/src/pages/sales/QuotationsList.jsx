import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const fetchQuotations = async () => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('http://localhost:5000/api/v1/quotations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch quotations');
  const result = await res.json();
  return result.data;
};

export default function QuotationsList() {
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: fetchQuotations
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-t-2xl shadow-sm border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 mt-1">Manage active deals and negotiations</p>
        </div>
        <Link to="/sales/quotations/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          New Quotation
        </Link>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Quote Number</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Customer ID</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Total ($)</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-500 font-medium">Loading quotations...</td></tr>
              ) : quotations.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-500">No active quotations found. Start by creating one!</td></tr>
              ) : (
                quotations.map(quote => {
                  const activeVersion = quote.versions.find(v => v.id === quote.activeVersionId) || quote.versions[0];
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">
                         <Link to={`/sales/quotations/${quote.id}`} className="text-blue-600 hover:underline">{quote.quotationNumber}</Link>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{quote.customerId.slice(-6)}...</td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                         ${parseFloat(activeVersion?.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                          quote.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                          quote.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                          quote.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-sm">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
