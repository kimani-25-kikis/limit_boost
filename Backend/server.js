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

// List of allowed origins - INCLUDING YOUR VERCEL URL
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  
  // Netlify
  'https://your-netlify-site.netlify.app',
  
  // ✅ YOUR VERCEL URL - EXACT MATCH
  'https://saffulizalimitboost.vercel.app',
  'https://saffulizalimitboost.vercel.app/', // Also allow with trailing slash
  
  // Add your custom domain if you have one
  // 'https://yourdomain.com',
];

// ============================================
// CORS MIDDLEWARE - WITH DEBUGGING
// ============================================

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`🔍 CORS Check - Origin: ${origin || 'No origin'}`);
  console.log(`🔍 Request: ${req.method} ${req.url}`);
  
  // Check if origin is allowed (with or without trailing slash)
  const isAllowed = !origin || allowedOrigins.some(allowed => 
    origin === allowed || origin === allowed.replace(/\/$/, '') || origin === allowed + '/'
  );
  
  if (isAllowed) {
    // Set CORS headers for allowed origins
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    
    console.log(`✅ CORS allowed: ${origin || 'No origin'}`);
  } else {
    console.log(`❌ CORS blocked: ${origin}`);
    // Continue anyway - let the cors middleware handle the error
  }
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`✅ Preflight request handled for: ${origin || 'No origin'}`);
    return res.sendStatus(200);
  }
  
  next();
});

// Also use the cors package as backup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed (with or without trailing slash)
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin === allowed.replace(/\/$/, '') || origin === allowed + '/'
    );
    
    if (isAllowed) {
      console.log(`✅ CORS (cors package) allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS (cors package) blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
}));

// Handle preflight requests explicitly
app.options('*', cors());

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
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log('\n📊 Test your endpoints:');
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log('=================================\n');
});

export default app;