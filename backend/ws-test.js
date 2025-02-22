const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000'; 

const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log('Connected to WebSocket server');

    const roomId = '67b2fa27261fcc09909a6199';
    socket.emit('joinRoom', { roomId });

    socket.on('newMessage', (data) => {
        console.log('New message received:', data);
    });
    socket.on('updateQueue', (queue) => {
        console.log('Updated song queue:', queue);
    });
    socket.on('error', (error) => {
        console.error('Error:', error.message);
    });
    setTimeout(() => {
        const message = 'Hello, everyone!';
        const senderId = '67b2f8e2261fcc09909a6193'; 
        socket.emit('sendMessage', { roomId, sender: senderId, message });
        console.log(`Sent message: ${message}`);
    }, 1000); 
    setTimeout(() => {
        const songId = '67b2fac95b30e9bc585142ea'; // Replace with a valid song ObjectId
        const voteType = 'upvote'; 
        socket.emit('voteSong', { roomId, songId, voteType });
        console.log(`Voted ${voteType} on song: ${songId}`);
    }, 1000); 
});


socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});