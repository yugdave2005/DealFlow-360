import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_METADATA } from '../../lib/roles';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, role, defaultRoute } = useAuth();
  const roleInfo = ROLE_METADATA[role] || { label: role };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">403 Forbidden</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-500">
            Your current role (<strong className="text-slate-800">{roleInfo.label}</strong>) does not have authorization to access this workspace or administrative resource.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 uppercase">Signed In As:</span>
            <span className="font-bold text-slate-800">{user?.name || user?.email || 'User'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400 uppercase">Assigned Role:</span>
            <span className="font-bold text-indigo-700">{roleInfo.label}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate(defaultRoute)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>My Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
