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
    <div className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] border border-[#E6E1D9] flex items-center justify-center text-[#96918A] mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <Icon className="w-7 h-7 text-[#D97757]" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[#171717] mb-1.5">{title}</h3>
      <p className="text-sm text-[#6F6B66] max-w-md mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && actionTo && (
        <Link 
          to={actionTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button 
          onClick={onAction} 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97757] hover:bg-[#C96648] text-white text-sm font-semibold rounded-[10px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
