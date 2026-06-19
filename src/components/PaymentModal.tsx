import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  selectedLimit: number;
  fee: number;
  onClose: () => void;
  onPay: (data: { idNumber: string; phoneNumber: string }) => void;
}

interface PaymentState {
  loading: boolean;
  error: string | null;
  success: boolean;
  transactionRef: string | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  selectedLimit, 
  fee, 
  onClose, 
  onPay 
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentState>({
    loading: false,
    error: null,
    success: false,
    transactionRef: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPaymentState({ loading: true, error: null, success: false, transactionRef: null });

    try {
      // 1. First, call your backend to initiate payment
      const response = await fetch('http://localhost:5000/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idNumber,
          phoneNumber,
          amount: fee,
          limit: selectedLimit
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentState({
          loading: false,
          error: null,
          success: true,
          transactionRef: data.reference || null
        });

        // 2. Notify parent component
        onPay({ idNumber, phoneNumber });

        // 3. Start polling for transaction status
        if (data.reference) {
          pollTransactionStatus(data.reference);
        }

        // 4. Close modal after 5 seconds
        setTimeout(() => {
          onClose();
        }, 5000);
      } else {
        setPaymentState({
          loading: false,
          error: data.message || 'Payment initiation failed',
          success: false,
          transactionRef: null
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState({
        loading: false,
        error: 'Failed to initiate payment. Please try again.',
        success: false,
        transactionRef: null
      });
    }
  };

  // Poll transaction status
  const pollTransactionStatus = (reference: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2 seconds = 60 seconds
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`http://localhost:5000/api/transaction-status/${reference}`);
        const data = await response.json();
        
        if (data.success && data.status === 'success') {
          clearInterval(interval);
          setPaymentState(prev => ({
            ...prev,
            success: true,
            loading: false,
            error: null
          }));
          // You can add success notification here
        } else if (data.success && data.status === 'failed') {
          clearInterval(interval);
          setPaymentState(prev => ({
            ...prev,
            loading: false,
            error: 'Payment failed. Please try again.',
            success: false
          }));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPaymentState(prev => ({
          ...prev,
          loading: false,
          error: 'Payment taking too long. Please check your M-Pesa messages.',
        }));
      }
    }, 2000); // Check every 2 seconds
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-fuliza-dark">Complete Your Request</h2>
              <p className="text-gray-600 text-sm">Fill in your details and confirm the processing fee to continue.</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={paymentState.loading}>
              <X size={24} />
            </button>
          </div>

          <div className="bg-fuliza-light p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">New Limit:</div>
                <div className="text-xl font-bold text-fuliza-dark">
                  Ksh {selectedLimit.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Processing Fee:</div>
                <div className="text-xl font-bold text-fuliza-gold">
                  Ksh {fee.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {paymentState.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{paymentState.error}</p>
            </div>
          )}

          {paymentState.success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm font-semibold">✓ STK Push Sent Successfully!</p>
              <p className="text-xs mt-1">Please check your phone and enter your M-Pesa PIN to complete payment.</p>
              {paymentState.transactionRef && (
                <p className="text-xs mt-1">Reference: {paymentState.transactionRef}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-fuliza-green focus:outline-none"
                required
                disabled={paymentState.loading || paymentState.success}
              />
              <p className="text-xs text-gray-500 mt-1">Used for verification only.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-fuliza-green focus:outline-none"
                required
                disabled={paymentState.loading || paymentState.success}
              />
              <p className="text-xs text-gray-500 mt-1">
                An STK push will be sent to this number.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-2">💡 Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure your phone has enough balance for the processing fee.</li>
                <li>Keep your phone nearby to enter your M-Pesa PIN promptly.</li>
                <li>You'll receive an STK push within 30 seconds.</li>
              </ul>
            </div>

            <button
              type="submit"
              className={`w-full text-white py-3 rounded-lg font-semibold transition-colors ${
                paymentState.loading || paymentState.success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-fuliza-green hover:bg-fuliza-dark'
              }`}
              disabled={paymentState.loading || paymentState.success}
            >
              {paymentState.loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initiating Payment...
                </span>
              ) : paymentState.success ? (
                '✓ Payment Initiated'
              ) : (
                'PAY THE PROCESSING FEE'
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              By proceeding, you confirm the details provided are correct.
              <br />
              Processing fees are non-refundable once payment is initiated.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;