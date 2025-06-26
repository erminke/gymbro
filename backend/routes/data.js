const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../database');
const router = express.Router();

// Get all user data
router.get('/sync', authMiddleware, async (req, res) => {
  try {
    const userData = await db.getUserData(req.user.id);
    res.json({
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync get error:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Save/sync all user data
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Save each data type separately for better organization
    for (const dataType of Object.keys(data)) {
      await db.saveUserData(req.user.id, dataType, data[dataType]);
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync save error:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Get specific data type
router.get('/:dataType', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const data = await db.getUserData(req.user.id, dataType);
    
    res.json({
      success: true,
      dataType,
      data: data || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Save specific data type
router.post('/:dataType', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { data } = req.body;
    
    if (data === undefined) {
      return res.status(400).json({ error: 'Data is required' });
    }

    await db.saveUserData(req.user.id, dataType, data);

    res.json({
      success: true,
      message: `${dataType} data saved successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Delete specific data type
router.delete('/:dataType', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    await db.deleteUserData(req.user.id, dataType);

    res.json({
      success: true,
      message: `${dataType} data deleted successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

module.exports = router;
