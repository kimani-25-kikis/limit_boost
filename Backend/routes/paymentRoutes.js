// routes/paymentRoutes.js
import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate-payment', paymentController.initiatePayment);
router.get('/transaction-status/:checkoutRequestId', paymentController.queryTransactionStatus);
router.post('/callback', paymentController.handleCallback);
router.get('/transactions', paymentController.getAllTransactions);

export default router;