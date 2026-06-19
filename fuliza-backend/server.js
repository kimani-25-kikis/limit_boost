const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const crypto = require('crypto');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize payment
app.post('/api/initiate-payment', async (req, res) => {
  try {
    const { idNumber, phoneNumber, amount, limit } = req.body;

    // Format phone number to international format (254)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? `254${phoneNumber.slice(1)}` 
      : phoneNumber.startsWith('254') 
        ? phoneNumber 
        : `254${phoneNumber}`;

    // Generate unique reference
    const reference = `FULIZA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare Paystack charge request
    const paystackData = {
      email: `${idNumber}@fuliza.com`, // Use ID as email for identification
      amount: amount * 100, // Convert to kobo/cents
      currency: 'KES',
      metadata: {
        customer_id: idNumber,
        phone: formattedPhone,
        limit: limit,
        custom_fields: [
          {
            display_name: "ID Number",
            variable_name: "id_number",
            value: idNumber
          },
          {
            display_name: "Phone Number",
            variable_name: "phone_number",
            value: formattedPhone
          },
          {
            display_name: "Limit Requested",
            variable_name: "limit",
            value: limit
          }
        ]
      },
      // For M-Pesa, you need to set channel to 'mobile_money'
      // But Paystack automatically detects M-Pesa if phone number is provided
      // and you enable it in your Paystack dashboard
    };

    // Make request to Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      // For M-Pesa, we need to initiate charge
      // If you want to directly charge the customer without redirect:
      const chargeData = {
        email: `${idNumber}@fuliza.com`,
        amount: amount * 100,
        reference: reference,
        currency: 'KES',
        metadata: {
          customer_id: idNumber,
          phone: formattedPhone,
          limit: limit
        },
        // This is for direct charge
        mobile_money: {
          phone: formattedPhone,
          provider: 'mpesa'
        }
      };

      // Actually, Paystack has a specific endpoint for M-Pesa
      // You need to use the charge endpoint for mobile money
      try {
        const chargeResponse = await axios.post(
          'https://api.paystack.co/charge',
          chargeData,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (chargeResponse.data.status) {
          return res.json({
            success: true,
            message: 'STK push sent successfully',
            data: chargeResponse.data.data,
            reference: reference
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Failed to initiate payment',
            error: chargeResponse.data.message
          });
        }
      } catch (chargeError) {
        console.error('Charge error:', chargeError.response?.data || chargeError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to initiate M-Pesa payment',
          error: chargeError.response?.data?.message || chargeError.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment',
        error: response.data.message
      });
    }
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.response?.data?.message || error.message
    });
  }
});

// Verify payment webhook (Paystack will call this)
app.post('/api/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    
    // Handle different events
    if (event.event === 'charge.success') {
      const data = event.data;
      console.log('Payment successful:', data);
      
      // Here you would:
      // 1. Update user's limit in your database
      // 2. Mark payment as successful
      // 3. Send confirmation to user
      
      // You can also send a webhook to your frontend or update the user's status
    }

    // Send 200 OK to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Check transaction status
app.get('/api/transaction-status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      const transaction = response.data.data;
      res.json({
        success: true,
        status: transaction.status,
        data: transaction
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Transaction verification failed'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});