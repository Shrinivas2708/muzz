const express = require("express");
const {
  createRoom,
  getRooms,
  joinRoom,
  getRoom,
} = require("../controllers/roomController");
const { verifyToken } = require("../utils/jwtUtils");

const router = express.Router();

// Add error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/create", verifyToken, asyncHandler(createRoom));
router.get("/", verifyToken, asyncHandler(getRooms));
router.get("/:roomId", verifyToken, asyncHandler(getRoom));
router.post("/join/:roomId", verifyToken, asyncHandler(joinRoom));

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Route Error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

module.exports = router;
