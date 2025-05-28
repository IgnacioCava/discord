import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => console.log(`✅ Redis connected for worker ${process.pid}.`));
redis.on("error", (err) => console.error("❌ Redis Error:", err));

export default redis;
