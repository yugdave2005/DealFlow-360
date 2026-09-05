import { useAuth } from '../../context/AuthContext';
import { Building, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CustomerProfile() {
  const { user } = useAuth();

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">Customer Account</h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">Enterprise organization details & commercial terms</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBE8E2] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE8E2]">
          <div>
            <h3 className="text-lg font-bold text-[#1E1B18]">{user?.name || 'Acme Corporation Ltd'}</h3>
            <p className="text-xs text-[#78716C]">{user?.email || 'contact@acme.com'}</p>
          </div>
          <span className="px-3 py-1 bg-[#F5EFEB] text-[#B85D19] border border-[#E8DFD8] text-xs font-bold rounded-full">
            ENTERPRISE TIER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] space-y-1">
            <span className="text-[#A8A29E] font-semibold uppercase text-[10px]">Authorized Contact</span>
            <p className="text-[#1E1B18] font-bold text-sm">{user?.name || 'Primary Representative'}</p>
            <p className="text-[#78716C]">{user?.email}</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EBE8E2] space-y-1">
            <span className="text-[#A8A29E] font-semibold uppercase text-[10px]">Registered Address</span>
            <p className="text-[#1E1B18] font-bold text-sm">Infocity Tech Park</p>
            <p className="text-[#78716C]">Gandhinagar, Gujarat - 382007</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs flex items-center gap-3">
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
