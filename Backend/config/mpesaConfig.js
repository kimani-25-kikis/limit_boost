// config/mpesaConfig.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET,
  passkey: process.env.PASSKEY,
  shortCode: process.env.SHORTCODE,          // Till Number: 1582875
  storeNumber: process.env.STORE_NUMBER,      // Store/HO Number: 1098248
  baseUrl: process.env.BASE_URL,              // https://api.safaricom.co.ke
  callbackUrl: process.env.CALLBACK_URL,
};