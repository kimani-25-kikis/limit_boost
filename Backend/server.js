// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// CORS CONFIGURATION - WITH YOUR ACTUAL URL
// ============================================

// List of allowed origins (frontend URLs)
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  
  // ✅ YOUR ACTUAL VERCEL URL - I ADDED THIS
  'https://saffulizalimitboost.vercel.app',
  
  // Other possible URLs (keep these for future use)
  // 'https://limit-boost.netlify.app',
  // 'https://your-project.vercel.app',
];

// CORS middleware - handles preflight and actual requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  if (allowedOrigins.includes(origin) || !origin) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      console.log(`✅ Preflight request allowed for: ${origin}`);
      return res.sendStatus(200);
    }
    
    console.log(`✅ CORS allowed: ${origin}`);
    next();
  } else {
    // Log blocked origins
    console.log(`❌ CORS blocked: ${origin}`);
    return res.status(403).json({
      success: false,
      message: `Origin ${origin} not allowed by CORS`
    });
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
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