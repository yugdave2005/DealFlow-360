import React from 'react';
import { ArrowLeft, Save, Eye, Send, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuotationHeader({
  onSaveDraft,
  onPreview,
  onSubmit,
  isPending,
  hasItems,
  approvalRequired,
  quoteNumber = 'QT-DRAFT'
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            to="/sales/quotations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quotations</span>
          </Link>
          <span className="text-slate-300">&bull;</span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded border border-slate-200">
            DRAFT
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">New Quotation</h1>
          <span className="text-xs text-slate-500 hidden md:inline">
            Create a commercial quotation for your customer
          </span>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-mono text-xs font-bold text-slate-400 mr-1 hidden sm:inline">
          #{quoteNumber}
        </span>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending || !hasItems}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-40"
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={onPreview}
          disabled={!hasItems}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-40"
        >
          Preview
        </button>

        {approvalRequired ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Submit for Approval</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !hasItems}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Customer</span>
          </button>
        )}
      </div>
    </div>
  );
}
