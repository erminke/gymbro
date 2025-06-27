const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use a consistent JWT_SECRET for production
const JWT_SECRET = process.env.JWT_SECRET || 'GymBro2024_SecureJWT_ProductionKey_9X2mK8pL4nQ7sR1vW6tY3uE5oI8aB2cD';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthManager {
  constructor(db) {
    this.db = db;
  }

  async register(email, password) {
    try {
      // Check if user already exists
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        return { error: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.db.createUser(email, hashedPassword);

      // Generate token
      const token = this.generateToken(user.id);

      return { 
        user: { id: user.id, email: user.email }, 
        token 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Registration failed' };
    }
  }

  async login(email, password) {
    try {
      // Get user
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        return { error: 'Invalid credentials' };
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { error: 'Invalid credentials' };
      }

      // Generate token
      const token = this.generateToken(user.id);

      return { 
        user: { id: user.id, email: user.email }, 
        token 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Login failed' };
    }
  }

  generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = AuthManager;
