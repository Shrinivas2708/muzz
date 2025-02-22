const Song = require('../models/Song');
const redis = require('../config/redis');

exports.addSong = async (req, res) => {
    try {
        const { roomId, title, artist, url } = req.body;
        const userId = req.user.id;

        // Check if user is the room creator
        const roomData = await redis.get(`room:${roomId}`);
        if (!roomData) return res.status(404).json({ message: 'Room not found' });

        const room = JSON.parse(roomData);
        if (room.creator !== userId) {
            return res.status(403).json({ message: 'Only room creator can add songs' });
        }

        const song = await Song.create({ roomId, title, artist, url });

        // Add song to Redis queue
        await redis.rpush(`queue:${roomId}`, JSON.stringify({ ...song.toObject(), votes: 0 }));

        res.status(201).json({ message: 'Song added to queue', song });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getQueue = async (req, res) => {
    try {
        const { roomId } = req.params;
        const queue = await redis.lrange(`queue:${roomId}`, 0, -1);
        res.json(queue.map(JSON.parse));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// exports.voteSong = async (req, res) => {
//     try {
//         const { roomId, songId, voteType } = req.body;
//         const queue = await redis.lrange(`queue:${roomId}`, 0, -1);
//         let updatedQueue = queue.map(JSON.parse);

//         const songIndex = updatedQueue.findIndex(song => song._id === songId);
//         if (songIndex === -1) return res.status(404).json({ message: 'Song not found' });

//         updatedQueue[songIndex].votes += voteType === 'upvote' ? 1 : -1;

//         // Sort queue by highest votes
//         updatedQueue.sort((a, b) => b.votes - a.votes);

//         // Update Redis queue
//         await redis.del(`queue:${roomId}`);
//         for (const song of updatedQueue) {
//             await redis.rpush(`queue:${roomId}`, JSON.stringify(song));
//         }

//         res.json({ message: 'Vote registered', queue: updatedQueue });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

exports.voteSong = async (req, res) => {
    try {
        const { roomId, songId, voteType } = req.body;

        const transaction = redis.multi();

        // Fetch queue from Redis
        let queue = await redis.lrange(`queue:${roomId}`, 0, -1);
        let updatedQueue = queue.map(JSON.parse);

        const songIndex = updatedQueue.findIndex(song => song._id === songId);
        if (songIndex === -1) return res.status(404).json({ message: 'Song not found' });

        // Adjust votes atomically
        updatedQueue[songIndex].votes += voteType === 'upvote' ? 1 : -1;
        updatedQueue.sort((a, b) => b.votes - a.votes);
        

        transaction.del(`queue:${roomId}`);
        updatedQueue.forEach(song => transaction.rpush(`queue:${roomId}`, JSON.stringify(song)));

        await transaction.exec();

        res.json({ message: 'Vote registered', queue: updatedQueue });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
