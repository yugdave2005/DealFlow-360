import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || 'DRAFT').toUpperCase();
  
  const map = {
    DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    SENT: { label: 'Sent', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    NEGOTIATION: { label: 'Under Negotiation', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    UNDER_NEGOTIATION: { label: 'Under Negotiation', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING_APPROVAL: { label: 'Pending Approval', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    PENDING: { label: 'Pending', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    RETURNED: { label: 'Returned for Revision', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    CONFIRMED: { label: 'Confirmed', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    FULFILLMENT: { label: 'Fulfillment', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-500 border-slate-200' },
    PAID: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIAL: { label: 'Partial', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    OVERDUE: { label: 'Overdue', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    ACTIVE: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PAUSED: { label: 'Paused', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const current = map[normalized] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${current.bg} ${className}`}>
      {current.label}
    </span>
  );
}
