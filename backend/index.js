const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// const rateLimiter = require("./middlewares/rateLimiter");
const { cleanupInactiveRooms } = require("./controllers/roomController");
const redis = require("./config/redis"); 
const connectDB = require("./config/db"); 

const app = express();
app.use(express.json());
app.use(cors({
    origin:"*"
    // origin:  "https://muzz.shriii.xyz/",
    // methods: ["GET", "POST"],
    // credentials: true
}));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/songs", require("./routes/songRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin:"*"
        // origin: "https://muzz.shriii.xyz/",
        // methods: ["GET", "POST"],
        // credentials: true,
        // allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling']
});
require("./websocket/socket")(io);

// ✅ Run cleanup every 5 minutes
// setInterval(cleanupInactiveRooms, 300000);
setInterval(cleanupInactiveRooms, 120000);

// ✅ Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.USE_HTTPS === "true" ? "https" : "http"}://localhost:${PORT}`);
});
