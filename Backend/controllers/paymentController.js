// controllers/paymentController.js

import mpesaService from '../services/mpesaService.js';

const transactions = new Map();

export const initiatePayment = async (req, res) => {
  try {
    const { idNumber, phoneNumber, amount, limit } = req.body;

    if (!phoneNumber || !amount || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: idNumber, phoneNumber, amount'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const transactionId = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const accountReference = `LIMIT${limit}${Date.now()
      .toString()
      .slice(-6)}`;

    const result = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      accountReference,
      `Limit Upgrade to ${limit}`
    );

    if (result.success && result.responseCode === '0') {
      const transactionData = {
        transactionId,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        phoneNumber,
        idNumber,
        amount,
        limit,
        status: 'pending',
        createdAt: new Date().toISOString(),
        response: result.data
      };

      transactions.set(result.checkoutRequestId, transactionData);

      return res.status(200).json({
        success: true,
        transactionId,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        message: 'STK Push sent successfully',
        responseDescription: result.responseDescription
      });
    }

    return res.status(400).json({
      success: false,
      message:
        result.error?.ResponseDescription ||
        result.responseDescription ||
        'Failed to initiate payment',
      errorCode: result.responseCode || '400'
    });
  } catch (error) {
    console.error('❌ Initiate payment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while initiating payment'
    });
  }
};

export const queryTransactionStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'CheckoutRequestID is required'
      });
    }

    const transaction = transactions.get(checkoutRequestId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Return pending immediately while waiting for callback
    if (transaction.status === 'pending') {
      return res.status(200).json({
        success: true,
        status: 'pending',
        message: 'Transaction is still pending',
        transaction
      });
    }

    const result = await mpesaService.queryTransactionStatus(
      checkoutRequestId
    );

    if (result.success) {
      transaction.status = result.status;
      transaction.resultCode = result.resultCode;
      transaction.resultDesc = result.resultDesc;
      transaction.lastChecked = new Date().toISOString();

      if (result.status === 'success') {
        transaction.completedAt = new Date().toISOString();

        console.log(
          `✅ Payment successful for transaction: ${transaction.transactionId}`
        );
      }

      transactions.set(checkoutRequestId, transaction);

      return res.status(200).json({
        success: true,
        status: result.status,
        resultCode: result.resultCode,
        resultDesc: result.resultDesc,
        transaction
      });
    }

    return res.status(400).json({
      success: false,
      message: result.error || 'Failed to query transaction status'
    });
  } catch (error) {
    console.error('❌ Query transaction error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while querying transaction'
    });
  }
};

export const handleCallback = async (req, res) => {
  try {
    console.log(
      '📨 Callback received:',
      JSON.stringify(req.body, null, 2)
    );

    const { Body } = req.body;

    if (Body?.stkCallback) {
      const {
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = Body.stkCallback;

      const transaction = transactions.get(CheckoutRequestID);

      if (transaction) {
        transaction.status =
          ResultCode === '0' ? 'success' : 'failed';

        transaction.resultCode = ResultCode;
        transaction.resultDesc = ResultDesc;
        transaction.callbackReceived = true;
        transaction.callbackData = req.body;

        if (ResultCode === '0' && CallbackMetadata) {
          const items = CallbackMetadata.Item || [];

          const amount = items.find(
            item => item.Name === 'Amount'
          )?.Value;

          const mpesaReceipt = items.find(
            item => item.Name === 'MpesaReceiptNumber'
          )?.Value;

          const transactionDate = items.find(
            item => item.Name === 'TransactionDate'
          )?.Value;

          transaction.amount = amount || transaction.amount;
          transaction.mpesaReceiptNumber = mpesaReceipt;
          transaction.transactionDate = transactionDate;
          transaction.completedAt = new Date().toISOString();

          console.log(
            `✅ Payment completed: ${mpesaReceipt} - Amount: ${amount}`
          );
        }

        transactions.set(CheckoutRequestID, transaction);
      } else {
        console.warn(
          `⚠️ Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`
        );
      }
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('❌ Callback processing error:', error);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const allTransactions = Array.from(transactions.values());

    return res.status(200).json({
      success: true,
      count: allTransactions.length,
      transactions: allTransactions
    });
  } catch (error) {
    console.error('❌ Get all transactions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};