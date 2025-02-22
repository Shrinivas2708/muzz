const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const { verifyToken } = require('../utils/jwtUtils');

const router = express.Router();

router.post('/send', verifyToken, sendMessage);
router.get('/:roomId', getMessages);

module.exports = router;
