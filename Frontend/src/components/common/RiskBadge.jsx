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
    LOW:      { label: 'Low Risk',      bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]', dot: 'bg-[#3F8F63]' },
    MEDIUM:   { label: 'Medium Risk',   bg: 'bg-[#FBF2E3]', text: 'text-[#C98A32]', dot: 'bg-[#C98A32]' },
    HIGH:     { label: 'High Risk',     bg: 'bg-[#FBEAEA]', text: 'text-[#C95757]', dot: 'bg-[#C95757]' },
    CRITICAL: { label: 'Critical Risk', bg: 'bg-[#FBEAEA]', text: 'text-[#C95757]', dot: 'bg-[#C95757]' }
  };

  const current = map[riskLevel.toUpperCase()] || map.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium ${current.bg} ${current.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${riskLevel.toUpperCase() === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      <span>{current.label}</span>
      {showScore && !isNaN(numScore) && (
        <span className="opacity-70 font-mono text-[10px]">({numScore})</span>
      )}
    </span>
  );
}
