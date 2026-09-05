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
    <div className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && actionTo && (
        <Link 
          to={actionTo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button 
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
