/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';           // ← Removed React import
import FulizaHeader from './components/fulizaHeader';
import HowItWorks from './components/HowItWorks';
import LimitSectionHeader from './components/LimitSectionHeader';
import LimitGrid from './components/LimitGrid';
import SelectionFooter from './components/SelectionFooter';
import PaymentModal from './components/PaymentModal';
import RecentActivity from './components/RecentActivity';

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

function App() {
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSelectLimit = (amount: number) => {
    setSelectedLimit(amount);
  };

  const handleGetLimit = () => {
    if (selectedLimit) {
      setShowPaymentModal(true);
    }
  };

  const handleReset = () => {
    setSelectedLimit(null);
  };

  const handlePay = (data: { idNumber: string; phoneNumber: string }) => {
    console.log('Payment data:', data);
    setShowPaymentModal(false);
    alert('✅ Payment initiated! Check your phone for M-Pesa STK push.');
    // You can add more logic here later (e.g., show success screen)
  };

  const selectedLimitData = selectedLimit 
    ? limits.find(l => l.amount === selectedLimit) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-base-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <FulizaHeader />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* How it works */}
          <HowItWorks />
          
          {/* Recent Activity */}
          <div className="mb-6">
            <RecentActivity />
          </div>

          {/* Divider */}
          <div className="border-t-2 border-fuliza-green/10 my-6"></div>

          {/* Limit Selection Section */}
          <LimitSectionHeader />
          
          {/* Limit Grid */}
          <LimitGrid
            limits={limits}
            selectedLimit={selectedLimit}
            onSelectLimit={handleSelectLimit}
          />

          {/* Footer */}
          <SelectionFooter
            selectedLimit={selectedLimit}
            onGetLimit={handleGetLimit}
            onReset={handleReset}
          />
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedLimitData && (
          <PaymentModal
            selectedLimit={selectedLimit!}
            fee={selectedLimitData.fee}
            onClose={() => {
              setShowPaymentModal(false);
            }}
            onPay={handlePay}
          />
        )}
      </div>
    </div>
  );
}

export default App;