  const Redis = require("ioredis");

  const redis = new Redis({
    host: "redis-10362.crce179.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 10362,
    password: "dhZWcj2f8rDfo4NHfFLXTluwzukayihK",  // Ensure you have the correct password in .env
    tls: false // ✅ Explicitly disable TLS (remove if Redis supports TLS)
  });

  redis.on("connect", () => console.log("✅ Redis Connected"));
  redis.on("error", (err) => console.error("❌ Redis Connection Error:", err));

  module.exports = redis;
