const Room = require("../models/Room");
const redis = require("../config/redis");
const Song = require("../models/Song");
const ChatMessage = require("../models/ChatMessage");
exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const room = await Room.create({
      name,
      creator: userId,
      participants: [userId],
    });

    // Store room in Redis with expiration (300s = 5 minutes)
    await redis.setex(`room:${room._id}`, 300, JSON.stringify(room));

    res.status(201).json({ message: "Room created", room });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("creator", "username");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // First check if room exists in MongoDB
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Add user to participants if not already there
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    // Update Redis cache
    const roomData = room.toObject();
    await redis.setex(`room:${roomId}`, 300, JSON.stringify(roomData));

    res.json({ message: "Joined room successfully", room: roomData });
  } catch (error) {
    console.error("Join room error:", error);
    res
      .status(500)
      .json({ message: "Failed to join room", error: error.message });
  }
};

exports.cleanupInactiveRooms = async () => {
  try {
    const rooms = await Room.find();
    console.log("Rooms Before Cleanup:", rooms);

    for (const room of rooms) {
      const isActive = await redis.exists(`room:${room._id}`);
      if (!isActive) {
        // Delete room data from Redis
        const redisCleanup = redis
          .multi()
          .del(`room:${room._id}`)
          .del(`queue:${room._id}`)
          .del(`chat:${room._id}`);

        // Execute Redis cleanup
        await redisCleanup.exec();

        // Delete MongoDB data
        const [roomData, songData, chatData] = await Promise.all([
          Room.findByIdAndDelete(room._id),
          Song.deleteMany({ roomId: room._id }),
          ChatMessage.deleteMany({ roomId: room._id }),
        ]);

        console.log(
          `Room ${room._id} and all associated data deleted due to inactivity.`
        );
        console.log("Deleted Data:", { roomData, songData, chatData });
      }
    }
  } catch (error) {
    console.error("Cleanup inactive rooms error:", error);
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // First try Redis
    let room = await redis.get(`room:${roomId}`);
    if (room) {
      return res.json(JSON.parse(room));
    }

    // If not in Redis, get from MongoDB
    room = await Room.findById(roomId).populate("creator", "username");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Cache in Redis
    await redis.setex(`room:${roomId}`, 300, JSON.stringify(room));

    res.json(room);
  } catch (error) {
    console.error("Get room error:", error);
    res
      .status(500)
      .json({ message: "Failed to get room", error: error.message });
  }
};
