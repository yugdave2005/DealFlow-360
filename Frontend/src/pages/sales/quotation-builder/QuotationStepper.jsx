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
    <div className="h-12 bg-white px-5 rounded-[12px] border border-[#E6E1D9] shadow-xs flex items-center justify-between overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-4 sm:gap-6 w-full justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2.5 shrink-0">
                <span 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                    isCompleted 
                      ? 'bg-[#171717] text-white'
                      : isCurrent 
                        ? 'bg-[#D97757] text-white shadow-xs' 
                        : 'bg-[#F5F2ED] text-[#96918A]'
                  }`}
                >
                  {step.id}
                </span>
                <span 
                  className={`text-[13px] ${
                    isCurrent 
                      ? 'font-bold text-[#171717]' 
                      : isCompleted 
                        ? 'font-medium text-[#6F6B66]' 
                        : 'font-medium text-[#96918A]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-[1px] bg-[#EEEAE4] min-w-[16px] max-w-[80px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
