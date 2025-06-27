const jwt = require('jsonwebtoken');
const db = require('../database');

// Use the same JWT secret fallback as in auth.js for consistency
const JWT_SECRET = process.env.JWT_SECRET || 'GymBro2024_SecureJWT_ProductionKey_9X2mK8pL4nQ7sR1vW6tY3uE5oI8aB2cD';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // Handle both token formats - some tokens use id, others use userId
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.error('Invalid token format - no userId or id found');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const user = await db.getUserById(userId);
    
    if (!user) {
      console.error(`No user found with id: ${userId}`);
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
