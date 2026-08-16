import type { Server } from "http";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";
let isShuttingDown = false;

export const serverShutDown = (server: Server) => {
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.info("Shutdown already in progress...");
      return;
    }

    isShuttingDown = true;
    logger.info(`\n${signal} received.`);
    logger.info("Starting graceful shutdown...");

    server.close(async (error) => {
       if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });

        logger.info("HTTP server closed.");
      } else {
        logger.info("HTTP server is already closed.");
      }
      try {
        logger.info("Closing Database connection...");
        await prisma.$disconnect();
        logger.info("Database connection closed.");

        logger.info("Closing Redis connection...");
        await redis.quit();
        logger.info("Redis connection closed.");

        logger.info("Server shutdown completed.");

        process.exit(error ? 1 : 0);
      } catch (shutdownError) {
        logger.error(
          "Error during graceful shutdown:",
          shutdownError
        );

        process.exit(1);
      }
    });

    // Maximum shutdown time: 30 seconds
    setTimeout(() => {
      logger.error(
        "Server shutdown timed out. Forcefully terminating..."
      );

      process.exit(1);
    }, 30_000).unref();
  };

  process.on("SIGINT", () => {
    void gracefulShutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
  });
};