const express = require('express');
const { addSong, getQueue, voteSong } = require('../controllers/songController');
const { verifyToken } = require('../utils/jwtUtils');

const router = express.Router();

router.post('/add', verifyToken, addSong);
router.get('/queue/:roomId', getQueue);
router.post('/vote', verifyToken, voteSong);

module.exports = router;
