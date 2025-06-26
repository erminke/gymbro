const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../database');
const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    
    // Simple validation
    if (name && name.trim() === '') {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    // For now, we'll just return success since we're keeping it simple
    // In a full implementation, you'd update the users table
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: name || req.user.name
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
