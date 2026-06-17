import React from 'react';
import { Sparkles } from 'lucide-react';

const LimitSectionHeader: React.FC = () => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-gradient-to-r from-fuliza-green to-fuliza-dark p-2 rounded-xl">
        <Sparkles className="text-white w-6 h-6" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-fuliza-dark">
          Select Your Fuliza Limit
        </h2>
        <p className="text-sm text-gray-500">Choose a limit that suits your needs</p>
      </div>
    </div>
  );
};

export default LimitSectionHeader;