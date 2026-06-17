import React from 'react';

interface StepsIndicatorProps {
  currentStep: 'selection' | 'payment' | 'activation';
}

const StepsIndicatorSimple: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 'selection', label: 'Selection' },
    { id: 'payment', label: 'Payment' },
    { id: 'activation', label: 'Activation' },
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === currentStep) return 'step-primary';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    return stepIndex < currentIndex ? 'step-success' : '';
  };

  return (
    <div className="w-full overflow-x-auto">
      <ul className="steps steps-horizontal min-w-[300px]">
        {steps.map((step) => (
          <li 
            key={step.id}
            className={`step ${getStepStatus(step.id)}`}
            data-content={step.id === currentStep ? '●' : ''}
          >
            {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StepsIndicatorSimple;