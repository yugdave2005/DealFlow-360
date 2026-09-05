import React from 'react';
import { X, ShieldAlert, ShieldCheck, AlertCircle, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function GovernanceDrawer({
  isOpen,
  onClose,
  calculations
}) {
  if (!isOpen) return null;

  const {
    riskScore = 0,
    riskLevel = 'LOW',
    problematicLines = [],
    approvalRequirement = 'NONE'
  } = calculations || {};

  const isExceeded = problematicLines.length > 0 || approvalRequirement !== 'NONE';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div 
        className="absolute inset-0 bg-[#171717]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E6E1D9] flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E6E1D9] flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#FBF2E3] border border-[#F5E2BE] flex items-center justify-center text-[#C98A32]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717]">Deal Governance</h3>
                <p className="text-[12px] text-[#96918A]">Risk analysis & approval routing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#96918A] hover:text-[#171717] rounded-lg hover:bg-[#EDE8E0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[14px]">
            
            {/* Risk Score & Status */}
            <div className="p-4 bg-[#FAF9F6] rounded-[12px] border border-[#EEEAE4] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A]">
                  Risk Assessment
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  riskScore >= 70 ? 'bg-[#FBEAEA] text-[#C95757] border-[#F5C7C7]' :
                  riskScore >= 45 ? 'bg-[#FBF2E3] text-[#C98A32] border-[#F5E2BE]' :
                  'bg-[#EAF5EE] text-[#3F8F63] border-[#BDE3CE]'
                }`}>
                  {riskLevel} RISK
                </span>
              </div>

              <div className="space-y-2 text-[#6F6B66]">
                <div className="flex justify-between">
                  <span>Deal Risk Score:</span>
                  <span className="font-bold text-[#171717]">{riskScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Policy:</span>
                  <span className={`font-semibold ${isExceeded ? 'text-[#C95757]' : 'text-[#3F8F63]'}`}>
                    {isExceeded ? 'Exceeds Limit' : 'Within Limit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Approval Workflow:</span>
                  <span className="font-semibold text-[#171717]">
                    {approvalRequirement === 'NONE' ? 'Not Required' : approvalRequirement === 'MANAGER' ? 'Sales Manager' : 'Finance & Manager'}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Chain */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#96918A] block">
                Approval Chain
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-[10px] border border-[#E6E1D9] bg-white">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#96918A]" />
                    <span className="font-semibold text-[#171717]">Sales Manager</span>
                  </div>
                  <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    approvalRequirement !== 'NONE' 
                      ? 'bg-[#FBF2E3] text-[#C98A32] border-[#F5E2BE]' 
                      : 'bg-[#F5F2ED] text-[#96918A] border-[#E6E1D9]'
                  }`}>
                    {approvalRequirement !== 'NONE' ? 'Required' : 'Not Required'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] border border-[#E6E1D9] bg-white">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#96918A]" />
                    <span className="font-semibold text-[#171717]">Finance & Operations</span>
                  </div>
                  <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    approvalRequirement === 'FINANCE_AND_MANAGER' 
                      ? 'bg-[#FBF2E3] text-[#C98A32] border-[#F5E2BE]' 
                      : 'bg-[#F5F2ED] text-[#96918A] border-[#E6E1D9]'
                  }`}>
                    {approvalRequirement === 'FINANCE_AND_MANAGER' ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Exceptions Table */}
            {problematicLines.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C95757] block">
                  Pricing Exceptions Detected ({problematicLines.length})
                </span>

                <div className="space-y-2">
                  {problematicLines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-[#FBEAEA] border border-[#F5C7C7] rounded-[10px] text-[13px] space-y-1">
                      <div className="flex justify-between font-bold text-[#171717]">
                        <span className="truncate max-w-[200px]">{line.name}</span>
                        <span className="text-[#C95757]">+{line.exceeded}%</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-[#6F6B66]">
                        <span>Allowed: {line.allowed}%</span>
                        <span>Applied: <strong className="text-[#C95757]">{line.applied}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E6E1D9] flex justify-end bg-[#FAF9F6]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 text-[13px] font-semibold text-[#6F6B66] hover:text-[#171717] bg-white hover:bg-[#F5F2ED] border border-[#E6E1D9] rounded-[9px] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
