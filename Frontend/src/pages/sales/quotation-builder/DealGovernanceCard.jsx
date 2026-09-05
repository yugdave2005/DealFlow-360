import React from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import RiskBadge from '../../../components/common/RiskBadge';

export default function DealGovernanceCard({ calculations }) {
  const {
    riskScore = 0,
    riskLevel = 'LOW',
    problematicLines = [],
    approvalRequirement = 'NONE'
  } = calculations || {};

  const isExceeded = problematicLines.length > 0 || approvalRequirement !== 'NONE';

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EBE8E2] pb-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#B85D19]" />
          <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Deal Governance
          </h3>
        </div>
        <RiskBadge score={riskScore} level={riskLevel} />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-[#FAF8F5] border border-[#EBE8E2] rounded-xl">
          <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider block">Risk Score</span>
          <span className="text-xs font-extrabold text-[#1E1B18]">{riskScore} / 100</span>
        </div>

        <div className={`p-2.5 rounded-xl border ${
          isExceeded 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Discount Status</span>
          <span className="text-xs font-bold">{isExceeded ? 'Exceeds Limit' : 'Within Limit'}</span>
        </div>
      </div>

      {/* Approval Routing Notice */}
      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE8E2] text-xs space-y-1">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-[#78716C]">Approval Workflow:</span>
          <span className={`font-bold ${approvalRequirement === 'NONE' ? 'text-emerald-700' : 'text-purple-700'}`}>
            {approvalRequirement === 'NONE' 
              ? 'Not Required' 
              : approvalRequirement === 'MANAGER' 
                ? 'Sales Manager' 
                : 'Finance & Manager'}
          </span>
        </div>
        <p className="text-[10px] text-[#A8A29E]">
          {approvalRequirement === 'NONE'
            ? 'Quote is within policy. Rep can send directly.'
            : 'Requires managerial authorization before sending.'}
        </p>
      </div>

      {/* Exceptions List */}
      {problematicLines.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            {problematicLines.length} Pricing Exception{problematicLines.length > 1 ? 's' : ''} Detected
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
            {problematicLines.map((line, idx) => (
              <div key={idx} className="p-2 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-0.5">
                <div className="flex justify-between font-bold text-[#1E1B18]">
                  <span className="truncate max-w-[180px]">{line.name}</span>
                  <span className="text-rose-700 font-extrabold">+{line.exceeded}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#78716C]">
                  <span>Allowed: {line.allowed}%</span>
                  <span>Applied: <strong className="text-rose-700">{line.applied}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
