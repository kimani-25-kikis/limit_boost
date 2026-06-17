import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  selectedLimit: number;
  fee: number;
  onClose: () => void;
  onPay: (data: { idNumber: string; phoneNumber: string }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  selectedLimit, 
  fee, 
  onClose, 
  onPay 
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPay({ idNumber, phoneNumber });
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
              </ul>
            </div>

            <button
              type="submit"
              className="w-full bg-fuliza-green text-white py-3 rounded-lg font-semibold hover:bg-fuliza-dark transition-colors"
            >
              PAY THE PROCESSING FEE
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