import React from 'react';
import LimitCard from './LimitCard';

interface Limit {
  amount: number;
  fee: number;
  hot?: boolean;
}

interface LimitGridProps {
  limits: Limit[];
  selectedLimit: number | null;
  onSelectLimit: (amount: number) => void;
}

const LimitGrid: React.FC<LimitGridProps> = ({ limits, selectedLimit, onSelectLimit }) => {
  return (
    <div className="bg-gradient-to-br from-white to-fuliza-light/30 rounded-2xl p-6 border-2 border-fuliza-green/10 shadow-inner">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {limits.map((limit) => (
          <LimitCard
            key={limit.amount}
            amount={limit.amount}
            fee={limit.fee}
            isHot={limit.hot}
            isSelected={selectedLimit === limit.amount}
            onClick={() => onSelectLimit(limit.amount)}
          />
        ))}
      </div>
    </div>
  );
};

export default LimitGrid;