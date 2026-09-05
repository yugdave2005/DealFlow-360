import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const fetchDashboardMetrics = async () => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('http://localhost:5000/api/v1/dashboard/sales', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  const data = await res.json();
  return data.data;
};

export default function Dashboard() {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['salesDashboardMetrics'],
    queryFn: fetchDashboardMetrics
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your active workspace</p>
        </div>
        <Link to="/sales/quotations/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          + New Quotation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Active Quotations" 
          val={isLoading ? '...' : (metrics?.activeQuotations || 0)} 
          desc="In Draft, Negotiation, or Sent"
          color="blue"
        />
        <MetricCard 
          title="Pending Approvals" 
          val={isLoading ? '...' : (metrics?.pendingApprovals || 0)} 
          desc="Awaiting management review"
          color="amber" 
        />
        <MetricCard 
          title="At-Risk Deals" 
          val={isLoading ? '...' : (metrics?.atRiskDeals || 0)} 
          desc="Risk score > 50 thresholds"
          color="red"
        />
      </div>
      
      {/* Skeleton / Layout visual for real time updates pane */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-96">
         <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Recent Activity</h2>
         <div className="flex-1 flex items-center justify-center text-slate-400 flex-col">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p>No recent activity yet. Action stream will populate here.</p>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, val, desc, color }) {
  const colorMap = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50',
    amber: 'border-amber-500 text-amber-600 bg-amber-50',
    red: 'border-red-500 text-red-600 bg-red-50'
  };

  return (
    <div className={`p-6 rounded-2xl shadow-sm border-l-4 bg-white ${colorMap[color].split(' ')[0]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-2">{val}</h2>
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color].split(' ').slice(1).join(' ')}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        </div>
      </div>
      <p className="text-slate-500 text-sm mt-4">{desc}</p>
    </div>
  );
}
