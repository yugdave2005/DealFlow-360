import React from 'react';
import { ArrowLeft, Save, Eye, Send, ShieldAlert, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuotationHeader({
  onSaveDraft,
  onPreview,
  onSubmit,
  isPending,
  hasItems,
  approvalRequired,
  quoteNumber = 'QT-DRAFT',
  isEditMode = false,
  status = 'DRAFT'
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EEEAE4]">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Link
            to="/sales/quotations"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6F6B66] hover:text-[#D97757] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quotations</span>
          </Link>
          <span className="text-[#E6E1D9]">&bull;</span>
          <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-[#F5F2ED] text-[#6F6B66] rounded-full border border-[#E6E1D9]">
            {status}
          </span>
          {isEditMode && (
            <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-[#FBF2E3] text-[#C98A32] rounded-full border border-[#F5E2BE]">
              Editing Revision
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#171717] tracking-tight leading-tight">
            {isEditMode ? `Edit Quotation ${quoteNumber}` : 'New Quotation'}
          </h1>
          <span className="text-[14px] text-[#6F6B66] hidden md:inline">
            {isEditMode ? 'Modify line items, quantities, and commercial discount ceilings' : 'Create a commercial quotation for your customer'}
          </span>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-mono text-[13px] font-bold text-[#96918A] mr-1 hidden sm:inline">
          #{quoteNumber}
        </span>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending || !hasItems}
          className="h-10 px-4 text-[13px] font-semibold text-[#171717] bg-white hover:bg-[#FAF9F6] border border-[#E6E1D9] rounded-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors disabled:opacity-40 cursor-pointer"
        >
          {isEditMode ? 'Save Changes' : 'Save Draft'}
        </button>

        <button
          type="button"
          onClick={onPreview}
          disabled={!hasItems}
          className="h-10 px-4 text-[13px] font-semibold text-[#171717] bg-white hover:bg-[#FAF9F6] border border-[#E6E1D9] rounded-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors disabled:opacity-40 cursor-pointer"
        >
          Preview
        </button>

        {approvalRequired ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="h-10 px-5 text-[13px] font-semibold text-white bg-[#C98A32] hover:bg-[#B37929] rounded-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Submit for Approval</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="h-10 px-5 text-[13px] font-semibold text-white bg-[#D97757] hover:bg-[#C96648] rounded-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isEditMode ? 'Update & Send' : 'Send to Customer'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
