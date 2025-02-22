const Room = require('../models/Room'); // Import your Room model
const ChatMessage = require('../models/ChatMessage'); // Import your ChatMessage model
const Song = require('../models/Song'); // Import your Song model
const redis = require('../config/redis');
const User = require('../models/User'); // Import your User model

module.exports = (io) => {
    // Keep track of users in rooms with their socket IDs and user IDs
    const roomUsers = new Map(); // Map<roomId, Map<socketId, userId>>
    const roomPlaybackStates = new Map();
    const userSocketMap = new Map(); // Map<socketId, {roomId, userId}>
    const roomCleanupTimers = new Map(); // Track cleanup timers for empty rooms

    // Helper function to get online users in a room
    const getOnlineUsers = async (roomId) => {
        try {
            const room = roomUsers.get(roomId);
            if (!room) return [];

            const userIds = Array.from(room.values());
            const users = await User.find(
                { _id: { $in: userIds } },
                'username _id'
            ).lean();

            return users;
        } catch (error) {
            console.error('Error getting online users:', error);
            return [];
        }
    };

    // Helper function to broadcast room state
    const broadcastRoomState = async (roomId) => {
        try {
            const room = roomUsers.get(roomId);
            const participantCount = room ? new Set(room.values()).size : 0; // Count unique users

            // Update room in database
            await Room.findByIdAndUpdate(roomId, {
                participantCount,
                lastActive: new Date()
            });

            // Broadcast to all clients for homepage updates
            io.emit('roomUpdate', {
                roomId,
                participantCount
            });
        } catch (error) {
            console.error('Error broadcasting room state:', error);
        }
    };

    // Helper function to handle user leaving room
    const handleUserLeaveRoom = async (socketId) => {
        try {
            const userInfo = userSocketMap.get(socketId);
            if (!userInfo) return;

            const { roomId } = userInfo;
            const room = roomUsers.get(roomId);
            
            if (room) {
                room.delete(socketId);
                
                // Check if user has other active sockets in the room
                let userStillActive = false;
                for (const [otherSocketId, otherUserId] of room.entries()) {
                    if (otherSocketId !== socketId && otherUserId === userInfo.userId) {
                        userStillActive = true;
                        break;
                    }
                }

                // Only update participant count if user is completely gone
                if (!userStillActive) {
                    await broadcastRoomState(roomId);
                }

                // If room is empty, start cleanup timer
                if (room.size === 0) {
                    roomUsers.delete(roomId);
                    await broadcastRoomState(roomId);
                }
            }

            userSocketMap.delete(socketId);
        } catch (error) {
            console.error('Error handling user leave room:', error);
        }
    };

    // Modify the isRoomCreator helper function
    const isRoomCreator = async (roomId, userId) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                console.log('Room not found:', roomId);
                return false;
            }
            // Add debug logging
            console.log('Room creator check:', {
                roomId,
                userId,
                creator: room.creator,
                isMatch: room.creator.toString() === userId?.toString()
            });
            return room.creator.toString() === userId?.toString();
        } catch (error) {
            console.error('Error checking room creator:', error);
            return false;
        }
    };

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('joinRoom', async ({ roomId, userId }) => {
            try {
                if (!roomId || !userId) return;

                socket.join(roomId);
                
                // Add user to room tracking
                if (!roomUsers.has(roomId)) {
                    roomUsers.set(roomId, new Map());
                }
                roomUsers.get(roomId).set(socket.id, userId);
                userSocketMap.set(socket.id, { roomId, userId });

                // Update participant count
                await broadcastRoomState(roomId);

                // Get previous messages and queue
                const messages = await redis.lrange(`chat:${roomId}`, 0, -1);
                const parsedMessages = messages.map(JSON.parse);
                
                const queue = await Song.find({ roomId })
                    .sort({ votes: -1, createdAt: 1 })
                    .populate('addedBy', 'username')
                    .lean();

                // Check if user is room creator
                const isCreator = await isRoomCreator(roomId, userId);
                
                // Send initial state to client
                socket.emit('roomInitialState', {
                    messages: parsedMessages,
                    queue,
                    isCreator
                });
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        socket.on('sendMessage', async ({ roomId, userId, sender, message }, callback) => {
            try {
                if (!roomId || !sender || !message || !userId) {
                    callback?.({ success: false });
                    return socket.emit('error', { message: 'Invalid message data' });
                }

                const chatMessage = {
                    roomId,
                    sender,
                    message,
                    userId,
                    timestamp: new Date()
                };

                // Save to MongoDB
                const savedMessage = await ChatMessage.create(chatMessage);

                // Add to Redis
                await redis.lpush(`chat:${roomId}`, JSON.stringify(savedMessage));
                await redis.ltrim(`chat:${roomId}`, 0, 49);

                // Broadcast to room
                io.to(roomId).emit('newMessage', savedMessage);
                
                // Send acknowledgment
                callback?.({ success: true });

            } catch (error) {
                console.error('Error sending message:', error);
                callback?.({ success: false });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('addSong', async ({ roomId, song, userId }) => {
            try {
                if (!roomId || !song || !userId) {
                    return socket.emit('error', { message: 'Missing required data' });
                }

                // Check if user is room creator
                const isCreator = await isRoomCreator(roomId, userId);
                console.log('Add song permission check:', { roomId, userId, isCreator });
                
                if (!isCreator) {
                    console.log('Permission denied for user:', userId);
                    return socket.emit('error', { message: 'Only room creator can add songs' });
                }

                const newSong = await Song.create({
                    title: song.title,
                    artist: song.artist,
                    url: song.url,
                    thumbnail: song.thumbnail,
                    duration: song.duration,
                    albumName: song.albumName,
                    originalId: song.id,
                    roomId,
                    addedBy: userId,
                    votes: 0,
                    upvoters: [],
                    downvoters: [],
                    upvotes: 0,
                    downvotes: 0
                });

                const queue = await Song.find({ roomId })
                    .sort({ votes: -1, createdAt: 1 })
                    .populate('addedBy', 'username')
                    .lean();

                io.to(roomId).emit('updateQueue', queue);
                
                // If this is the first song, set it as current
                if (queue.length === 1) {
                    io.to(roomId).emit('roomState', {
                        currentSong: queue[0],
                        queue: queue.slice(1),
                        playbackTime: 0,
                        isPlaying: false
                    });
                }
            } catch (error) {
                console.error('Error adding song:', error);
                socket.emit('error', { message: 'Failed to add song' });
            }
        });

        socket.on('leaveRoom', async ({ roomId }) => {
            try {
                await handleUserLeaveRoom(socket.id);
                // Update participant count after user leaves
                await broadcastRoomState(roomId);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        });

        socket.on('voteSong', async ({ roomId, songId, voteType, userId }) => {
            try {
                const song = await Song.findById(songId);
                if (!song) {
                    return socket.emit('error', { message: 'Song not found' });
                }

                // Check if user has already voted
                const hasUpvoted = song.upvoters.includes(userId);
                const hasDownvoted = song.downvoters.includes(userId);

                if (voteType === 'upvote') {
                    if (hasUpvoted) {
                        // Remove upvote if already upvoted
                        song.upvoters.pull(userId);
                        song.upvotes = Math.max(0, song.upvotes - 1);
                    } else {
                        // Add upvote and remove downvote if exists
                        if (hasDownvoted) {
                            song.downvoters.pull(userId);
                            song.downvotes = Math.max(0, song.downvotes - 1);
                        }
                        song.upvoters.push(userId);
                        song.upvotes += 1;
                    }
                } else if (voteType === 'downvote') {
                    if (hasDownvoted) {
                        // Remove downvote if already downvoted
                        song.downvoters.pull(userId);
                        song.downvotes = Math.max(0, song.downvotes - 1);
                    } else {
                        // Add downvote and remove upvote if exists
                        if (hasUpvoted) {
                            song.upvoters.pull(userId);
                            song.upvotes = Math.max(0, song.upvotes - 1);
                        }
                        song.downvoters.push(userId);
                        song.downvotes += 1;
                    }
                }

                // Calculate total votes (ensure it doesn't go negative)
                song.votes = song.upvotes - song.downvotes;
                song.votes = Math.max(0, song.votes); // Prevent negative votes

                await song.save();

                // Update MongoDB queue and broadcast
                const updatedQueue = await Song.find({ roomId }).sort({ votes: -1 }).lean();
                io.to(roomId).emit('updateQueue', updatedQueue);
            } catch (error) {
                console.error('Error voting song:', error);
                socket.emit('error', { message: 'Failed to vote' });
            }
        });

        socket.on('deleteSong', async ({ roomId, songId, userId }) => {
            try {
                const song = await Song.findById(songId);
                if (!song) {
                    return socket.emit('error', { message: 'Song not found' });
                }

                const room = await Room.findById(roomId);
                if (!room) {
                    return socket.emit('error', { message: 'Room not found' });
                }

                // Check if user is authorized to delete
                if (song.addedBy.toString() !== userId && room.creator.toString() !== userId) {
                    return socket.emit('error', { message: 'Not authorized to delete this song' });
                }

                await Song.findByIdAndDelete(songId);

                // Update MongoDB queue
                const updatedQueue = await Song.find({ roomId }).sort({ votes: -1 }).lean();

                // Update Redis queue
                await redis.del(`queue:${roomId}`);
                for (const song of updatedQueue) {
                    await redis.rpush(`queue:${roomId}`, JSON.stringify(song));
                }

                // Broadcast to all clients in the room
                io.to(roomId).emit('updateQueue', updatedQueue);
            } catch (error) {
                console.error("Error deleting song:", error);
                socket.emit('error', { message: 'Failed to delete song' });
            }
        });

        socket.on('songEnded', async ({ roomId, songId, currentQueue }) => {
            try {
                // Remove the ended song
                await Song.findByIdAndDelete(songId);
                
                // Get fresh queue from database
                const updatedQueue = await Song.find({ roomId })
                    .sort({ votes: -1, createdAt: 1 })
                    .populate('addedBy', 'username')
                    .lean();

                const nextSong = updatedQueue[0] || null;
                const remainingQueue = updatedQueue.slice(1);

                // Update room state
                roomPlaybackStates.set(roomId, {
                    time: 0,
                    isPlaying: nextSong ? true : false
                });

                // Broadcast updates to all clients in room
                io.to(roomId).emit('nextSong', { song: nextSong });
                io.to(roomId).emit('updateQueue', remainingQueue);
                io.to(roomId).emit('playbackState', { 
                    time: 0,
                    isPlaying: nextSong ? true : false 
                });
            } catch (error) {
                console.error("Error handling song end:", error);
                socket.emit('error', { message: 'Failed to process song end' });
            }
        });

        // Add more frequent playback sync
        socket.on('updatePlaybackTime', ({ roomId, time }) => {
            if (!roomPlaybackStates.has(roomId)) {
                roomPlaybackStates.set(roomId, { time: 0, isPlaying: true });
            }
            roomPlaybackStates.get(roomId).time = time;
            // Broadcast to all clients except sender
            socket.to(roomId).emit('playbackTimeUpdate', { time });
        });

        socket.on('seekTime', ({ roomId, time }) => {
            socket.to(roomId).emit('seekUpdate', { time });
        });

        socket.on('pauseSong', ({ roomId }) => {
            if (roomPlaybackStates.has(roomId)) {
                roomPlaybackStates.get(roomId).isPlaying = false;
            }
            socket.to(roomId).emit('songPaused');
        });

        socket.on('playSong', ({ roomId }) => {
            if (roomPlaybackStates.has(roomId)) {
                roomPlaybackStates.get(roomId).isPlaying = true;
            }
            socket.to(roomId).emit('songPlayed');
        });

        socket.on('disconnect', async () => {
            try {
                const userInfo = userSocketMap.get(socket.id);
                if (userInfo) {
                    await handleUserLeaveRoom(socket.id);
                    // Update participant count after disconnect
                    await broadcastRoomState(userInfo.roomId);
                }
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });

    // Modified cleanup function
    async function cleanupRoom(roomId) {
        try {
            // Delete room and related data from MongoDB
            await Promise.all([
                Room.findByIdAndDelete(roomId),
                ChatMessage.deleteMany({ roomId }),
                Song.deleteMany({ roomId })
            ]);

            // Clear Redis data
            await Promise.all([
                redis.del(`room:${roomId}`),
                redis.del(`chat:${roomId}`),
                redis.del(`queue:${roomId}`)
            ]);

            // Clear in-memory data
            roomPlaybackStates.delete(roomId);
            roomUsers.delete(roomId);
            roomCleanupTimers.delete(roomId);

            // Broadcast room deletion to all clients
            io.emit('roomDeleted', { roomId });
            console.log(`Room ${roomId} has been cleaned up due to inactivity`);
        } catch (error) {
            console.error(`Error cleaning up room ${roomId}:`, error);
        }
    }
};