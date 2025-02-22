    const mongoose = require('mongoose');

    const RoomSchema = new mongoose.Schema({
        name: { type: String, required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now },
        participantCount: { type: Number, default: 0 }
    });

    module.exports = mongoose.model('Room', RoomSchema);
