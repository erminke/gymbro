const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Configure CORS to specifically allow the frontend domain
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Request origin:', origin || 'No origin');
    
    // Allow requests from the frontend domain (and no origin for same-domain requests)
    const allowedOrigins = [
      'https://gymbro-frontend.vercel.app',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000'
    ];
    
    // No origin is common for same-domain requests or certain browsers
    const originAllowed = !origin || allowedOrigins.includes(origin);
    
    if (originAllowed) {
      callback(null, true);
    } else {
      console.warn(`Origin rejected by CORS policy: ${origin}`);
      callback(null, true); // Still allow all origins as fallback for now
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Add specialized CORS headers for all responses to ensure cross-domain requests work
app.use((req, res, next) => {
  // Get the origin from the request headers
  const origin = req.headers.origin;
  
  // Define allowed origins (must match the frontend domains)
  const allowedOrigins = [
    'https://gymbro-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000'
  ];
  
  // Set the appropriate CORS header based on the origin
  if (origin && allowedOrigins.includes(origin)) {
    // If it's one of our allowed origins, echo back that specific origin
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Fall back to the incoming origin or * as last resort
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight OPTIONS requests automatically
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Database check - useful for Vercel debugging
app.get('/api/db-check', async (req, res) => {
  try {
    // Try to get all users (limited info only)
    const users = await new Promise((resolve, reject) => {
      db.db.all('SELECT id, email, name FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({ 
      status: 'OK', 
      databaseAccess: true,
      userCount: users.length,
      demoUserExists: users.some(u => u.email === 'test@example.com'),
      vercel: process.env.VERCEL === '1',
      dbPath: process.env.VERCEL ? '/tmp/gymbro.db' : './database/gymbro.db'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      databaseAccess: false,
      error: error.message,
      vercel: process.env.VERCEL === '1'
    });
  }
});

// Test authentication endpoint - useful for debugging
app.get('/api/auth-test', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth test endpoint called with token:', token ? `${token.substring(0, 15)}...` : 'No token');
    
    if (!token) {
      return res.status(401).json({ 
        authenticated: false, 
        error: 'No token provided',
        howToFix: 'Send a Bearer token in the Authorization header' 
      });
    }
    
    try {
      // Use consistent JWT_SECRET 
      const JWT_SECRET = process.env.JWT_SECRET || 'GymBro2024_SecureJWT_ProductionKey_9X2mK8pL4nQ7sR1vW6tY3uE5oI8aB2cD';
      const jwt = require('jsonwebtoken');
      
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      // Check if we have userId or id
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return res.json({ 
          authenticated: false, 
          error: 'Invalid token format - no user ID found',
          decodedToken: decoded
        });
      }
      
      const user = await db.getUserById(userId);
      
      if (!user) {
        return res.json({ 
          authenticated: false, 
          error: `No user found with ID: ${userId}`,
          tokenContainedId: userId
        });
      }
      
      return res.json({
        authenticated: true,
        user: { id: user.id, email: user.email, name: user.name },
        tokenInfo: {
          issueTime: new Date(decoded.iat * 1000).toISOString(),
          expiryTime: new Date(decoded.exp * 1000).toISOString(),
          remainingTimeMs: (decoded.exp * 1000) - Date.now()
        }
      });
    } catch (error) {
      return res.status(401).json({ 
        authenticated: false, 
        error: `Token verification failed: ${error.message}`,
        suggestedAction: 'Try logging in again to get a new token'
      });
    }
  } catch (error) {
    res.status(500).json({ error: `Server error in auth test: ${error.message}` });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Gymbro Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
