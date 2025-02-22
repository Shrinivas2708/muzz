const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    albumName: String,
    originalId: String,
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    votes: {
        type: Number,
        default: 0
    },
    upvoters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvoters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Song', songSchema);
