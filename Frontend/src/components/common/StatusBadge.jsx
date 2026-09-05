import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || 'DRAFT').toUpperCase();
  
  const map = {
    DRAFT:            { label: 'Draft',                 bg: 'bg-[#F5F2ED]', text: 'text-[#6F6B66]' },
    SENT:             { label: 'Sent',                  bg: 'bg-[#EBF1F7]', text: 'text-[#5D83A8]' },
    NEGOTIATION:      { label: 'Under Negotiation',     bg: 'bg-[#F8E9E3]', text: 'text-[#C96648]' },
    UNDER_NEGOTIATION:{ label: 'Under Negotiation',     bg: 'bg-[#F8E9E3]', text: 'text-[#C96648]' },
    PENDING_APPROVAL: { label: 'Pending Approval',      bg: 'bg-[#FBF2E3]', text: 'text-[#C98A32]' },
    PENDING:          { label: 'Pending',               bg: 'bg-[#FBF2E3]', text: 'text-[#C98A32]' },
    APPROVED:         { label: 'Approved',              bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    REJECTED:         { label: 'Rejected',              bg: 'bg-[#FBEAEA]', text: 'text-[#C95757]' },
    RETURNED:         { label: 'Returned for Revision', bg: 'bg-[#F8E9E3]', text: 'text-[#C96648]' },
    CONFIRMED:        { label: 'Confirmed',             bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    FULFILLMENT:      { label: 'Fulfillment',           bg: 'bg-[#EBF1F7]', text: 'text-[#5D83A8]' },
    COMPLETED:        { label: 'Completed',             bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    CANCELLED:        { label: 'Cancelled',             bg: 'bg-[#F5F2ED]', text: 'text-[#96918A]' },
    PAID:             { label: 'Paid',                  bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    PARTIAL:          { label: 'Partial',               bg: 'bg-[#FBF2E3]', text: 'text-[#C98A32]' },
    OVERDUE:          { label: 'Overdue',               bg: 'bg-[#FBEAEA]', text: 'text-[#C95757]' },
    ACTIVE:           { label: 'Active',                bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    PAUSED:           { label: 'Paused',                bg: 'bg-[#FBF2E3]', text: 'text-[#C98A32]' },
    PROCESSING:       { label: 'Processing',            bg: 'bg-[#EBF1F7]', text: 'text-[#5D83A8]' },
    FULFILLED:        { label: 'Fulfilled',             bg: 'bg-[#EAF5EE]', text: 'text-[#3F8F63]' },
    SHIPPED:          { label: 'Shipped',               bg: 'bg-[#EBF1F7]', text: 'text-[#5D83A8]' },
  };

  const current = map[normalized] || { label: status, bg: 'bg-[#F5F2ED]', text: 'text-[#6F6B66]' };

  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-medium ${current.bg} ${current.text} ${className}`}>
      {current.label}
    </span>
  );
}
