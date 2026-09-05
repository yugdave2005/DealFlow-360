import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There are no active items in this category right now.',
  actionLabel,
  actionTo,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-11 h-11 rounded-xl bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#96918A] mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#171717] mb-1">{title}</h3>
      <p className="text-xs text-[#96918A] max-w-sm mb-5 leading-relaxed">{description}</p>
      
      {actionLabel && actionTo && (
        <Link 
          to={actionTo}
          className="df-btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="df-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
