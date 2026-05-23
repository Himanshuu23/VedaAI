import "dotenv/config";
import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { redisClient } from "./config/redis";
import { wsManager } from "./websocket/ws.manager";
import { assessmentQueueEvents } from "./queues/assessment.queue";

const PORT = parseInt(process.env.PORT || "5000");

const bootstrap = async (): Promise<void> => {
  await connectDB();
  console.log("MongoDB connected");

  await redisClient.ping();
  console.log("Redis connected");

  redisClient.subscribe("ws:messages", (err) => {
    if (err) console.error("Redis subscribe error:", err);
  });

  redisClient.on("message", (_channel: string, raw: string) => {
    try {
      const { userId, message } = JSON.parse(raw);
      wsManager.sendToUser(userId, message);
    } catch (err) {
      console.error("WS message relay error:", err);
    }
  });

  assessmentQueueEvents.on("completed", ({ jobId }) => {
    console.log(`QueueEvent: job ${jobId} completed`);
  });

  assessmentQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`QueueEvent: job ${jobId} failed - ${failedReason}`);
  });

  const server = http.createServer(app);
  wsManager.init(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await redisClient.quit();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
