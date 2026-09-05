import React from 'react';

export default function RiskBadge({ score, level, showScore = true, className = '' }) {
  let riskLevel = level;
  const numScore = typeof score === 'number' ? score : parseInt(score, 10);

  if (!riskLevel) {
    if (!isNaN(numScore)) {
      if (numScore >= 70) riskLevel = 'CRITICAL';
      else if (numScore >= 45) riskLevel = 'HIGH';
      else if (numScore >= 20) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';
    } else {
      riskLevel = 'LOW';
    }
  }

  const map = {
    LOW: { label: 'Low Risk', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    HIGH: { label: 'High Risk', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    CRITICAL: { label: 'Critical Risk', bg: 'bg-red-100 text-red-800 border-red-300 font-bold' }
  };

  const current = map[riskLevel.toUpperCase()] || map.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${current.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        riskLevel.toUpperCase() === 'CRITICAL' ? 'bg-red-600 animate-pulse' :
        riskLevel.toUpperCase() === 'HIGH' ? 'bg-rose-600' :
        riskLevel.toUpperCase() === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />
      <span>{current.label}</span>
      {showScore && !isNaN(numScore) && (
        <span className="opacity-75 font-mono text-[10px]">({numScore})</span>
      )}
    </span>
  );
}
