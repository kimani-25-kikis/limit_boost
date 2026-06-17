import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <div className="bg-fuliza-light rounded-xl p-6 border-2 border-fuliza-green/20 mb-6">
      <h3 className="text-xl font-bold text-fuliza-dark mb-4 flex items-center gap-2">
        <span className="text-2xl">📋</span> How it works
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-fuliza-green text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <span className="font-medium text-fuliza-dark">Select your preferred limit.</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-fuliza-green text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <span className="font-medium text-fuliza-dark">Click </span>
            <span className="font-bold text-fuliza-green">Get Limit Now</span>
            <span className="font-medium text-fuliza-dark"> and confirm your details.</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-fuliza-green text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <div>
            <span className="font-medium text-fuliza-dark">Pay the processing fee via </span>
            <span className="font-bold text-fuliza-gold">M-Pesa STK push.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;