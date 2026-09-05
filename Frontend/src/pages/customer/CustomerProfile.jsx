import { useAuth } from '../../context/AuthContext';
import { Building, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CustomerProfile() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Account</h1>
            <p className="text-sm text-slate-500 mt-0.5">Enterprise organization details & commercial terms</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name || 'Acme Corporation Ltd'}</h3>
            <p className="text-xs text-slate-500">{user?.email || 'contact@acme.com'}</p>
          </div>
          <span className="px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold rounded-full">
            ENTERPRISE TIER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Authorized Contact</span>
            <p className="text-slate-900 font-bold text-sm">{user?.name || 'Primary Representative'}</p>
            <p className="text-slate-500">{user?.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Registered Address</span>
            <p className="text-slate-900 font-bold text-sm">Infocity Tech Park</p>
            <p className="text-slate-500">Gandhinagar, Gujarat - 382007</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-emerald-900">Commercial Credit Status: Active</span>
            <p className="text-emerald-800 mt-0.5">Net 30 Days invoicing payment terms configured.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
