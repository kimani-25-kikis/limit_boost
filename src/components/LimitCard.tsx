import React from 'react';
import { CheckCircle } from 'lucide-react';

interface LimitCardProps {
  amount: number;
  fee: number;
  isSelected: boolean;
  isHot?: boolean;
  onClick: () => void;
}

const LimitCard: React.FC<LimitCardProps> = ({ 
  amount, 
  fee, 
  isSelected, 
  isHot = false, 
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'transform scale-105' 
          : 'hover:transform hover:scale-105 hover:shadow-lg'
        }
      `}
    >
      <div className={`
        relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300
        ${isSelected 
          ? 'border-fuliza-green bg-gradient-to-br from-fuliza-light to-white shadow-xl ring-2 ring-fuliza-green/30 ring-offset-2' 
          : 'border-gray-200 bg-white hover:border-fuliza-green/50 shadow-sm'
        }
      `}>
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-fuliza-green rounded-full transform translate-x-8 -translate-y-8"></div>
        </div>

        {/* Hot badge - Left side */}
        {isHot && (
          <div className="absolute -top-1 -left-1 bg-gradient-to-r from-fuliza-gold to-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
            🔥 HOT
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          <div className="text-xl font-bold text-fuliza-dark mb-0.5">
            Ksh {amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Fee: <span className="font-semibold text-fuliza-gold">Ksh {fee.toLocaleString()}</span>
          </div>
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="mt-2 flex items-center gap-1 text-fuliza-green text-xs font-semibold">
              <CheckCircle size={14} className="fill-fuliza-green text-white" />
              <span>Selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LimitCard;