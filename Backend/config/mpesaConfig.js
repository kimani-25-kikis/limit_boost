// config/mpesaConfig.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET,
  passkey: process.env.PASSKEY,
  shortCode: process.env.SHORTCODE || '174379',
  baseUrl: process.env.BASE_URL || 'https://sandbox.safaricom.co.ke',
  callbackUrl: process.env.CALLBACK_URL || 'https://your-ngrok-url.ngrok.io/api/callback',
  testPhoneNumber: '254708374149'
};