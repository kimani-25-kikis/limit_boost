import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Clock, Phone, Shield, User, Smartphone } from 'lucide-react';

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
  checkoutRequestId: string | null;
  status: 'idle' | 'initiating' | 'pending' | 'success' | 'failed';
  pollingAttempts: number;
  mpesaReceiptNumber: string | null;
  amountPaid: number | null;
  resultDesc: string | null;
}

const API_BASE_URL = 'http://localhost:5001/api';

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  selectedLimit, 
  fee, 
  onClose, 
  onPay 
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>({
    loading: false,
    error: null,
    success: false,
    transactionRef: null,
    checkoutRequestId: null,
    status: 'idle',
    pollingAttempts: 0,
    mpesaReceiptNumber: null,
    amountPaid: null,
    resultDesc: null
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      setPaymentState(prev => ({
        ...prev,
        error: 'Please enter a valid Safaricom phone number (e.g., 0712345678)',
        status: 'failed'
      }));
      return;
    }

    setIsSubmitting(true);
    
    setPaymentState({ 
      loading: true, 
      error: null, 
      success: false, 
      transactionRef: null,
      checkoutRequestId: null,
      status: 'initiating',
      pollingAttempts: 0,
      mpesaReceiptNumber: null,
      amountPaid: null,
      resultDesc: null
    });

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

      if (data.success && data.responseCode === '0') {
        setPaymentState(prev => ({
          ...prev,
          loading: false,
          error: null,
          success: false,
          transactionRef: data.transactionId || data.reference || null,
          checkoutRequestId: data.checkoutRequestId || null,
          status: 'pending',
          pollingAttempts: 0,
          resultDesc: data.responseDescription || 'STK Push sent successfully'
        }));

        onPay({ idNumber, phoneNumber: formattedPhone });

        if (data.checkoutRequestId) {
          startPolling(data.checkoutRequestId);
        }

        timeoutRef.current = setTimeout(() => {
          if (paymentState.status !== 'success' && paymentState.status !== 'failed') {
            setPaymentState(prev => ({
              ...prev,
              error: 'Payment taking too long. Please check your M-Pesa messages or try again.',
              status: 'failed',
              loading: false
            }));
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }, 120000);
      } else {
        setPaymentState({
          loading: false,
          error: data.message || data.responseDescription || 'Failed to initiate payment',
          success: false,
          transactionRef: null,
          checkoutRequestId: null,
          status: 'failed',
          pollingAttempts: 0,
          mpesaReceiptNumber: null,
          amountPaid: null,
          resultDesc: data.responseDescription || null
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState({
        loading: false,
        error: 'Failed to initiate payment. Please check your connection and try again.',
        success: false,
        transactionRef: null,
        checkoutRequestId: null,
        status: 'failed',
        pollingAttempts: 0,
        mpesaReceiptNumber: null,
        amountPaid: null,
        resultDesc: null
      });
      setIsSubmitting(false);
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
        
        setPaymentState(prev => ({
          ...prev,
          pollingAttempts: attempts
        }));

        console.log('📊 Polling response:', data);

        if (data.success) {
          // 🔑 KEY FIX: Check for pending status first
          if (data.status === 'pending') {
            console.log('⏳ Still pending, continuing to poll...');
            // Just keep polling, don't change state
            return;
          }
          
          if (data.status === 'success') {
            console.log('✅ Payment successful!');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            const mpesaReceipt = data.transaction?.mpesaReceiptNumber || data.mpesaReceiptNumber || null;
            const amountPaid = data.transaction?.amount || data.amount || null;
            
            setPaymentState(prev => ({
              ...prev,
              success: true,
              loading: false,
              error: null,
              status: 'success',
              mpesaReceiptNumber: mpesaReceipt,
              amountPaid: amountPaid,
              resultDesc: data.resultDesc || 'Payment completed successfully'
            }));
            
            setIsSubmitting(false);
            
            setTimeout(() => {
              onClose();
            }, 4000);
            return;
          }
          
          if (data.status === 'failed') {
            console.log('❌ Payment failed!');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            setPaymentState(prev => ({
              ...prev,
              loading: false,
              error: data.resultDesc || data.transaction?.resultDesc || 'Payment was declined. Please try again.',
              success: false,
              status: 'failed',
              resultDesc: data.resultDesc || null
            }));
            setIsSubmitting(false);
            return;
          }
        }
        
        if (attempts >= maxAttempts) {
          console.log('⏰ Max polling attempts reached');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setPaymentState(prev => ({
            ...prev,
            loading: false,
            error: 'Payment taking too long. Please check your M-Pesa messages or try again.',
            status: 'failed'
          }));
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const resetPayment = () => {
    setPaymentState({
      loading: false,
      error: null,
      success: false,
      transactionRef: null,
      checkoutRequestId: null,
      status: 'idle',
      pollingAttempts: 0,
      mpesaReceiptNumber: null,
      amountPaid: null,
      resultDesc: null
    });
    setIsSubmitting(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const renderStatusMessage = () => {
    switch (paymentState.status) {
      case 'initiating':
        return (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-semibold">Sending STK Push...</p>
                <p className="text-xs mt-1">Please wait while we connect to M-Pesa.</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-start">
              <Phone className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <p className="text-sm font-semibold">✓ STK Push Sent Successfully!</p>
                <p className="text-xs mt-1">Please check your phone and enter your M-Pesa PIN to complete payment.</p>
                <p className="text-xs mt-1 font-medium text-yellow-700">
                  Waiting for you to confirm payment...
                </p>
                {paymentState.transactionRef && (
                  <p className="text-xs mt-1 opacity-75">Transaction: {paymentState.transactionRef}</p>
                )}
                {paymentState.pollingAttempts > 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Waiting for confirmation... ({Math.min(paymentState.pollingAttempts, 40)}/40)
                  </p>
                )}
                <div className="mt-2 w-full bg-yellow-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-yellow-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((paymentState.pollingAttempts / 40) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">✓ Payment Successful!</p>
                <p className="text-xs mt-1">Your limit has been updated successfully.</p>
                {paymentState.mpesaReceiptNumber && (
                  <p className="text-xs mt-1 opacity-75 font-mono">
                    Receipt: {paymentState.mpesaReceiptNumber}
                  </p>
                )}
                {paymentState.amountPaid && (
                  <p className="text-xs mt-1 opacity-75">
                    Amount Paid: Ksh {paymentState.amountPaid.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'failed':
        return paymentState.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Payment Failed</p>
                <p className="text-xs mt-1">{paymentState.error}</p>
                <button 
                  onClick={() => {
                    resetPayment();
                  }}
                  className="text-xs mt-2 text-red-600 hover:text-red-800 font-semibold underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isProcessing = paymentState.loading || paymentState.status === 'initiating' || paymentState.status === 'pending';
  const isDisabled = isProcessing || paymentState.status === 'success' || isSubmitting;

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
                if (!isProcessing) {
                  resetPayment();
                  onClose();
                }
              }} 
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors" 
              disabled={isProcessing}
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

          {renderStatusMessage()}

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
                disabled={isDisabled}
                maxLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Used for verification only.</p>
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
                disabled={isDisabled}
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                An STK push will be sent to this Safaricom number.
              </p>
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
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Do not close this window until payment is complete.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className={`w-full text-white py-3 rounded-lg font-semibold transition-all ${
                isDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }`}
              disabled={isDisabled}
            >
              {paymentState.status === 'initiating' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending STK Push...
                </span>
              ) : paymentState.status === 'pending' ? (
                <span className="flex items-center justify-center gap-2">
                  <Phone className="animate-pulse" size={20} />
                  Waiting for Payment...
                </span>
              ) : paymentState.status === 'success' ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  ✓ Payment Complete
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Phone size={20} />
                  PAY WITH M-PESA
                </span>
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

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
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