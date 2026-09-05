import React from 'react';

export default function QuotationStepper({ currentStep = 1 }) {
  const steps = [
    { id: 1, label: 'Customer' },
    { id: 2, label: 'Products' },
    { id: 3, label: 'Pricing' },
    { id: 4, label: 'Review' },
    { id: 5, label: 'Send' },
  ];

  return (
    <div className="h-12 bg-white px-5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-4 sm:gap-6 w-full justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 shrink-0">
                <span 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    isCompleted 
                      ? 'bg-slate-900 text-white'
                      : isCurrent 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.id}
                </span>
                <span 
                  className={`text-xs ${
                    isCurrent 
                      ? 'font-bold text-slate-900' 
                      : isCompleted 
                        ? 'font-medium text-slate-600' 
                        : 'font-medium text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-[1px] bg-slate-200 min-w-[16px] max-w-[80px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
