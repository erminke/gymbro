const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

// Use consistent JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'GymBro2024_SecureJWT_ProductionKey_9X2mK8pL4nQ7sR1vW6tY3uE5oI8aB2cD';

// Create test user endpoint (for development and testing)
router.post('/create-test-user', async (req, res) => {
  try {
    console.log('Create test user endpoint called');
    
    // Default test user credentials
    const testEmail = 'erminke@gmail.com';
    const testPassword = 'Password123';
    const testName = 'Ermin Test User';
    
    // Check if user exists
    const existingUser = await db.getUserByEmail(testEmail);
    
    if (existingUser) {
      console.log('Test user already exists, returning existing user');
      return res.json({
        message: 'Test user already exists',
        user: { 
          id: existingUser.id, 
          email: existingUser.email,
          name: existingUser.name
        },
        password: testPassword, // It's safe to return this since it's a test account
        note: 'This user already existed in the database'
      });
    }
    
    // Create test user
    const hashedPassword = await require('bcryptjs').hash(testPassword, 10);
    
    // Insert the user directly using db.run for more reliable insertion
    db.db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [testEmail, hashedPassword, testName],
      function(err) {
        if (err) {
          console.error('Error inserting test user:', err);
          return res.status(500).json({ error: `Failed to create test user: ${err.message}` });
        }
        
        const userId = this.lastID;
        console.log(`Test user created with ID: ${userId}`);
        
        // Generate token
        const token = jwt.sign(
          { id: userId, email: testEmail }, 
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
          message: 'Test user created successfully',
          user: { 
            id: userId, 
            email: testEmail, 
            name: testName 
          },
          token,
          password: testPassword, // It's safe to return this since it's a test account
        });
      }
    );
  } catch (error) {
    console.error('Create test user error:', error);
    res.status(500).json({ error: `Failed to create test user: ${error.message}` });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const userId = await db.createUser(email, password, name);
    
    // Generate token
    const token = jwt.sign(
      { id: userId, email }, 
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = db.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token (for frontend to check if user is still authenticated)
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode token and handle both formats: { id } and { userId }
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

module.exports = router;
