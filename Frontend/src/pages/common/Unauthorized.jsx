import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_METADATA } from '../../lib/roles';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, role, defaultRoute } = useAuth();
  const roleInfo = ROLE_METADATA[role] || { label: role };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#FFFFFF] p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#EBE8E2] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">403 Forbidden</span>
          <h1 className="text-2xl font-extrabold text-[#1E1B18] tracking-tight">Access Denied</h1>
          <p className="text-sm text-[#78716C]">
            Your current role (<strong className="text-[#1E1B18]">{roleInfo.label}</strong>) does not have authorization to access this workspace or administrative resource.
          </p>
        </div>

        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] text-xs text-[#78716C] text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="font-semibold text-[#A8A29E] uppercase text-[10px]">Signed In As:</span>
            <span className="font-bold text-[#1E1B18]">{user?.name || user?.email || 'User'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-[#A8A29E] uppercase text-[10px]">Assigned Role:</span>
            <span className="font-bold text-[#B85D19]">{roleInfo.label}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5EFEB] hover:bg-[#E8DFD8] text-[#1E1B18] text-xs font-bold rounded-xl border border-[#E8DFD8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate(defaultRoute)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B85D19] hover:bg-[#9E4E13] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>My Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
