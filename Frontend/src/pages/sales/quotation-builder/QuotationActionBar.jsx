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
    <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-[#E6E1D9] rounded-[14px] p-3.5 sm:px-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Left Status */}
      <div className="flex items-center gap-2 text-[13px]">
        {isDirty ? (
          <span className="flex items-center gap-2 text-[#C98A32] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C98A32] animate-pulse" />
            <span>Unsaved changes</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[#3F8F63] font-semibold">
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Center Last saved text */}
      <div className="text-[13px] text-[#96918A] hidden md:block">
        Last saved {lastSavedText}
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending || !hasItems}
          className="h-11 px-5 text-sm font-semibold text-[#171717] bg-white hover:bg-[#FAF9F6] border border-[#E6E1D9] rounded-[10px] shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={onPreview}
          disabled={!hasItems}
          className="h-11 px-5 text-sm font-semibold text-[#171717] bg-white hover:bg-[#FAF9F6] border border-[#E6E1D9] rounded-[10px] shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
        >
          Preview
        </button>

        {approvalRequired ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="h-11 px-6 text-sm font-semibold text-white bg-[#C98A32] hover:bg-[#B37929] rounded-[10px] shadow-xs transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Submit for Approval</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="h-11 px-6 text-sm font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[10px] shadow-xs transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send to Customer</span>
          </button>
        )}
      </div>

    </div>
  );
}
