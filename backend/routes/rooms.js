const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Room = require('../models/Room');

// Create a room
router.post('/create', auth, async (req, res) => {
  try {
    const { creator, name } = req.body;
    
    const room = new Room({
      creator,
      name: name || `${req.user.username}'s Room`,
      participants: [creator]
    });

    await room.save();
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// Get all rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('creator', 'username')
      .lean();
      
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

module.exports = router; 