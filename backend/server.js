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

// Dynamic CORS configuration with support for all possible frontend origins
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Request origin:', origin || 'No origin');
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In non-production, allow all origins for easy development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check for allowed domains but be permissive
    // We'll allow all vercel.app domains and any domains stored in allowed origins
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:8000', 
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      // Production frontend URLs
      'https://gymbro-frontend.vercel.app',
      'https://gymbro-frontend-j5a8bv12c-erminkes-projects.vercel.app',
      'https://gymbro-frontend-aopj0nwsy-erminkes-projects.vercel.app',
      'https://gymbro-frontend-m5xixgnuc-erminkes-projects.vercel.app',
      'https://gymbro-erminkes-projects.vercel.app',
      // Allow frontend URL from environment variable
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow any vercel.app domain for deployment
    if (origin.includes('.vercel.app')) {
      console.log('Allowing Vercel app domain:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Add custom headers to make sure authentication works properly
app.use((req, res, next) => {
  // Log request method and path for debugging
  console.log(`${req.method} ${req.path}`);
  
  // Additional security and CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
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
