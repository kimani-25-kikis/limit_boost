// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// CORS CONFIGURATION - COMPLETE FIX
// ============================================

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://saffulizalimitboost.vercel.app',  // YOUR VERCEL URL
  // Add other frontend URLs here
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ============================================
// MIDDLEWARE
// ============================================

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'M-Pesa Payment Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', paymentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'M-Pesa Payment API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: 'GET /health',
      payment: 'POST /api/initiate-payment',
      status: 'GET /api/transaction-status/:id',
      callback: 'POST /api/callback',
      root: 'GET /'
    },
    cors: {
      allowedOrigins: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n=================================');
  console.log('🚀 M-Pesa Payment Server Started');
  console.log('=================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log('\n📊 Test your endpoints:');
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log('=================================\n');
});

export default app;