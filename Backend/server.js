// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// CORS CONFIGURATION - FIXED FOR DEPLOYMENT
// ============================================

// List of allowed origins (frontend URLs)
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  
 
  
  // Vercel URLs - Add your actual Vercel URL
  'https://saffulizalimitboost.vercel.app/',      // ← CHANGE THIS to your Vercel URL

  
  // Your custom domain (if you have one)
  // 'https://yourdomain.com',
];

// CORS middleware - allows specific origins only
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  } else if (origin) {
    // Log blocked origins for debugging
    console.log(`❌ CORS blocked: ${origin}`);
    return res.status(403).json({
      success: false,
      message: `Origin ${origin} not allowed by CORS`
    });
  }
  
  next();
});

// ============================================
// MIDDLEWARE
// ============================================

// Logging middleware - shows all requests
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

// Health check - useful for monitoring
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

// Root route - API information
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

// 404 handler - for undefined routes
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
  
  // Don't expose internal errors in production
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
  console.log(`📍 Server running on:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log('\n📊 Test your endpoints:');
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log(`   - POST http://localhost:${PORT}/api/initiate-payment`);
  console.log(`   - GET  http://localhost:${PORT}/api/transaction-status/:id`);
  console.log('\n✅ Press Ctrl+C to stop');
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

export default app;