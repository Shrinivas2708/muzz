import { io } from 'socket.io-client';

// Create socket instance
export const socket = io(import.meta.env.VITE_WS_URL || 'https://muzz-8wzg.onrender.com', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  timeout: 10000
});

socket.on("connect", () => {
  console.log("Connected to socket server");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
  // Attempt to reconnect on error
  setTimeout(() => {
    socket.connect();
  }, 1000);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
  if (reason === "io server disconnect") {
    // Reconnect if server disconnected
    socket.connect();
  }
});

// Export socket as both default and named export for compatibility
export default socket;