import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Setup</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/admin/products" className="hover:text-blue-400">Products & Pricing</Link>
          <Link to="/admin/discount-rules" className="hover:text-blue-400">Discount Rules</Link>
          <Link to="/admin/approval-rules" className="hover:text-blue-400">Approval Chains</Link>
          <Link to="/sales" className="mt-8 text-sm text-slate-400 hover:text-white">← Back to Sales</Link>
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
