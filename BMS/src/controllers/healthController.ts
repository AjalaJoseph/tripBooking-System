import { Request, Response} from "express";
import { prisma } from "../config/db";
import { redis } from "../config/redis";
import { logger } from "../config/logger";
export const healthController = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  let databaseStatus = "healthy";
  let redisStatus = "healthy";

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error("Health check - Database:", error);
    databaseStatus = "unhealthy";
  }

  // Check Redis
  try {
    await redis.ping();
  } catch (error) {
    logger.error("Health check - Redis:", error);
    redisStatus = "unhealthy";
  }

  const isHealthy =
    databaseStatus === "healthy" &&
    redisStatus === "healthy";
  const responseTime = Date.now() - startTime;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    services: {
      api: "healthy",
      database: databaseStatus,
      redis: redisStatus,
    },
    uptime: process.uptime(),
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
};