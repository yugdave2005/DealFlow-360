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
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deal Governance</h3>
                <p className="text-[11px] text-slate-400">Risk analysis & approval routing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            
            {/* Risk Score & Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Risk Assessment
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskScore >= 70 ? 'bg-rose-100 text-rose-800' :
                  riskScore >= 45 ? 'bg-purple-100 text-purple-800' :
                  riskScore >= 20 ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {riskLevel} RISK
                </span>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Deal Risk Score:</span>
                  <span className="font-bold text-slate-900">{riskScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Policy:</span>
                  <span className={`font-bold ${isExceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isExceeded ? 'Exceeds Limit' : 'Within Limit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Approval Workflow:</span>
                  <span className="font-bold text-slate-900">
                    {approvalRequirement === 'NONE' ? 'Not Required' : approvalRequirement === 'MANAGER' ? 'Sales Manager' : 'Finance & Manager'}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Chain */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Approval Chain
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-800">Sales Manager</span>
                  </div>
                  <span className={`text-[11px] font-bold ${approvalRequirement !== 'NONE' ? 'text-purple-700' : 'text-slate-400'}`}>
                    {approvalRequirement !== 'NONE' ? 'Required' : 'Not Required'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-800">Finance & Operations</span>
                  </div>
                  <span className={`text-[11px] font-bold ${approvalRequirement === 'FINANCE_AND_MANAGER' ? 'text-purple-700' : 'text-slate-400'}`}>
                    {approvalRequirement === 'FINANCE_AND_MANAGER' ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Exceptions Table */}
            {problematicLines.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                  Pricing Exceptions Detected ({problematicLines.length})
                </span>

                <div className="space-y-2">
                  {problematicLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span className="truncate max-w-[180px]">{line.name}</span>
                        <span className="text-rose-700">+{line.exceeded}%</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Allowed: {line.allowed}%</span>
                        <span>Applied: <strong className="text-rose-700">{line.applied}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex justify-end bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
