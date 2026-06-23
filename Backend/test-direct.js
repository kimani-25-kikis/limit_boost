import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function directSTKTest() {
  try {
    console.log('🧪 Direct STK Push Test\n');

    // Step 1: Get Token
    console.log('1️⃣ Getting access token...');
    const auth = Buffer.from(
      `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const token = tokenResponse.data.access_token;
    console.log('✅ Token obtained:', token.substring(0, 20) + '...\n');

    // Step 2: Generate Password
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    console.log('2️⃣ Timestamp:', timestamp);
    
    const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const shortcode = '174379';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    console.log('✅ Password generated\n');

    // Step 3: Send STK Push
    console.log('3️⃣ Sending STK Push...');
    
    const requestBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1,
      PartyA: '254708374149',
      PartyB: shortcode,
      PhoneNumber: '254708374149',
      CallBackURL: process.env.CALLBACK_URL || 'https://social-bushes-read.loca.lt/api/callback',
      AccountReference: 'TestPayment',
      TransactionDesc: 'Test STK Push',
    };

    console.log('📤 Request:', JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

directSTKTest();