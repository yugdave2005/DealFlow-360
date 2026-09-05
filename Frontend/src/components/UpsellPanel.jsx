import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/v1/upsell';
const getToken = () => localStorage.getItem('accessToken');

const fetchSuggestions = async (lineItems) => {
  if (!lineItems || lineItems.length === 0) return [];
  const res = await fetch(`${API}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ lineItems })
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
};

export default function UpsellPanel({ lineItems, onAddProduct }) {
  const productIds = lineItems?.map(i => i.productId).filter(Boolean).join(',');

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['upsell', productIds],
    queryFn: () => fetchSuggestions(lineItems),
    enabled: !!productIds
  });

  if (!productIds || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mt-6">
      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        Suggested Add-ons
      </h3>

      {isLoading ? (
        <p className="text-sm text-blue-600">Loading suggestions…</p>
      ) : (
        <div className="space-y-2">
          {suggestions.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-blue-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${s.type === 'CROSS_SELL' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                    {s.type === 'CROSS_SELL' ? 'Cross-sell' : 'Upsell'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.reason}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-sm font-bold text-slate-900">${s.price.toLocaleString()}</p>
                <p className="text-xs text-green-600">+${s.marginDelta.toFixed(0)} margin</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddProduct({ productId: s.id, productName: s.name, quantity: 1, unitPrice: s.price, discountPercentage: 0 });
                  toast.success(`Added ${s.name}`);
                }}
                className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
