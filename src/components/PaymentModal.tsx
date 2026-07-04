import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Phone, Shield, User, Smartphone } from 'lucide-react';

interface PaymentModalProps {
  selectedLimit: number;
  fee: number;
  onClose: () => void;
  onPay: (data: { idNumber: string; phoneNumber: string }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5001/api';

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  selectedLimit, 
  fee, 
  onClose, 
  onPay 
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    return cleaned;
  };

  const resetPayment = () => {
    setLoading(false);
    setStkSent(false);
    setError(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Safaricom phone number (e.g., 0712345678)');
      return;
    }

    setLoading(true);
    setStkSent(false);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${API_BASE_URL}/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idNumber: idNumber.trim(),
          phoneNumber: formattedPhone,
          amount: fee,
          limit: selectedLimit
        }),
      });

      const data = await response.json();

      // ✅ Check for success
      if (data.success) {
        console.log('✅ STK Push sent successfully:', data);
        setLoading(false);
        setStkSent(true);
        setError(null);
        onPay({ idNumber, phoneNumber: formattedPhone });

        // Show success for 3 seconds then close
        setTimeout(() => {
          resetPayment();
          onClose();
        }, 3000);

        if (data.checkoutRequestId) {
          startPolling(data.checkoutRequestId);
        }
      } else {
        // ❌ Failed to send STK
        console.log('❌ STK Push failed:', data);
        setLoading(false);
        setError(data.message || data.responseDescription || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      setError('Failed to connect. Please try again.');
    }
  };

  const startPolling = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 40;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${API_BASE_URL}/transaction-status/${checkoutRequestId}`);
        const data = await response.json();

        if (data.success) {
          if (data.status === 'success') {
            console.log('✅ Payment successful!');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (data.status === 'failed') {
            console.log('❌ Payment failed');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
        
        if (attempts >= maxAttempts) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Request</h2>
              <p className="text-gray-600 text-sm mt-1">Pay the processing fee via M-Pesa to upgrade your limit.</p>
            </div>
            <button 
              onClick={() => {
                if (!loading && !stkSent) {
                  resetPayment();
                  onClose();
                }
              }} 
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors" 
              disabled={loading || stkSent}
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">New Limit</div>
                <div className="text-xl font-bold text-gray-900">
                  Ksh {selectedLimit.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Processing Fee</div>
                <div className="text-xl font-bold text-green-600">
                  Ksh {fee.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Loading State - Blue */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Connecting with M-Pesa...</span>
              </div>
            </div>
          )}

          {/* ✅ STK Sent Success - Green */}
          {stkSent && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">✓ STK Push Sent Successfully!</span>
              </div>
            </div>
          )}

          {/* ❌ Error State - Red */}
          {error && !stkSent && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  ID Number
                </span>
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your ID number"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 transition-colors"
                required
                disabled={loading || stkSent}
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Smartphone size={16} />
                  M-Pesa Phone Number
                </span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0712345678"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 transition-colors"
                required
                disabled={loading || stkSent}
                maxLength={12}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Shield size={16} />
                Important Information
              </p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Ensure your phone has enough balance for the processing fee.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Keep your phone nearby to enter your M-Pesa PIN promptly.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  You'll receive an STK push within 30 seconds.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className={`w-full text-white py-3 rounded-lg font-semibold transition-all ${
                (loading || stkSent)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }`}
              disabled={loading || stkSent}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : stkSent ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Sent Successfully!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Phone size={20} />
                  PAY WITH M-PESA
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PaymentModal;