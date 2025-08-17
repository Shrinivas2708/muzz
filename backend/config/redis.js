  const Redis = require("ioredis");
console.log(process.env.REDIS)
  const redis = new Redis(process.env.REDIS);


  redis.on("connect", () => console.log("✅ Redis Connected"));
  redis.on("error", (err) => console.error("❌ Redis Connection Error:", err));

  module.exports = redis;
