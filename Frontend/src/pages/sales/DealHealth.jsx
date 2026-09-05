import { useQuery } from '@tanstack/react-query';

const API = 'http://localhost:5000/api/v1/deal-health';
const getToken = () => localStorage.getItem('accessToken');

const fetchHealth = async () => {
  const res = await fetch(API, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()).data;
};

export default function DealHealth() {
  const { data, isLoading } = useQuery({ queryKey: ['dealHealth'], queryFn: fetchHealth });

  if (isLoading) return <div className="p-6"><div className="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-500">Loading…</div></div>;

  const { stalledDeals = [], discountAnomalies = [], deliverySlippage = [], summary = {} } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Health & Anomalies</h1>
        <p className="text-slate-500 mt-1">Monitor stalled deals, discount risks, and delivery issues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-amber-700">{summary.stalledCount || 0}</p>
          <p className="text-sm font-medium text-amber-600 mt-1">Stalled Deals</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-red-700">{summary.anomalyCount || 0}</p>
          <p className="text-sm font-medium text-red-600 mt-1">Discount Anomalies</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-700">{summary.slippageCount || 0}</p>
          <p className="text-sm font-medium text-blue-600 mt-1">Delivery Slippage</p>
        </div>
      </div>

      {/* Stalled Deals */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <h2 className="font-bold text-slate-800 mb-3">Stalled Deals (inactive {'>'}7 days)</h2>
        {stalledDeals.length === 0 ? <p className="text-slate-500 text-sm">None detected</p> : (
          <div className="space-y-2">
            {stalledDeals.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-amber-50 rounded-xl p-3">
                <div>
                  <span className="font-semibold text-slate-800">{d.quotationNumber}</span>
                  <span className="text-xs text-slate-500 ml-2">{d.status}</span>
                </div>
                <span className="text-amber-700 font-bold text-sm">{d.daysSinceUpdate} days inactive</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discount Anomalies */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <h2 className="font-bold text-slate-800 mb-3">High-Risk Discount Anomalies (score {'>'} 60)</h2>
        {discountAnomalies.length === 0 ? <p className="text-slate-500 text-sm">None detected</p> : (
          <div className="space-y-2">
            {discountAnomalies.map((a, i) => (
              <div key={i} className="flex justify-between items-center bg-red-50 rounded-xl p-3">
                <div>
                  <span className="font-semibold text-slate-800">{a.quotationNumber}</span>
                  <span className="text-xs text-slate-500 ml-2">v{a.versionNumber} by {a.createdBy}</span>
                </div>
                <span className="text-red-700 font-bold text-sm">Risk: {a.riskScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Slippage */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-3">Delivery Slippage</h2>
        {deliverySlippage.length === 0 ? <p className="text-slate-500 text-sm">All shipments on track</p> : (
          <div className="space-y-2">
            {deliverySlippage.map((s, i) => (
              <div key={i} className="flex justify-between items-center bg-blue-50 rounded-xl p-3">
                <div>
                  <span className="font-semibold text-slate-800">{s.orderId}</span>
                  <span className="text-xs text-slate-500 ml-2">{s.warehouse}</span>
                </div>
                <span className="text-blue-700 font-bold text-sm">{s.daysOverdue} days overdue</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
