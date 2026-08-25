import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "./logger";
dotenv.config();

const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
const rawHost = process.env.REDIS_HOST || "";
const cleanHost = rawHost.replace(/^https?:\/\//, "").split("/")[0];

export const redis = new Redis({
  host: cleanHost,
  port: redisPort,
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  tls: {}, // Absolute requirement for Upstash secure database connections
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    logger.info("🚀 Redis Cache engine connected successfully.");
  }
});

redis.on("error", (error) => {
  logger.error("❌ Redis connection error:", error);
});
