import Redis from "ioredis";

const createRedisClient = (): Redis => {
  const client = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });

  client.on("error", (err) => console.error("Redis error:", err));
  client.on("connect", () => console.log("Redis connected"));

  return client;
};

export const redisClient = createRedisClient();
export const bullRedis = createRedisClient();
