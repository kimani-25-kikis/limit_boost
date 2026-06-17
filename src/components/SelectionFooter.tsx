import React from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface SelectionFooterProps {
  selectedLimit: number | null;
  onGetLimit: () => void;
  onReset: () => void;
}

const limits = [
  { amount: 3000, fee: 150 },
  { amount: 5000, fee: 199 },
  { amount: 10000, fee: 249 },
  { amount: 12500, fee: 345 },
  { amount: 16000, fee: 450 },
  { amount: 21000, fee: 550 },
  { amount: 25500, fee: 649 },
  { amount: 30000, fee: 700, hot: true },
  { amount: 35000, fee: 850 },
  { amount: 40000, fee: 1000, hot: true },
  { amount: 45000, fee: 1250 },
  { amount: 50000, fee: 1500 },
];

const SelectionFooter: React.FC<SelectionFooterProps> = ({ 
  selectedLimit, 
  onGetLimit, 
  onReset 
}) => {
  const selectedLimitData = selectedLimit 
    ? limits.find(l => l.amount === selectedLimit) 
    : null;

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-white to-fuliza-light/50 rounded-2xl border-2 border-fuliza-green/20 shadow-lg">
      {selectedLimit ? (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-500 font-medium">Selected Limit</div>
              <div className="text-3xl font-bold text-fuliza-dark">
                Ksh {selectedLimit.toLocaleString()}
              </div>
            </div>
            <div className="h-12 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Processing Fee</div>
              <div className="text-2xl font-bold text-fuliza-gold">
                Ksh {selectedLimitData?.fee.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              onClick={onGetLimit}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-fuliza-green to-fuliza-dark text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold flex-1 sm:flex-none"
            >
              Get Limit Now
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-2">
          <span className="text-lg">👆</span> Please select a limit above to continue
        </div>
      )}
    </div>
  );
};

export default SelectionFooter;