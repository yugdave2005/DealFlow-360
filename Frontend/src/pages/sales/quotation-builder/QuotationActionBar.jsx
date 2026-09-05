import React from 'react';
import { Send, ShieldAlert, Check } from 'lucide-react';

export default function QuotationActionBar({
  onSaveDraft,
  onPreview,
  onSubmit,
  isPending,
  hasItems,
  approvalRequired,
  isDirty = false,
  lastSavedText = 'Just now'
}) {
  return (
    <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 sm:px-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
      
      {/* Left Status */}
      <div className="flex items-center gap-2 text-xs">
        {isDirty ? (
          <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Unsaved changes</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Center Last saved text */}
      <div className="text-xs text-slate-400 hidden md:block">
        Last saved {lastSavedText}
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending || !hasItems}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-40"
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={onPreview}
          disabled={!hasItems}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-40"
        >
          Preview
        </button>

        {approvalRequired ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Submit for Approval</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Customer</span>
          </button>
        )}
      </div>

    </div>
  );
}
