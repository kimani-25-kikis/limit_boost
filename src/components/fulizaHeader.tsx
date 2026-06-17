import React from 'react';
import { Zap } from 'lucide-react';

const FulizaHeader: React.FC = () => {
  return (
    <div className="mx-[5px] bg-gradient-to-r from-fuliza-dark to-fuliza-green p-8 rounded-2xl shadow-2xl">
      {/* Header with Icon + Title + Verification Line */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <Zap className="text-fuliza-gold w-12 h-12" />
        
        <h1 className="text-4xl font-bold text-white text-center tracking-tight">
          FULIZA LIMIT BOOST
        </h1>

        {/* New Verification Line */}
        <div className="flex items-center gap-5 text-sm text-white/90 mt-1">
          <span className="flex items-center gap-1.5">
            ✅ Verified Service
          </span>
          <span className="flex items-center gap-1.5">
            🔒 Secure Checkout
          </span>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="flex flex-wrap justify-center gap-3 mb-7">
        <span className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-medium border border-white/30">
          ⚡ Instant Limit Increase
        </span>
        <span className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-medium border border-white/30">
          📄 No Paperwork
        </span>
        <span className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-medium border border-white/30">
          🚀 Same Day Access
        </span>
      </div>

      {/* Bottom Info */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/90">
        <span>✅ Protected payments</span>
        <span>⏱️ Average processing: 2–5 mins</span>
        <span>🔐 Fast verification</span>
      </div>
    </div>
  );
};

export default FulizaHeader;