// services/mpesaService.js
import axios from 'axios';
import config from '../config/mpesaConfig.js';

class MpesaService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('✅ M-Pesa Service initialized with REAL credentials');
  }

  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
        console.log('✅ Using cached access token');
        return this.accessToken;
      }

      console.log('🔑 Getting new access token...');
      
      const auth = Buffer.from(
        `${config.consumerKey}:${config.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      console.log('✅ Access token response received');
      
      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      console.log('✅ Access token obtained successfully');
      console.log('📝 Token:', this.accessToken.substring(0, 20) + '...');
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa. Check your credentials.');
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    
    console.log('📱 Formatted phone:', cleaned);
    return cleaned;
  }

  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const token = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const timestamp = this.getTimestamp();
      
      const password = Buffer.from(
        `${config.shortCode}${config.passkey}${timestamp}`
      ).toString('base64');

      console.log('📝 Timestamp:', timestamp);
      console.log('🔑 Shortcode:', config.shortCode);
      console.log('🔐 Password:', password.substring(0, 20) + '...');

      const requestBody = {
        BusinessShortCode: config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: config.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: config.callbackUrl,
        AccountReference: accountReference || 'FulizaPayment',
        TransactionDesc: transactionDesc || 'Payment for limit upgrade',
      };

      console.log('📤 Sending STK Push to M-Pesa...');
      console.log('📱 Phone:', formattedPhone);
      console.log('💰 Amount:', amount);
      console.log('🔗 Callback URL:', config.callbackUrl);

      // IMPORTANT: Make sure the token is properly formatted with "Bearer " prefix
      const authHeader = `Bearer ${token}`;
      console.log('🔑 Auth Header:', authHeader.substring(0, 30) + '...');

      const response = await axios.post(
        `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ STK Push Response:', response.data);

      return {
        success: true,
        data: response.data,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
      };
    } catch (error) {
      console.error('❌ STK Push error details:');
      if (error.response) {
        console.error('📄 Response status:', error.response.status);
        console.error('📄 Response data:', error.response.data);
      } else if (error.request) {
        console.error('❌ No response received');
      } else {
        console.error('❌ Error:', error.message);
      }
      
      return {
        success: false,
        error: error.response?.data || error.message,
        responseCode: error.response?.data?.errorCode || '500',
        responseDescription: error.response?.data?.errorMessage || 'STK Push failed',
      };
    }
  }

  async queryTransactionStatus(checkoutRequestId) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      
      const password = Buffer.from(
        `${config.shortCode}${config.passkey}${timestamp}`
      ).toString('base64');

      const requestBody = {
        BusinessShortCode: config.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      console.log('📊 Checking transaction status...');
      const response = await axios.post(
        `${config.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📊 Transaction Status:', response.data);

      return {
        success: true,
        data: response.data,
        status: response.data.ResultCode === '0' ? 'success' : 'failed',
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
      };
    } catch (error) {
      console.error('❌ Transaction query error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

export default new MpesaService();