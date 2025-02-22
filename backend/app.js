const express = require('express');
const app = express();

// ... other middleware

// Mount the rooms router at /api/rooms
app.use('/api/rooms', require('./routes/rooms'));

// ... rest of your app configuration 