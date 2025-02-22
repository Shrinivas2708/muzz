const ChatMessage = require('../models/ChatMessage');
const redis = require('../config/redis');

exports.sendMessage = async (req, res) => {
    try {
        const { roomId, message } = req.body;
        const sender = req.user.id;

        // Store message temporarily in Redis
        const chatData = { sender, message, timestamp: new Date() };
        await redis.rpush(`chat:${roomId}`, JSON.stringify(chatData));
        await redis.ltrim(`chat:${roomId}`, -50, -1); // Keep only the last 50 messages

        // Save to MongoDB for long-term storage
        await ChatMessage.create({ roomId, sender, message });

        res.json({ message: 'Message sent', chatMessage: chatData });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        // First, try to fetch recent messages from Redis
        let messages = await redis.lrange(`chat:${roomId}`, 0, -1);
        messages = messages.map(JSON.parse);

        // If Redis is empty, fetch from MongoDB
        if (messages.length === 0) {
            messages = await ChatMessage.find({ roomId }).sort({ timestamp: -1 }).limit(50);
        }

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
